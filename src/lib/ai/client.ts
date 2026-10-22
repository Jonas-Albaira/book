"use client";

/** Browser-side wrappers around /api/ai. The API key stays on the server. */
import { uid } from "@/lib/store";
import type { Book, Chapter, MarketAnalysis, Persona, TitleOption } from "@/lib/types";

export type AgentKind = "expand" | "tighten" | "cite" | "data" | "rewrite";

export const AGENTS: { id: AgentKind; label: string; hint: string }[] = [
  { id: "expand", label: "Expand", hint: "Add depth and an example" },
  { id: "tighten", label: "Tighten", hint: "Cut filler, shorten" },
  { id: "cite", label: "Add citation", hint: "Back it with a source" },
  { id: "data", label: "Add data", hint: "Strengthen with a statistic" },
  { id: "rewrite", label: "Match voice", hint: "Rewrite in persona voice" },
];

/** Shows an error toast (see <Toaster />). Ignores user-initiated aborts. */
export function reportError(e: unknown) {
  if (e instanceof DOMException && e.name === "AbortError") return;
  const message = e instanceof Error ? e.message : String(e);
  window.dispatchEvent(new CustomEvent("ai-error", { detail: message }));
}

export type SuggestField =
  | "topic"
  | "audience"
  | "goal"
  | "title"
  | "subtitle"
  | "authorName"
  | "chapterSummary"
  | "sectionBrief"
  | "keyword";

/** Book may be a partial draft, e.g. while the new-book wizard is still being filled in. */
export const suggest = (field: SuggestField, book: Partial<Book>, current = "", extra = "") =>
  call<string[]>("suggest", book, { field, current, extra });

async function post(task: string, book: Partial<Book>, args: Record<string, unknown> = {}, signal?: AbortSignal) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, book, args }),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `AI request failed (${res.status})`);
  }
  return res;
}

async function call<T>(task: string, book: Partial<Book>, args?: Record<string, unknown>): Promise<T> {
  return (await post(task, book, args)).json();
}

/** Streams plain text, calling onChunk with the accumulated text. Resolves with what was received if aborted. */
async function streamCall(task: string, book: Book, args: Record<string, unknown>, onChunk: (soFar: string) => void, signal?: AbortSignal) {
  const res = await post(task, book, args, signal);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      onChunk(text);
    }
  } catch (e) {
    if (!(e instanceof DOMException && e.name === "AbortError")) throw e;
  }
  return text;
}

export const analyzeMarket = (b: Book) => call<MarketAnalysis>("market", b);
export const generateTitles = (b: Book) => call<TitleOption[]>("titles", b);
export const generatePersonas = (b: Book) => call<Persona[]>("personas", b);

/** Models sometimes number titles despite instructions; the UI adds its own numbering. */
const unnumber = (t: string) => t.replace(/^\s*(chapter\s+\d+\s*[:.\-–—]?|\d+(\.\d+)*[.):]?)\s+/i, "");

export async function generateOutline(b: Book): Promise<Chapter[]> {
  const chapters = await call<{ title: string; summary: string; sections: { title: string; brief: string }[] }[]>("outline", b);
  return chapters.map((c) => ({
    id: uid(),
    title: unnumber(c.title),
    summary: c.summary,
    sections: c.sections.map((s) => ({ id: uid(), title: unnumber(s.title), brief: s.brief, content: "" })),
  }));
}

export const writeBio = (b: Book, authorName: string, onChunk: (s: string) => void) => streamCall("bio", b, { authorName }, onChunk);

export const writeSection = (b: Book, chapterId: string, sectionId: string, onChunk: (s: string) => void, signal?: AbortSignal) =>
  streamCall("section", b, { chapterId, sectionId }, onChunk, signal);

export const runAgent = (kind: AgentKind, text: string, b: Book, surround: { before?: string; after?: string } = {}) =>
  call<{ result: string; note: string }>("agent", b, { kind, text, ...surround });

export const generateCoverImage = (b: Book, prompt: string, withText: boolean) =>
  call<{ image: string }>("coverImage", b, { prompt, withText }).then((r) => r.image);

export const generateDescription = (b: Book) => call<{ description: string; keywords: string[] }>("description", b);
