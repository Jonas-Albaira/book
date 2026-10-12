"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Logo, Skeleton } from "@/components/ui";
import { bookWords, PHASES, progress, STEPS } from "@/lib/steps";
import { useBook } from "@/lib/store";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  const { id, step } = useParams<{ id: string; step?: string }>();
  const { book, ready } = useBook(id);

  if (!ready) {
    return (
      <div className="p-10">
        <Skeleton lines={5} />
      </div>
    );
  }
  if (!book) {
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <div className="font-serif text-2xl">Book not found</div>
          <Link href="/dashboard" className="mt-4 inline-block text-gold underline">
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  const words = bookWords(book);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-line bg-white">
        <div className="border-b border-line p-5">
          <Logo />
          <Link href="/dashboard" className="mt-4 block text-xs text-muted hover:text-ink">
            ← Library
          </Link>
          <div className="mt-1 line-clamp-2 font-serif text-lg font-semibold leading-tight">{book.title ?? book.topic}</div>
          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>{progress(book)}% complete</span>
            <span>
              {words.toLocaleString()} / {book.targetWords.toLocaleString()} words
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-paper-2">
            <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${progress(book)}%` }} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {PHASES.map((phase, pi) => (
            <div key={phase} className="mb-4">
              <div className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                Phase {pi + 1} · {phase}
              </div>
              {STEPS.filter((s) => s.phase === phase).map((s) => {
                const n = STEPS.indexOf(s) + 1;
                const done = book.completed.includes(s.id);
                const lock = s.locked?.(book);
                const active = step === s.id;
                const inner = (
                  <>
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        done ? "bg-gold text-white" : active ? "bg-ink text-paper" : "bg-paper-2 text-muted"
                      }`}
                    >
                      {done ? "✓" : lock ? "🔒" : n}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{s.label}</span>
                      {lock && <span className="block text-[11px] text-muted">{lock}</span>}
                    </span>
                  </>
                );
                const cls = `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? "bg-paper-2 font-medium" : ""}`;
                return lock ? (
                  <div key={s.id} className={`${cls} cursor-not-allowed opacity-50`} title={lock}>
                    {inner}
                  </div>
                ) : (
                  <Link key={s.id} href={`/book/${book.id}/${s.id}`} className={`${cls} hover:bg-paper-2`}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-[11px] text-muted">Prototype · AI-generated content, review before publishing · autosaved locally</div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
