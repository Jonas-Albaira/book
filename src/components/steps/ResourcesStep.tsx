"use client";

import { useState } from "react";
import { Button, Card, inputCls, StepHeader } from "@/components/ui";
import { uid, useStore } from "@/lib/store";
import type { Book, Resource } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

const ICON: Record<Resource["kind"], string> = { link: "🔗", note: "📝", file: "📄" };

export function ResourcesStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [kind, setKind] = useState<Resource["kind"]>("link");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");

  function add(r: Omit<Resource, "id">) {
    updateBook(book.id, (b) => ({ resources: [...b.resources, { ...r, id: uid() }] }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    for (const f of Array.from(e.target.files ?? [])) {
      const text = f.type.startsWith("text") || /\.(md|txt)$/i.test(f.name) ? (await f.text()).slice(0, 2000) : `${(f.size / 1024).toFixed(0)} KB`;
      add({ kind: "file", label: f.name, detail: text });
    }
    e.target.value = "";
  }

  return (
    <StepShell>
      <StepHeader eyebrow="Step 3 · Research" title="Resources & References">
        Give the AI your own knowledge: articles, studies, notes, or files. These are used to ground the writing and
        suggest citations. Optional — skip if you don&apos;t have any yet.
      </StepHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {book.resources.length === 0 && (
            <Card className="border-dashed p-10 text-center text-sm text-muted">No resources yet.</Card>
          )}
          {book.resources.map((r) => (
            <Card key={r.id} className="flex items-start gap-4 p-4">
              <span className="text-xl">{ICON[r.kind]}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.label}</div>
                <div className="line-clamp-2 text-xs text-muted">{r.detail}</div>
              </div>
              <button
                className="text-xs text-muted hover:text-rose-600"
                onClick={() => updateBook(book.id, (b) => ({ resources: b.resources.filter((x) => x.id !== r.id) }))}
              >
                Remove
              </button>
            </Card>
          ))}
        </div>

        <Card className="h-fit space-y-4 p-6">
          <div className="flex gap-1 rounded-full bg-paper-2 p-1 text-sm">
            {(["link", "note"] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`flex-1 rounded-full py-1.5 capitalize ${kind === k ? "bg-white shadow-sm" : ""}`}>
                {k}
              </button>
            ))}
          </div>
          <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === "link" ? "https://…" : "Note title"} />
          <textarea
            className={`${inputCls} h-24`}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={kind === "link" ? "Why is this useful? (optional)" : "Your notes, anecdotes, expertise…"}
          />
          <Button
            className="w-full"
            disabled={!label.trim()}
            onClick={() => {
              add({ kind, label: label.trim(), detail: detail.trim() });
              setLabel("");
              setDetail("");
            }}
          >
            Add {kind}
          </Button>
          <label className="block cursor-pointer rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted hover:border-gold">
            📄 Upload files (.txt, .md, .pdf)
            <input type="file" multiple className="hidden" onChange={onFile} />
          </label>
        </Card>
      </div>

      <StepFooter book={book} step="resources" />
    </StepShell>
  );
}
