"use client";

import { useState } from "react";
import { Button, Card, Field, inputCls, StepHeader } from "@/components/ui";
import { Suggest } from "@/components/Suggest";
import { reportError, writeBio } from "@/lib/ai/client";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

export function BioStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      await writeBio(book, book.authorName ?? "", (s) => updateBook(book.id, { bio: s }));
    } catch (e) {
      reportError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell>
      <StepHeader eyebrow="Step 5 · Research" title="Author Bio">
        The &ldquo;About the Author&rdquo; section for your back matter and store page.
      </StepHeader>

      <Card className="max-w-3xl space-y-5 p-6">
        <Field label="Pen name">
          <Suggest field="authorName" book={book} value={book.authorName} onPick={(authorName) => updateBook(book.id, { authorName })}>
            <input
              className={`${inputCls} pr-10`}
              value={book.authorName ?? ""}
              onChange={(e) => updateBook(book.id, { authorName: e.target.value })}
              placeholder="e.g. Alex Morgan"
            />
          </Suggest>
        </Field>
        <Field label="Bio">
          <textarea
            className={`${inputCls} h-56 leading-relaxed`}
            value={book.bio ?? ""}
            onChange={(e) => updateBook(book.id, { bio: e.target.value })}
            placeholder="Write your own, or generate one from your topic and persona."
          />
        </Field>
        <Button variant="secondary" loading={loading} onClick={run} disabled={!book.authorName?.trim()}>
          ✦ {book.bio ? "Regenerate" : "Generate"} bio
        </Button>
        {!book.authorName?.trim() && <span className="ml-3 text-xs text-muted">Enter a pen name first</span>}
      </Card>

      <StepFooter book={book} step="bio" canApprove={!!book.authorName?.trim() && !loading} />
    </StepShell>
  );
}
