"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Skeleton, StepHeader } from "@/components/ui";
import { Suggest } from "@/components/Suggest";
import { generateOutline, reportError } from "@/lib/ai/client";
import { uid, useStore } from "@/lib/store";
import type { Book, Chapter } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

export function OutlineStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [loading, setLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const started = useRef(false);
  const outline = book.outline ?? [];

  async function run() {
    if (outline.some((c) => c.sections.some((s) => s.content)) && !confirm("Regenerating replaces the outline and any written sections. Continue?")) return;
    setLoading(true);
    try {
      updateBook(book.id, { outline: await generateOutline(book) });
    } catch (e) {
      reportError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!book.outline && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (next: Chapter[]) => updateBook(book.id, { outline: next });
  const patchCh = (id: string, p: Partial<Chapter>) => set(outline.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= outline.length) return;
    const next = [...outline];
    const [c] = next.splice(from, 1);
    next.splice(to, 0, c);
    set(next);
  };

  return (
    <StepShell>
      <StepHeader eyebrow="Step 6 · Research" title="Outline Builder">
        A chapter-by-chapter structure shaped by your market gaps. Drag to reorder, rename anything, add or remove
        sections.
      </StepHeader>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={i} className="p-5">
              <Skeleton lines={3} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {outline.map((ch, i) => (
            <Card
              key={ch.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) move(dragIdx, i);
                setDragIdx(null);
              }}
              className={`group p-5 ${dragIdx === i ? "opacity-40" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex cursor-grab flex-col items-center pt-1 text-muted">
                  <span className="font-serif text-2xl font-semibold text-gold">{i + 1}</span>
                  <span className="text-xs">⋮⋮</span>
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full bg-transparent font-serif text-xl font-semibold outline-none"
                    value={ch.title}
                    onChange={(e) => patchCh(ch.id, { title: e.target.value })}
                  />
                  <Suggest
                    field="chapterSummary"
                    book={book}
                    value={ch.summary}
                    extra={`Chapter ${i + 1}: "${ch.title}". Sections: ${ch.sections.map((s) => s.title).join("; ")}`}
                    onPick={(summary) => patchCh(ch.id, { summary })}
                    subtle
                  >
                    <input
                      className="w-full bg-transparent py-1 pr-10 text-sm text-muted outline-none"
                      value={ch.summary}
                      placeholder="Chapter summary…"
                      onChange={(e) => patchCh(ch.id, { summary: e.target.value })}
                    />
                  </Suggest>
                  <ul className="mt-3 space-y-1.5">
                    {ch.sections.map((s, si) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-muted">
                          {i + 1}.{si + 1}
                        </span>
                        <input
                          className="flex-1 rounded px-1 outline-none hover:bg-paper focus:bg-paper"
                          value={s.title}
                          onChange={(e) =>
                            patchCh(ch.id, { sections: ch.sections.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) })
                          }
                        />
                        {s.content && <span className="text-xs text-emerald-600">written</span>}
                        <button
                          className="text-xs text-muted opacity-0 hover:text-rose-600 group-hover:opacity-100"
                          onClick={() => patchCh(ch.id, { sections: ch.sections.filter((x) => x.id !== s.id) })}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-2 text-xs font-medium text-gold"
                    onClick={() => patchCh(ch.id, { sections: [...ch.sections, { id: uid(), title: "New section", brief: "", content: "" }] })}
                  >
                    + Add section
                  </button>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                  <button className="rounded px-2 text-muted hover:bg-paper-2" onClick={() => move(i, i - 1)} title="Move up">
                    ↑
                  </button>
                  <button className="rounded px-2 text-muted hover:bg-paper-2" onClick={() => move(i, i + 1)} title="Move down">
                    ↓
                  </button>
                  <button
                    className="rounded px-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => confirm(`Delete “${ch.title}”?`) && set(outline.filter((c) => c.id !== ch.id))}
                    title="Delete chapter"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                set([...outline, { id: uid(), title: "New Chapter", summary: "", sections: [{ id: uid(), title: "New section", brief: "", content: "" }] }])
              }
            >
              + Add chapter
            </Button>
            <Button variant="ghost" onClick={run}>
              ↻ Regenerate outline
            </Button>
          </div>
        </div>
      )}

      <StepFooter book={book} step="outline" canApprove={outline.length > 0 && !loading} />
    </StepShell>
  );
}
