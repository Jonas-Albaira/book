"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, inputCls, Skeleton, StepHeader } from "@/components/ui";
import { Suggest } from "@/components/Suggest";
import { mdToHtml } from "@/lib/export";
import { generateDescription, reportError } from "@/lib/ai/client";
import { revealText } from "@/lib/util";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

export function DescriptionStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [loading, setLoading] = useState(false);
  const [kw, setKw] = useState("");
  const started = useRef(false);

  async function run() {
    setLoading(true);
    try {
      const { description, keywords } = await generateDescription(book);
      if (!book.keywords?.length) updateBook(book.id, { keywords: keywords.slice(0, 7) });
      await revealText(description, (s) => updateBook(book.id, { description: s }));
    } catch (e) {
      reportError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!book.description && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keywords = book.keywords ?? [];
  const chars = book.description?.length ?? 0;

  return (
    <StepShell>
      <StepHeader eyebrow="Step 9 · Write" title="Book Description">
        Store-page copy that converts browsers into buyers, plus the 7 backend keywords used by Amazon KDP.
      </StepHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Editor</div>
            <span className={`text-xs ${chars > 4000 ? "text-rose-600" : "text-muted"}`}>{chars} / 4000 chars</span>
          </div>
          {loading && !book.description ? (
            <div className="mt-4">
              <Skeleton lines={10} />
            </div>
          ) : (
            <textarea
              className={`${inputCls} mt-4 h-96 font-mono text-xs leading-relaxed`}
              value={book.description ?? ""}
              onChange={(e) => updateBook(book.id, { description: e.target.value })}
            />
          )}
          <p className="mt-2 text-xs text-muted">Supports **bold**, *italic* and “- ” bullet lists.</p>
          <Button variant="secondary" className="mt-4" loading={loading} onClick={run}>
            ↻ Regenerate
          </Button>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Store preview</div>
            <div className="mt-3 font-serif text-xl font-semibold">{book.title}</div>
            <div className="text-sm text-muted">{book.subtitle}</div>
            {book.authorName && <div className="mt-1 text-sm text-sky-700">by {book.authorName}</div>}
            <div
              className="mt-4 space-y-3 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: mdToHtml(book.description ?? "") }}
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Backend keywords</div>
              <span className="text-xs text-muted">{keywords.length} / 7</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k} className="flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1 text-sm">
                  {k}
                  <button className="text-muted hover:text-rose-600" onClick={() => updateBook(book.id, { keywords: keywords.filter((x) => x !== k) })}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            {keywords.length < 7 && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (kw.trim() && !keywords.includes(kw.trim())) updateBook(book.id, { keywords: [...keywords, kw.trim()] });
                  setKw("");
                }}
              >
                <Suggest
                  field="keyword"
                  book={book}
                  value={kw}
                  extra={keywords.length ? `Existing keywords: ${keywords.join("; ")}` : ""}
                  onPick={(k) => !keywords.includes(k) && updateBook(book.id, { keywords: [...keywords, k] })}
                  className="flex-1"
                >
                  <input className={`${inputCls} pr-10`} value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Add keyword phrase" />
                </Suggest>
                <Button type="submit" variant="secondary">
                  Add
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      <StepFooter book={book} step="description" canApprove={!!book.description?.trim() && !loading} />
    </StepShell>
  );
}
