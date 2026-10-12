"use client";

import { useRef, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { Suggest } from "@/components/Suggest";
import { AGENTS, type AgentKind, reportError, runAgent, writeSection } from "@/lib/ai/client";
import { bookWords, wordCount } from "@/lib/steps";
import { useStore } from "@/lib/store";
import type { Book, Section } from "@/lib/types";
import { StepFooter } from "./StepFooter";

interface Suggestion {
  id: string;
  sectionId: string;
  kind: AgentKind;
  original: string;
  result: string;
  note: string;
}

export function WriteStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const outline = book.outline ?? [];
  const firstEmpty = outline.flatMap((c) => c.sections).find((s) => !s.content.trim());
  const [activeId, setActiveId] = useState(firstEmpty?.id ?? outline[0]?.sections[0]?.id);
  const [generating, setGenerating] = useState<string | null>(null);
  const [agentBusy, setAgentBusy] = useState<AgentKind | null>(null);
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const abort = useRef<AbortController | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  const chIdx = outline.findIndex((c) => c.sections.some((s) => s.id === activeId));
  const chapter = outline[chIdx];
  const section = chapter?.sections.find((s) => s.id === activeId);

  function patchSection(id: string, p: Partial<Section>) {
    updateBook(book.id, (b) => ({
      outline: b.outline?.map((c) => ({ ...c, sections: c.sections.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
    }));
  }

  // Async loops outlive renders; read the latest book (incl. just-written sections) via ref for prompt context.
  const bookRef = useRef(book);
  bookRef.current = book;

  /** Returns false if generation failed or was stopped. */
  async function generate(chapterId: string, s: Section) {
    setGenerating(s.id);
    abort.current = new AbortController();
    try {
      await writeSection(bookRef.current, chapterId, s.id, (soFar) => patchSection(s.id, { content: soFar }), abort.current.signal);
      return !abort.current.signal.aborted;
    } catch (e) {
      reportError(e);
      return false;
    } finally {
      setGenerating(null);
    }
  }

  async function generateChapter() {
    if (!chapter) return;
    for (const s of chapter.sections.filter((x) => !x.content.trim())) {
      setActiveId(s.id);
      if (!(await generate(chapter.id, s))) break;
    }
  }

  const trackSel = (e: React.SyntheticEvent<HTMLTextAreaElement>) =>
    setSel({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd });
  const selected = section ? section.content.slice(sel.start, sel.end) : "";

  async function agent(kind: AgentKind) {
    if (!section || !selected.trim()) return;
    setAgentBusy(kind);
    try {
      const { result, note } = await runAgent(kind, selected, book, {
        before: section.content.slice(Math.max(0, sel.start - 300), sel.start),
        after: section.content.slice(sel.end, sel.end + 300),
      });
      setSuggestions((xs) => [{ id: crypto.randomUUID(), sectionId: section.id, kind, original: selected, result, note }, ...xs]);
    } catch (e) {
      reportError(e);
    } finally {
      setAgentBusy(null);
    }
  }

  function apply(s: Suggestion) {
    const target = outline.flatMap((c) => c.sections).find((x) => x.id === s.sectionId);
    if (!target) return;
    const i = target.content.indexOf(s.original);
    if (i < 0) {
      alert("The original text has changed since this suggestion was made.");
      return;
    }
    patchSection(s.sectionId, { content: target.content.slice(0, i) + s.result + target.content.slice(i + s.original.length) });
    setSuggestions((xs) => xs.filter((x) => x.id !== s.id));
  }

  const words = bookWords(book);
  const pct = Math.min(100, Math.round((words / book.targetWords) * 100));
  const sectionSuggestions = suggestions.filter((s) => s.sectionId === activeId);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Chapter tree */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-line bg-paper p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Manuscript</div>
          {outline.map((c, ci) => (
            <div key={c.id} className="mb-3">
              <div className="truncate px-2 text-sm font-semibold">
                {ci + 1}. {c.title}
              </div>
              {c.sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    setSel({ start: 0, end: 0 });
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs ${activeId === s.id ? "bg-white font-medium shadow-sm" : "text-muted hover:bg-white/60"}`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${generating === s.id ? "animate-pulse bg-gold" : s.content.trim() ? "bg-emerald-500" : "bg-line"}`} />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/90 px-10 py-3 backdrop-blur">
            <div className="text-xs text-muted">
              Book progress: <b className="text-ink">{words.toLocaleString()}</b> / {book.targetWords.toLocaleString()} words ({pct}%)
              <div className="mt-1 h-1 w-48 rounded-full bg-paper-2">
                <div className="h-1 rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex gap-2">
              {generating ? (
                <Button variant="secondary" onClick={() => abort.current?.abort()}>
                  ■ Stop
                </Button>
              ) : (
                <Button variant="secondary" onClick={generateChapter} disabled={!chapter?.sections.some((s) => !s.content.trim())}>
                  ✦ Write rest of chapter
                </Button>
              )}
            </div>
          </div>

          {section && chapter ? (
            <div className="mx-auto w-full max-w-3xl px-10 py-10">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Chapter {chIdx + 1} · {chapter.title}
              </div>
              <input
                className="mt-2 w-full bg-transparent font-serif text-3xl font-semibold outline-none"
                value={section.title}
                onChange={(e) => patchSection(section.id, { title: e.target.value })}
              />
              <Suggest
                field="sectionBrief"
                book={book}
                value={section.brief}
                extra={`Chapter ${chIdx + 1}: "${chapter.title}"${chapter.summary ? ` (${chapter.summary})` : ""}. Section: "${section.title}".`}
                onPick={(brief) => patchSection(section.id, { brief })}
                className="mt-2"
              >
                <input
                  className="w-full rounded-lg border border-transparent bg-transparent py-1 pl-2 pr-10 text-sm text-muted outline-none hover:border-line focus:border-line focus:bg-white"
                  placeholder="Optional brief: key points, stories or angles this section should cover…"
                  value={section.brief}
                  onChange={(e) => patchSection(section.id, { brief: e.target.value })}
                />
              </Suggest>

              {!section.content && generating !== section.id ? (
                <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
                  <div className="font-serif text-xl">This section is empty</div>
                  <p className="mt-1 text-sm text-muted">Generate a first draft in your persona&apos;s voice, or start typing.</p>
                  <div className="mt-5 flex justify-center gap-3">
                    <Button variant="gold" onClick={() => generate(chapter.id, section)}>
                      ✦ Generate section
                    </Button>
                    <Button variant="secondary" onClick={() => patchSection(section.id, { content: " " })}>
                      Write myself
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    ref={ta}
                    value={section.content}
                    readOnly={generating === section.id}
                    onChange={(e) => patchSection(section.id, { content: e.target.value })}
                    onSelect={trackSel}
                    onMouseUp={trackSel}
                    onKeyUp={trackSel}
                    className="mt-6 min-h-[60vh] w-full resize-none bg-transparent font-serif text-[17px] leading-8 outline-none"
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                  />
                  <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                    <span>{wordCount(section.content)} words in this section</span>
                    {generating === section.id ? (
                      <span className="flex items-center gap-2">
                        <Spinner /> Writing…
                      </span>
                    ) : (
                      <button className="hover:text-ink" onClick={() => generate(chapter.id, section)}>
                        ↻ Regenerate section
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-10 text-muted">Select a section.</div>
          )}
        </div>

        {/* Agents panel */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-line bg-white p-5">
          <div className="font-semibold">Inline agents</div>
          <p className="mt-1 text-xs text-muted">
            {selected.trim() ? (
              <>
                <b className="text-ink">{wordCount(selected)} words</b> selected — choose an agent:
              </>
            ) : (
              "Highlight text in the editor to expand, tighten, cite or strengthen it."
            )}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                disabled={!selected.trim() || !!agentBusy || !!generating}
                onClick={() => agent(a.id)}
                title={a.hint}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-2 py-2 text-xs font-medium hover:border-gold hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-transparent"
              >
                {agentBusy === a.id && <Spinner />}
                {a.label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="font-semibold">Review & apply</div>
            {sectionSuggestions.length > 0 && <span className="rounded-full bg-gold-soft px-2 text-xs text-gold">{sectionSuggestions.length}</span>}
          </div>
          {sectionSuggestions.length === 0 && <p className="mt-2 text-xs text-muted">Agent suggestions appear here for you to accept or reject.</p>}
          <div className="mt-3 space-y-3">
            {sectionSuggestions.map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-3 text-xs">
                <div className="mb-2 font-semibold uppercase tracking-wider text-gold">{AGENTS.find((a) => a.id === s.kind)?.label}</div>
                <div className="line-clamp-3 text-rose-700 line-through decoration-rose-300">{s.original}</div>
                <div className="mt-2 text-emerald-800">{s.result}</div>
                <div className="mt-2 italic text-muted">{s.note}</div>
                <div className="mt-3 flex gap-2">
                  <Button className="!px-3 !py-1 text-xs" onClick={() => apply(s)}>
                    Apply
                  </Button>
                  <Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => setSuggestions((xs) => xs.filter((x) => x.id !== s.id))}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-10 [&>div]:mt-0">
        <StepFooter book={book} step="write" canApprove={bookWords(book) > 0 && !generating} />
      </div>
    </div>
  );
}
