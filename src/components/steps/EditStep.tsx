"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Meter, StepHeader } from "@/components/ui";
import { reportError, runAgent } from "@/lib/ai/client";
import { wordCount } from "@/lib/steps";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

const STOP = new Set(
  "the a an and or but of to in on for with is are was were be been it this that as at by from you your can will not they their them we our i he she his her its into than then there these those have has had do does did so if what which who when how more most also about just one".split(" "),
);
const FILLERS = ["really", "very", "just", "actually", "basically", "quite", "literally", "somewhat"];

function syllables(w: string) {
  const m = w.toLowerCase().replace(/e\b/, "").match(/[aeiouy]+/g);
  return Math.max(1, m?.length ?? 1);
}

interface Issue {
  sectionId: string;
  where: string;
  text: string;
  kind: "long" | "passive";
}

export function EditStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [fixing, setFixing] = useState<string | null>(null);

  const report = useMemo(() => {
    const outline = book.outline ?? [];
    const all = outline.flatMap((c) => c.sections.map((s) => s.content)).join("\n\n");
    const words = all.match(/[A-Za-z']+/g) ?? [];
    const sentences = all.match(/[^.!?\n]+[.!?]+/g) ?? [];
    const syl = words.reduce((n, w) => n + syllables(w), 0);
    const flesch = words.length && sentences.length ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syl / words.length) : 0;

    const freq = new Map<string, number>();
    words.forEach((w) => {
      const k = w.toLowerCase();
      if (k.length > 3 && !STOP.has(k)) freq.set(k, (freq.get(k) ?? 0) + 1);
    });
    const overused = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const fillerCount = words.filter((w) => FILLERS.includes(w.toLowerCase())).length;

    const issues: Issue[] = [];
    outline.forEach((c, ci) =>
      c.sections.forEach((s) =>
        (s.content.match(/[^.!?\n]+[.!?]+/g) ?? []).forEach((sent) => {
          const t = sent.trim();
          if (wordCount(t) > 30) issues.push({ sectionId: s.id, where: `Ch ${ci + 1} · ${s.title}`, text: t, kind: "long" });
          else if (/\b(is|are|was|were|been|being|be)\s+\w+ed\b/i.test(t)) issues.push({ sectionId: s.id, where: `Ch ${ci + 1} · ${s.title}`, text: t, kind: "passive" });
        }),
      ),
    );

    const perChapter = outline.map((c) => ({ title: c.title, words: c.sections.reduce((n, s) => n + wordCount(s.content), 0) }));
    return {
      words: words.length,
      sentences: sentences.length,
      avgSentence: sentences.length ? words.length / sentences.length : 0,
      flesch: Math.max(0, Math.min(100, Math.round(flesch))),
      overused,
      fillerCount,
      issues,
      perChapter,
      minutes: Math.round(words.length / 230),
    };
  }, [book.outline]);

  function replaceInSection(sectionId: string, from: string, to: string) {
    updateBook(book.id, (b) => ({
      outline: b.outline?.map((c) => ({ ...c, sections: c.sections.map((s) => (s.id === sectionId ? { ...s, content: s.content.replace(from, to) } : s)) })),
    }));
  }

  async function fix(issue: Issue) {
    setFixing(issue.text);
    try {
      const { result } = await runAgent("tighten", issue.text, book);
      replaceInSection(issue.sectionId, issue.text, result);
    } catch (e) {
      reportError(e);
    } finally {
      setFixing(null);
    }
  }

  function stripFillers() {
    const re = new RegExp(`\\b(${FILLERS.join("|")})\\s+`, "gi");
    updateBook(book.id, (b) => ({ outline: b.outline?.map((c) => ({ ...c, sections: c.sections.map((s) => ({ ...s, content: s.content.replace(re, "") })) })) }));
  }

  const maxCh = Math.max(1, ...report.perChapter.map((c) => c.words));
  const grade = report.flesch >= 60 ? "Easy to read" : report.flesch >= 45 ? "Fairly readable" : "Difficult";

  return (
    <StepShell>
      <StepHeader eyebrow="Step 8 · Write" title="Editing & Review">
        A manuscript-wide pass for readability, pacing and style. Fix issues one by one, or jump back to the{" "}
        <Link className="text-gold underline" href={`/book/${book.id}/write`}>
          writing workspace
        </Link>
        .
      </StepHeader>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          ["Words", report.words.toLocaleString()],
          ["Reading time", `${report.minutes} min`],
          ["Avg sentence", `${report.avgSentence.toFixed(1)} words`],
          ["Issues", String(report.issues.length + (report.fillerCount ? 1 : 0))],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-1 font-serif text-2xl font-semibold">{v}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Suggestions</div>
              <span className="text-xs text-muted">{report.issues.length} sentences flagged</span>
            </div>
            {report.fillerCount > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-gold-soft p-4 text-sm">
                <span>
                  <b>{report.fillerCount}</b> filler words found ({FILLERS.slice(0, 4).join(", ")}…)
                </span>
                <Button className="!py-1 text-xs" onClick={stripFillers}>
                  Remove all
                </Button>
              </div>
            )}
            {report.issues.length === 0 && !report.fillerCount && <p className="mt-4 text-sm text-muted">No issues — nice work. ✨</p>}
            <ul className="mt-4 divide-y divide-line">
              {report.issues.slice(0, 25).map((i, idx) => (
                <li key={idx} className="flex gap-4 py-3 text-sm">
                  <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${i.kind === "long" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                    {i.kind === "long" ? "Long" : "Passive"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted">{i.where}</div>
                    <div className="mt-0.5">{i.text}</div>
                  </div>
                  {i.kind === "long" && (
                    <Button variant="secondary" className="!px-3 !py-1 text-xs" loading={fixing === i.text} onClick={() => fix(i)}>
                      Tighten
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="font-semibold">Chapter balance</div>
            <div className="mt-4 space-y-2">
              {report.perChapter.map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-40 truncate text-muted">
                    {i + 1}. {c.title}
                  </span>
                  <div className="h-3 flex-1 rounded bg-paper-2">
                    <div className="h-3 rounded bg-gold" style={{ width: `${(c.words / maxCh) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right">{c.words}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-3 p-6">
            <div className="font-semibold">Readability</div>
            <Meter label={`Flesch score · ${grade}`} value={report.flesch} />
            <p className="text-xs text-muted">Most bestselling non-fiction scores 55–70.</p>
          </Card>
          <Card className="p-6">
            <div className="font-semibold">Most repeated words</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.overused.map(([w, n]) => (
                <span key={w} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs">
                  {w} <b className="text-gold">{n}</b>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <StepFooter book={book} step="edit" />
    </StepShell>
  );
}
