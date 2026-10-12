"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Field, inputCls, Skeleton, StepHeader } from "@/components/ui";
import { Suggest } from "@/components/Suggest";
import { generateTitles, reportError } from "@/lib/ai/client";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

export function TitleStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  async function run() {
    setLoading(true);
    try {
      updateBook(book.id, { titleOptions: await generateTitles(book) });
    } catch (e) {
      reportError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!book.titleOptions && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepShell>
      <StepHeader eyebrow="Step 2 · Research" title="Book Title">
        Titles built from patterns in top-ranking books and the keywords found in your market analysis. Pick one, then
        tweak it.
      </StepHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 4 }, (_, i) => (
                <Card key={i} className="p-5">
                  <Skeleton lines={2} />
                </Card>
              ))
            : book.titleOptions?.map((o) => {
                const selected = book.title === o.title && book.subtitle === o.subtitle;
                return (
                  <button
                    key={o.title + o.subtitle}
                    onClick={() => updateBook(book.id, { title: o.title, subtitle: o.subtitle })}
                    className={`w-full rounded-2xl border bg-white p-5 text-left transition ${selected ? "border-gold ring-2 ring-gold-soft" : "border-line hover:border-stone-400"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-serif text-xl font-semibold">{o.title}</div>
                        <div className="text-sm text-muted">{o.subtitle}</div>
                      </div>
                      <div className="shrink-0 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold">{o.score}/100</div>
                    </div>
                    <p className="mt-3 text-xs text-muted">💡 {o.rationale}</p>
                  </button>
                );
              })}
          <Button variant="secondary" onClick={run} loading={loading}>
            ↻ {book.titleOptions ? "Generate new options" : "Generate titles"}
          </Button>
        </div>

        <Card className="h-fit space-y-4 p-6 lg:sticky lg:top-6">
          <div className="font-semibold">Your title</div>
          <Field label="Title">
            <Suggest field="title" book={book} value={book.title} onPick={(title) => updateBook(book.id, { title })}>
              <input className={`${inputCls} pr-10`} value={book.title ?? ""} onChange={(e) => updateBook(book.id, { title: e.target.value })} />
            </Suggest>
          </Field>
          <Field label="Subtitle">
            <Suggest field="subtitle" book={book} value={book.subtitle} onPick={(subtitle) => updateBook(book.id, { subtitle })} align="top">
              <textarea className={`${inputCls} h-20 pr-10`} value={book.subtitle ?? ""} onChange={(e) => updateBook(book.id, { subtitle: e.target.value })} />
            </Suggest>
          </Field>
          <p className="text-xs text-muted">Tip: put your primary keyword in the subtitle — stores index it for search.</p>
        </Card>
      </div>

      <StepFooter book={book} step="title" canApprove={!!book.title?.trim()} note={book.title ? undefined : "Select or type a title to continue."} />
    </StepShell>
  );
}
