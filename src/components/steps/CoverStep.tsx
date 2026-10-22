"use client";

import { useState } from "react";
import { Cover } from "@/components/Cover";
import { Button, Card, Field, inputCls, StepHeader } from "@/components/ui";
import { generateCoverImage, reportError } from "@/lib/ai/client";
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
  const [prompt, setPrompt] = useState(book.cover?.imagePrompt ?? "");
  const [withText, setWithText] = useState(book.cover?.imageText ?? false);
  const [generating, setGenerating] = useState(false);
  // The last AI art stays pickable after switching to a CSS variant.
  const [aiCover, setAiCover] = useState(book.cover?.image ? book.cover : undefined);

  const options = variants(book, seed);
  const cfg = book.cover ?? options[0];
  const setCfg = (p: Partial<CoverConfig>) => {
    const next = { ...cfg, ...p };
    if (next.image) setAiCover(next);
    updateBook(book.id, { cover: next });
  };
  const props = { title: book.title ?? book.topic, subtitle: book.subtitle, author: book.authorName };

  async function generate() {
    setGenerating(true);
    try {
      const image = await generateCoverImage(book, prompt, withText);
      const next: CoverConfig = { ...cfg, image, imageText: withText, imagePrompt: prompt, fg: "#ffffff" };
      setAiCover(next);
      updateBook(book.id, { cover: next });
    } catch (e) {
      reportError(e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <StepShell>
      <StepHeader eyebrow="Step 10 · Publish" title="Cover Design">
        Genre-aware cover concepts for <b>{book.genre === "fiction" ? "fiction" : "non-fiction"}</b>. Pick a variant, then
        fine-tune colours, layout and type, or generate original cover art with AI.
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

          <Card className="mt-8 space-y-4 p-5">
            <div>
              <div className="font-semibold">✦ AI cover art</div>
              <p className="mt-1 text-xs text-muted">Generates original artwork from your book&apos;s details. Takes up to a minute.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
              <div className="space-y-4">
                <Field label="Art direction" hint="Optional: style, mood, imagery or colours.">
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={book.genre === "fiction" ? "e.g. moody watercolour, a lone lighthouse in a storm, teal and amber" : "e.g. minimal flat illustration, bright and optimistic, lots of white space"}
                    className={inputCls}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={withText} onChange={(e) => setWithText(e.target.checked)} />
                  Let the AI letter the title and author
                </label>
                <p className="text-xs text-muted">
                  {withText ? "Check the spelling on the result: image models can garble lettering." : "Your title and author name are overlaid in the typeface you pick."}
                </p>
                <Button loading={generating} onClick={generate}>
                  {aiCover ? "↻ Regenerate art" : "Generate cover art"}
                </Button>
              </div>
              {aiCover && (
                <button onClick={() => updateBook(book.id, { cover: aiCover })} className={`self-start rounded-md p-1 transition ${cfg.image === aiCover.image ? "ring-2 ring-gold" : "hover:-translate-y-1"}`}>
                  <Cover {...props} cfg={aiCover} />
                </button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="mx-auto w-56" style={{ perspective: 1000 }}>
            <div style={{ transform: "rotateY(-14deg)" }}>
              <Cover {...props} cfg={cfg} />
            </div>
          </div>
          <Card className="space-y-4 p-5">
            {cfg.image ? (
              <Button variant="secondary" className="w-full" onClick={() => updateBook(book.id, { cover: { ...options[0], font: cfg.font } })}>
                Remove AI art
              </Button>
            ) : (
              <Field label="Layout">
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((t) => (
                    <button key={t} onClick={() => setCfg({ template: t })} className={`rounded-lg border py-1.5 text-xs ${cfg.template % 4 === t ? "border-gold bg-gold-soft" : "border-line"}`}>
                      {["Classic", "Bold", "Band", "Frame"][t]}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <div className="grid grid-cols-3 gap-3">
              {(["bg", "fg", "accent"] as const).filter((k) => !cfg.image || (k !== "bg" && !cfg.imageText)).map((k) => (
                <Field key={k} label={{ bg: "Background", fg: "Text", accent: "Accent" }[k]}>
                  <input type="color" value={cfg[k]} onChange={(e) => setCfg({ [k]: e.target.value })} className="h-9 w-full cursor-pointer rounded-lg border border-line" />
                </Field>
              ))}
            </div>
            {!cfg.imageText && (
              <Field label="Typeface">
                <div className="grid grid-cols-2 gap-2">
                  {(["serif", "sans"] as const).map((f) => (
                    <button key={f} onClick={() => setCfg({ font: f })} className={`rounded-lg border py-1.5 text-sm ${f === "serif" ? "font-serif" : "font-sans"} ${cfg.font === f ? "border-gold bg-gold-soft" : "border-line"}`}>
                      {f === "serif" ? "Serif" : "Sans"}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </Card>
        </div>
      </div>

      <StepFooter book={book} step="cover" canApprove={!!book.cover} note={book.cover ? undefined : "Pick a cover variant to continue."} />
    </StepShell>
  );
}
