/**
 * Server-only OpenAI layer. Never import this from a client component — it
 * reads OPENAI_API_KEY from the environment.
 */
import OpenAI from "openai";
import type { Book, Chapter, MarketAnalysis, Persona, TitleOption } from "@/lib/types";
import type { AgentKind, SuggestField } from "./client";

/** Fast model for structured/short tasks; stronger model for long-form prose. */
const FAST = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const WRITER = process.env.OPENAI_WRITING_MODEL || "gpt-5.5";

export class AiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

let client: OpenAI | null = null;
function openai() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiError("OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.");
  }
  return (client ??= new OpenAI());
}

// ---------- JSON schema helpers (strict structured outputs) ----------

type Schema = Record<string, unknown>;
const str: Schema = { type: "string" };
const num: Schema = { type: "number" };
const int: Schema = { type: "integer" };
const arr = (items: Schema): Schema => ({ type: "array", items });
const obj = (properties: Record<string, Schema>): Schema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

async function json<T>(name: string, schema: Schema, system: string, user: string, signal: AbortSignal): Promise<T> {
  const res = await openai().chat.completions.create(
    {
      model: FAST,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
    },
    { signal },
  );
  const msg = res.choices[0]?.message;
  if (msg?.refusal) throw new AiError(msg.refusal, 422);
  if (!msg?.content) throw new AiError("The model returned an empty response.", 502);
  return JSON.parse(msg.content) as T;
}

async function stream(system: string, user: string, model: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  // Awaiting create() here means auth/model errors surface as a normal error response, before any bytes are sent.
  const s = await openai().chat.completions.create(
    {
      model,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { signal },
  );
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of s) {
          const t = chunk.choices[0]?.delta?.content;
          if (t) controller.enqueue(enc.encode(t));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() {
      s.controller.abort();
    },
  });
}

// ---------- shared book context ----------

function outlineText(b: Book) {
  return (b.outline ?? [])
    .map((c, i) => `${i + 1}. ${c.title}${c.summary ? ` — ${c.summary}` : ""}\n${c.sections.map((s) => `   - ${s.title}`).join("\n")}`)
    .join("\n");
}

function context(b: Book, { outline = false } = {}) {
  return [
    `Book type: ${b.genre}`,
    b.topic && `Topic / premise: ${b.topic}`,
    b.audience && `Target reader: ${b.audience}`,
    b.goal && `What readers should walk away with: ${b.goal}`,
    b.tone && `Tone: ${b.tone}`,
    b.targetWords && `Target length: ~${b.targetWords.toLocaleString()} words`,
    b.title && `Title: ${b.title}${b.subtitle ? ` — ${b.subtitle}` : ""}`,
    b.authorName && `Author pen name: ${b.authorName}`,
    b.persona && `Author voice: "${b.persona.name}" (${b.persona.voice}). ${b.persona.description}`,
    b.market?.gaps.length && `Market gaps this book should fill: ${b.market.gaps.join("; ")}`,
    b.market?.painPoints.length && `Reader complaints about competing books: ${b.market.painPoints.join("; ")}`,
    b.resources?.length &&
      `Author-provided resources:\n${b.resources.map((r) => `- [${r.kind}] ${r.label}${r.detail ? `: ${r.detail.slice(0, 600)}` : ""}`).join("\n")}`,
    outline && b.outline?.length && `Outline:\n${outlineText(b)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const NO_FABRICATION =
  "Never invent statistics, studies, quotes, or citations. If a claim would need a source, phrase it generally or use a bracketed placeholder like [citation needed: ...].";

// ---------- tasks ----------

type Args = Record<string, unknown>;
type TaskFn = (b: Book, args: Args, signal: AbortSignal) => Promise<unknown>;

const tasks: Record<string, TaskFn> = {
  async market(b, _a, signal) {
    const competitor = obj({ title: str, author: str, rating: num, reviews: int, bsr: int, price: num, pages: int, monthlyRevenue: int });
    const r = await json<MarketAnalysis>(
      "market_analysis",
      obj({ demand: int, competition: int, opportunity: int, avgPrice: num, competitors: arr(competitor), painPoints: arr(str), gaps: arr(str), keywords: arr(str) }),
      "You are a book-market analyst for self-publishers on Amazon KDP. You do not have live sales data, so base your analysis on what you know about this niche, and treat all numbers as rough estimates.",
      `${context(b)}

Analyse the market for this book:
- competitors: 5 real, well-known books in this niche if you know them (title, author), with estimated rating, review count, Amazon Best Sellers Rank, price (USD), page count and estimated monthly revenue (USD).
- painPoints: 5 recurring reader complaints about existing books (as they'd appear in 1–3★ reviews).
- gaps: 4 specific angles a new book could take to stand out.
- keywords: 7 search phrases buyers would type.
- demand, competition, opportunity: 0–100 scores. avgPrice: average competitor price.`,
      signal,
    );
    r.competitors.sort((x, y) => x.bsr - y.bsr);
    return r;
  },

  async titles(b, _a, signal) {
    const { options } = await json<{ options: TitleOption[] }>(
      "titles",
      obj({ options: arr(obj({ title: str, subtitle: str, rationale: str, score: int })) }),
      "You are an expert at writing book titles that sell on Amazon.",
      // Leave out the current title, or the model anchors on it and every option reuses it.
      `${context({ ...b, title: undefined, subtitle: undefined })}
${b.titleOptions?.length ? `\nPreviously suggested (propose fresh alternatives, don't repeat these): ${b.titleOptions.map((o) => o.title).join("; ")}\n` : ""}
Propose 6 distinct title + subtitle combinations.${b.genre === "fiction" ? " For fiction, the subtitle can be a short tagline or series line." : " Subtitles should front-load the main keyword and promise a clear benefit."}
The subtitle must not repeat the title. For each, give a one-sentence rationale and a 0–100 score for expected market appeal. Sort by score, highest first.`,
      signal,
    );
    return options;
  },

  async personas(b, _a, signal) {
    const { personas } = await json<{ personas: Persona[] }>(
      "personas",
      obj({ personas: arr(obj({ name: str, voice: str, description: str, sample: str })) }),
      "You help authors find the right narrative voice for their book.",
      `${context(b)}

Propose 3 clearly different author personas/voices suited to this book and audience.
- name: a short label (e.g. "The Trusted Expert")
- voice: 3–5 adjectives
- description: one sentence on how this voice writes
- sample: 2–3 sentences of opening prose about this book's topic, written in that voice.`,
      signal,
    );
    return personas;
  },

  async outline(b, _a, signal) {
    const chapters = Math.max(6, Math.min(16, Math.round(b.targetWords / 4000)));
    const { chapters: out } = await json<{ chapters: { title: string; summary: string; sections: { title: string; brief: string }[] }[] }>(
      "outline",
      obj({ chapters: arr(obj({ title: str, summary: str, sections: arr(obj({ title: str, brief: str })) })) }),
      "You are a developmental editor who builds tight, compelling book outlines.",
      `${context(b)}

Create a chapter-by-chapter outline with about ${chapters} chapters, each with 3–4 sections.
${b.genre === "fiction" ? "Follow a strong story structure with escalating stakes, a midpoint turn, a dark moment and a satisfying resolution." : "Open with why it matters, build a clear framework, then practical application, obstacles, and an action plan. Use the market gaps to differentiate."}
Titles must not include numbering or "Chapter X" prefixes. summary: one sentence on the chapter's purpose. brief: one sentence on what the section covers.`,
      signal,
    );
    return out;
  },

  async bio(b, a, signal) {
    return stream(
      "You write 'About the Author' bios for book back matter. Output only the bio text in plain prose, two short paragraphs, third person. No headings or markdown.",
      `${context(b)}

Write the bio for ${String(a.authorName || "the author")}. Make it credible and warm, tied to the book's topic, without inventing specific credentials, awards, institutions or numbers — keep claims general so the author can personalise them.`,
      FAST,
      signal,
    );
  },

  async section(b, a, signal) {
    const outline = b.outline ?? [];
    const ci = outline.findIndex((c) => c.id === a.chapterId);
    const ch: Chapter | undefined = outline[ci];
    const si = ch?.sections.findIndex((s) => s.id === a.sectionId) ?? -1;
    const sec = ch?.sections[si];
    if (!ch || !sec) throw new AiError("Section not found.", 400);

    const flat = outline.flatMap((c) => c.sections);
    const idx = flat.findIndex((s) => s.id === sec.id);
    const prev = flat.slice(0, idx).reverse().find((s) => s.content.trim());
    const next = flat[idx + 1];
    const words = Math.max(250, Math.min(1200, Math.round(b.targetWords / Math.max(1, flat.length))));

    return stream(
      `You are a professional ghostwriter${b.persona ? ` writing in the voice of "${b.persona.name}" (${b.persona.voice})` : ""}. Output only the prose for the requested section: no headings, no section title, no markdown, no preamble or closing remarks. Separate paragraphs with a blank line.${b.genre === "nonfiction" ? ` ${NO_FABRICATION}` : ""}`,
      `${context(b, { outline: true })}

Write Chapter ${ci + 1} ("${ch.title}"), section ${si + 1}: "${sec.title}".
${ch.summary ? `Chapter purpose: ${ch.summary}\n` : ""}${sec.brief ? `Section brief: ${sec.brief}\n` : ""}${prev ? `\nThe text just before this section ends with:\n"""${prev.content.trim().slice(-1200)}"""\nContinue naturally from it without repeating it.\n` : "\nThis is the opening of the book.\n"}${next ? `The next section is "${next.title}" — don't cover its material.\n` : ""}
Length: about ${words} words.${b.genre === "fiction" ? " Show, don't tell; use scene, dialogue and sensory detail." : " Be concrete and practical, with examples the target reader will relate to."}`,
      WRITER,
      signal,
    );
  },

  async agent(b, a, signal) {
    const kind = a.kind as AgentKind;
    const instructions: Record<AgentKind, string> = {
      expand: "Expand the passage with more depth and one concrete, relatable example.",
      tighten: "Tighten the passage: cut filler and redundancy, simplify long sentences, keep the meaning. The result must be noticeably shorter.",
      cite: `Add support from a source. If one of the author-provided resources is relevant, reference it by name. Otherwise do not invent a reference — add a placeholder like [citation needed: <the kind of source that would support this>].`,
      data: `Strengthen the passage with a relevant statistic or data point, naming the source in-text, but only if you are confident it is real and widely reported. If not, add a placeholder like [data needed: <the statistic to look up>].`,
      rewrite: `Rewrite the passage to match the author's persona voice${b.persona ? ` ("${b.persona.name}": ${b.persona.voice})` : ""}.`,
    };
    return json<{ result: string; note: string }>(
      "agent_edit",
      obj({ result: str, note: str }),
      `You are an inline editing assistant inside a book-writing app. The passage you return replaces the selected text exactly in place, so it must fit grammatically with the surrounding text. Keep the author's voice. ${NO_FABRICATION}`,
      `${context(b)}

Task: ${instructions[kind]}
${a.before ? `Text before the selection: """${String(a.before)}"""\n` : ""}Selected passage: """${String(a.text)}"""
${a.after ? `Text after the selection: """${String(a.after)}"""\n` : ""}
Return "result" (the replacement passage only) and "note" (one short sentence, max 25 words, on what you changed and anything the author should verify).`,
      signal,
    );
  },

  async description(b, _a, signal) {
    return json<{ description: string; keywords: string[] }>(
      "description",
      obj({ description: str, keywords: arr(str) }),
      "You are a copywriter who writes high-converting Amazon book descriptions.",
      `${context(b, { outline: true })}

Write the store description (150–300 words). Open with a bold hook line, speak to the reader's problem or desire, ${b.genre === "fiction" ? "tease the premise and stakes without spoilers" : "include a bulleted list of what they'll learn"}, and end with a call to action.
Formatting: plain text with **bold**, *italic*, and "- " bullet lines only; separate paragraphs with a blank line. ${NO_FABRICATION}
Also return exactly 7 backend keyword phrases buyers would search for (don't repeat words from the title).`,
      signal,
    );
  },

  /** Short suggestions for a single form field. The book may be a partial draft (e.g. from the new-book wizard). */
  async suggest(b, a, signal) {
    const field = String(a.field) as SuggestField;
    const spec = SUGGEST_FIELDS[field] as string | undefined;
    if (!spec) throw new AiError(`Unknown field "${field}".`, 400);
    const current = String(a.current ?? "").trim();
    const { suggestions } = await json<{ suggestions: string[] }>(
      "suggestions",
      obj({ suggestions: arr(str) }),
      "You suggest values for form fields in a book-writing app. Each suggestion is a ready-to-use value: no numbering, quotes, labels or explanations.",
      `${context(b)}
${a.extra ? `\n${String(a.extra)}\n` : ""}
Field: ${spec}
${current ? `The author's current value is: "${current}". Offer 3 improved or alternative versions in the same spirit.` : "Offer 3 distinct options."}`,
      signal,
    );
    return suggestions.slice(0, 3);
  },
};

const SUGGEST_FIELDS: Record<SuggestField, string> = {
  topic: "A specific, marketable book topic (non-fiction) or one-sentence premise (fiction) with a clear angle. Max 20 words.",
  audience: "A specific description of the target reader, as a short phrase (max 12 words).",
  goal: "One sentence describing what readers should be able to do or feel after the book.",
  title: "A short, memorable main book title (no subtitle).",
  subtitle: "A subtitle that front-loads a search keyword and promises a clear benefit. Must not repeat the title.",
  authorName: "A believable pen name that suits the genre and audience.",
  chapterSummary: "One sentence on this chapter's purpose in the book.",
  sectionBrief: "One sentence on the key points, story or angle this section should cover.",
  keyword: "A backend search keyword phrase (2–5 words) buyers would type. Don't repeat words from the title or the existing keywords.",
};

export async function runTask(task: string, book: Book, args: Args, signal: AbortSignal) {
  const fn = tasks[task];
  if (!fn) throw new AiError(`Unknown task "${task}".`, 400);
  return fn(book, args, signal);
}
