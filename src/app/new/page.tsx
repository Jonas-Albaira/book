"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Suggest } from "@/components/Suggest";
import { Button, Field, inputCls, Logo } from "@/components/ui";
import { titleCase } from "@/lib/util";
import { uid, useStore } from "@/lib/store";
import type { Chapter, Genre } from "@/lib/types";

const TONES = ["Practical", "Inspirational", "Conversational", "Academic", "Humorous", "Dark", "Whimsical"];
const LENGTHS = [
  { words: 15000, label: "Short", hint: "~60 pages" },
  { words: 35000, label: "Standard", hint: "~140 pages" },
  { words: 60000, label: "Long", hint: "~240 pages" },
];
const IDEAS = ["intermittent fasting for women over 40", "starting a vegetable garden", "personal finance for new graduates", "a lighthouse keeper's secret"];

/** Splits a pasted manuscript on markdown "# " / "## " headings into chapters and sections. */
function parseManuscript(text: string): Chapter[] {
  const chapters: Chapter[] = [];
  let cur: Chapter | null = null;
  for (const block of text.split(/\n(?=#{1,2} )/)) {
    const m = block.match(/^(#{1,2}) (.+)\n?([\s\S]*)$/);
    if (!m) {
      if (block.trim()) {
        cur = { id: uid(), title: "Chapter 1", summary: "", sections: [{ id: uid(), title: "Opening", brief: "", content: block.trim() }] };
        chapters.push(cur);
      }
      continue;
    }
    const [, level, title, body] = m;
    if (level === "#" || !cur) {
      cur = { id: uid(), title: title.trim(), summary: "", sections: [] };
      chapters.push(cur);
      if (body.trim()) cur.sections.push({ id: uid(), title: "Introduction", brief: "", content: body.trim() });
    } else {
      cur.sections.push({ id: uid(), title: title.trim(), brief: "", content: body.trim() });
    }
  }
  return chapters.filter((c) => c.sections.length);
}

export default function NewBook() {
  const router = useRouter();
  const { createBook } = useStore();
  const [mode, setMode] = useState<"fresh" | "import" | null>(null);
  const [step, setStep] = useState(0);
  const [genre, setGenre] = useState<Genre>("nonfiction");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("Practical");
  const [targetWords, setTargetWords] = useState(35000);
  const [manuscript, setManuscript] = useState("");

  const draft = { genre, topic, audience, goal, tone, targetWords };
  const steps = ["Topic", "Audience", "Style"];
  const canNext = [topic.trim().length > 2, true, true][step];

  function finish() {
    const book = createBook({ genre, topic: topic.trim(), audience: audience.trim(), goal: goal.trim(), tone, targetWords });
    router.push(`/book/${book.id}/market`);
  }

  function importBook() {
    const outline = parseManuscript(manuscript);
    const firstHeading = manuscript.match(/^# (.+)$/m)?.[1];
    const book = createBook({
      genre,
      topic: topic.trim() || firstHeading || "Imported manuscript",
      audience: "",
      goal: "",
      tone,
      targetWords,
      title: topic.trim() ? titleCase(topic.trim()) : "Imported Manuscript",
      outline,
      completed: ["outline"],
    });
    router.push(`/book/${book.id}/write`);
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Logo />
        <button onClick={() => router.push("/dashboard")} className="text-sm text-muted">
          Cancel
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-20 pt-8">
        {mode === null && (
          <>
            <h1 className="font-serif text-4xl font-semibold">Start a new book</h1>
            <p className="mt-2 text-muted">Start from an idea, or bring a draft you&apos;ve already written.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <button onClick={() => setMode("fresh")} className="rounded-2xl border border-line bg-white p-6 text-left hover:border-gold">
                <div className="text-2xl">✦</div>
                <div className="mt-3 font-serif text-xl font-semibold">Start from an idea</div>
                <p className="mt-1 text-sm text-muted">Guided research → outline → writing.</p>
              </button>
              <button onClick={() => setMode("import")} className="rounded-2xl border border-line bg-white p-6 text-left hover:border-gold">
                <div className="text-2xl">⇪</div>
                <div className="mt-3 font-serif text-xl font-semibold">Import a manuscript</div>
                <p className="mt-1 text-sm text-muted">Paste your draft; we&apos;ll structure it into chapters.</p>
              </button>
            </div>
          </>
        )}

        {mode === "import" && (
          <div className="space-y-5">
            <h1 className="font-serif text-4xl font-semibold">Import a manuscript</h1>
            <Field label="Working title">
              <input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="My Book" />
            </Field>
            <Field label="Manuscript" hint="Use # for chapters and ## for sections">
              <textarea
                className={`${inputCls} h-80 font-mono text-xs`}
                value={manuscript}
                onChange={(e) => setManuscript(e.target.value)}
                placeholder={"# Chapter One\n## The Beginning\nIt was a bright cold day in April...\n\n# Chapter Two\n..."}
              />
            </Field>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setMode(null)}>← Back</Button>
              <Button variant="gold" disabled={!manuscript.trim()} onClick={importBook}>
                Structure my manuscript →
              </Button>
            </div>
          </div>
        )}

        {mode === "fresh" && (
          <>
            <div className="mb-10 flex gap-2">
              {steps.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={`h-1 rounded-full ${i <= step ? "bg-gold" : "bg-line"}`} />
                  <div className={`mt-2 text-xs ${i === step ? "font-semibold" : "text-muted"}`}>{s}</div>
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-6">
                <h1 className="font-serif text-4xl font-semibold">What&apos;s your book about?</h1>
                <div className="flex gap-2">
                  {(["nonfiction", "fiction"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`rounded-full border px-4 py-1.5 text-sm capitalize ${genre === g ? "border-ink bg-ink text-paper" : "border-line bg-white"}`}
                    >
                      {g === "nonfiction" ? "Non-fiction" : "Fiction"}
                    </button>
                  ))}
                </div>
                <Suggest field="topic" book={draft} value={topic} onPick={setTopic} align="top">
                  <textarea
                    autoFocus
                    className={`${inputCls} h-32 pr-10 text-base`}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={genre === "fiction" ? "A premise, e.g. a lighthouse keeper discovers a secret…" : "A topic, e.g. intermittent fasting for women over 40"}
                  />
                </Suggest>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted">Try:</span>
                  {IDEAS.map((i) => (
                    <button key={i} onClick={() => setTopic(i)} className="rounded-full bg-paper-2 px-3 py-1 hover:bg-gold-soft">
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h1 className="font-serif text-4xl font-semibold">Who is it for?</h1>
                <Field label="Target reader">
                  <Suggest field="audience" book={draft} value={audience} onPick={setAudience}>
                    <input className={`${inputCls} pr-10`} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. busy professionals, first-time gardeners" />
                  </Suggest>
                </Field>
                <Field label="What should readers walk away with?" hint="optional">
                  <Suggest field="goal" book={draft} value={goal} onPick={setGoal} align="top">
                    <textarea className={`${inputCls} h-24 pr-10`} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. a sustainable routine they can follow without willpower" />
                  </Suggest>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h1 className="font-serif text-4xl font-semibold">Tone & length</h1>
                <Field label="Tone">
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button key={t} onClick={() => setTone(t)} className={`rounded-full border px-3.5 py-1.5 text-sm ${tone === t ? "border-gold bg-gold-soft" : "border-line bg-white"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Length">
                  <div className="grid grid-cols-3 gap-3">
                    {LENGTHS.map((l) => (
                      <button key={l.words} onClick={() => setTargetWords(l.words)} className={`rounded-xl border p-4 text-left ${targetWords === l.words ? "border-gold bg-gold-soft" : "border-line bg-white"}`}>
                        <div className="font-semibold">{l.label}</div>
                        <div className="text-xs text-muted">
                          {l.words.toLocaleString()} words · {l.hint}
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            <div className="mt-10 flex justify-between">
              <Button variant="ghost" onClick={() => (step === 0 ? setMode(null) : setStep(step - 1))}>
                ← Back
              </Button>
              {step < steps.length - 1 ? (
                <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                  Continue →
                </Button>
              ) : (
                <Button variant="gold" onClick={finish}>
                  Start research →
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
