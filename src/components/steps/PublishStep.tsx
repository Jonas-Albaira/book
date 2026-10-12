"use client";

import { useState } from "react";
import { Cover } from "@/components/Cover";
import { Button, Card, StepHeader } from "@/components/ui";
import { download, slug, toHtml, toMarkdown } from "@/lib/export";
import { bookWords, STEPS } from "@/lib/steps";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

const COMING_SOON = [
  { icon: "🖼", name: "A+ Content", text: "Enhanced brand modules for your product page." },
  { icon: "🎬", name: "Book Trailer", text: "1080p trailer for Sponsored Brands video ads." },
  { icon: "📣", name: "Video Ads", text: "Short ad creatives for social campaigns." },
];

export function PublishStep({ book }: { book: Book }) {
  const [page, setPage] = useState(0);
  const chapters = (book.outline ?? []).filter((c) => c.sections.some((s) => s.content.trim()));
  const words = bookWords(book);
  const name = slug(book.title ?? book.topic);

  const checklist: [string, boolean][] = [
    ["Title & subtitle", !!book.title],
    ["Author name & bio", !!book.authorName && !!book.bio],
    ["All sections written", !!book.outline?.every((c) => c.sections.every((s) => s.content.trim()))],
    ["Book description", !!book.description],
    ["7 backend keywords", (book.keywords?.length ?? 0) >= 7],
    ["Cover selected", !!book.cover],
    ["Human proofread", false],
  ];

  const pages: { label: string; body: React.ReactNode }[] = [
    {
      label: "Title page",
      body: (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="font-serif text-3xl font-semibold">{book.title}</div>
          <div className="mt-2 italic text-muted">{book.subtitle}</div>
          <div className="mt-12 text-sm uppercase tracking-widest">{book.authorName}</div>
        </div>
      ),
    },
    {
      label: "Contents",
      body: (
        <div>
          <div className="mb-6 font-serif text-2xl font-semibold">Contents</div>
          <ol className="space-y-2 text-sm">
            {(book.outline ?? []).map((c, i) => (
              <li key={c.id} className="flex gap-2">
                <span className="text-muted">{i + 1}.</span>
                <span className="flex-1 border-b border-dotted border-line">{c.title}</span>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    ...chapters.map((c) => ({
      label: c.title,
      body: (
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Chapter {(book.outline ?? []).indexOf(c) + 1}</div>
          <div className="mb-6 mt-1 font-serif text-2xl font-semibold">{c.title}</div>
          {c.sections
            .filter((s) => s.content.trim())
            .map((s) => (
              <div key={s.id} className="prose-book font-serif text-[15px]">
                <h3 className="mb-2 mt-6 font-sans text-sm font-semibold">{s.title}</h3>
                {s.content.trim().split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ))}
        </div>
      ),
    })),
  ];
  const cur = pages[Math.min(page, pages.length - 1)];

  return (
    <StepShell>
      <StepHeader eyebrow="Step 11 · Publish" title="Preview & Export">
        Read your book the way readers will, run the launch checklist, and export files ready for KDP, IngramSpark,
        Draft2Digital and more.
      </StepHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mx-auto max-h-[75vh] min-h-[560px] max-w-xl overflow-y-auto rounded-sm border border-line bg-[#fffdf8] px-14 py-14 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            {cur.body}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
              ← Prev
            </Button>
            <select className="rounded-lg border border-line bg-white px-2 py-1" value={page} onChange={(e) => setPage(+e.target.value)}>
              {pages.map((p, i) => (
                <option key={i} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button variant="ghost" disabled={page >= pages.length - 1} onClick={() => setPage(page + 1)}>
              Next →
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {book.cover && (
            <div className="mx-auto w-32">
              <Cover title={book.title ?? book.topic} subtitle={book.subtitle} author={book.authorName} cfg={book.cover} />
            </div>
          )}
          <Card className="p-5">
            <div className="font-semibold">Export</div>
            <p className="mt-1 text-xs text-muted">
              {words.toLocaleString()} words · ~{Math.max(1, Math.round(words / 250))} print pages
            </p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => download(`${name}.html`, toHtml(book), "text/html")}>⬇ Print-ready HTML (6×9)</Button>
              <Button variant="secondary" onClick={() => download(`${name}.md`, toMarkdown(book), "text/markdown")}>
                ⬇ Markdown manuscript
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (!w) return;
                  w.document.write(toHtml(book));
                  w.document.close();
                  w.onload = () => w.print();
                }}
              >
                🖨 Save as PDF
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="font-semibold">Launch checklist</div>
            <ul className="mt-3 space-y-2 text-sm">
              {checklist.map(([label, ok]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${ok ? "bg-emerald-500 text-white" : "bg-paper-2 text-muted"}`}>{ok ? "✓" : ""}</span>
                  <span className={ok ? "" : "text-muted"}>{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              {book.completed.length}/{STEPS.length} workflow steps approved. Always have a human proofread before publishing.
            </p>
          </Card>

          <div className="space-y-2">
            {COMING_SOON.map((c) => (
              <div key={c.name} className="flex gap-3 rounded-xl border border-dashed border-line p-3 text-sm opacity-70">
                <span>{c.icon}</span>
                <div>
                  <div className="font-medium">
                    {c.name} <span className="ml-1 rounded bg-paper-2 px-1.5 text-[10px] uppercase">Soon</span>
                  </div>
                  <div className="text-xs text-muted">{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepFooter book={book} step="publish" />
    </StepShell>
  );
}
