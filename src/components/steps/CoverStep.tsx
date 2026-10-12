"use client";

import { useState } from "react";
import { Cover } from "@/components/Cover";
import { Button, Card, Field, StepHeader } from "@/components/ui";
import { COVER_PALETTES } from "@/lib/util";
import { useStore } from "@/lib/store";
import type { Book, CoverConfig } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

function variants(book: Book, seed: number): CoverConfig[] {
  const palettes = COVER_PALETTES[book.genre];
  return palettes.map((p, i) => ({
    ...p,
    template: (i + seed) % 4,
    font: book.genre === "fiction" || (i + seed) % 3 === 0 ? "serif" : "sans",
  }));
}

export function CoverStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [seed, setSeed] = useState(0);

  const options = variants(book, seed);
  const cfg = book.cover ?? options[0];
  const setCfg = (p: Partial<CoverConfig>) => updateBook(book.id, { cover: { ...cfg, ...p } });
  const props = { title: book.title ?? book.topic, subtitle: book.subtitle, author: book.authorName };

  return (
    <StepShell>
      <StepHeader eyebrow="Step 10 · Publish" title="Cover Design">
        Genre-aware cover concepts for <b>{book.genre === "fiction" ? "fiction" : "non-fiction"}</b>. Pick a variant, then
        fine-tune colours, layout and type.
      </StepHeader>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {options.map((o, i) => {
              const selected = book.cover && JSON.stringify(book.cover) === JSON.stringify(o);
              return (
                <button key={i} onClick={() => updateBook(book.id, { cover: o })} className={`rounded-md p-1 transition ${selected ? "ring-2 ring-gold" : "hover:-translate-y-1"}`}>
                  <Cover {...props} cfg={o} />
                </button>
              );
            })}
          </div>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => setSeed((s) => s + 1)}
          >
            ↻ Shuffle layouts
          </Button>
        </div>

        <div className="space-y-6">
          <div className="mx-auto w-56" style={{ perspective: 1000 }}>
            <div style={{ transform: "rotateY(-14deg)" }}>
              <Cover {...props} cfg={cfg} />
            </div>
          </div>
          <Card className="space-y-4 p-5">
            <Field label="Layout">
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((t) => (
                  <button key={t} onClick={() => setCfg({ template: t })} className={`rounded-lg border py-1.5 text-xs ${cfg.template % 4 === t ? "border-gold bg-gold-soft" : "border-line"}`}>
                    {["Classic", "Bold", "Band", "Frame"][t]}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              {(["bg", "fg", "accent"] as const).map((k) => (
                <Field key={k} label={{ bg: "Background", fg: "Text", accent: "Accent" }[k]}>
                  <input type="color" value={cfg[k]} onChange={(e) => setCfg({ [k]: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-line" />
                </Field>
              ))}
            </div>
            <Field label="Typeface">
              <div className="grid grid-cols-2 gap-2">
                {(["serif", "sans"] as const).map((f) => (
                  <button key={f} onClick={() => setCfg({ font: f })} className={`rounded-lg border py-1.5 text-sm ${f === "serif" ? "font-serif" : "font-sans"} ${cfg.font === f ? "border-gold bg-gold-soft" : "border-line"}`}>
                    {f === "serif" ? "Serif" : "Sans"}
                  </button>
                ))}
              </div>
            </Field>
          </Card>
        </div>
      </div>

      <StepFooter book={book} step="cover" canApprove={!!book.cover} note={book.cover ? undefined : "Pick a cover variant to continue."} />
    </StepShell>
  );
}
