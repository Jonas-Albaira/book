"use client";

import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Logo, Skeleton } from "@/components/ui";
import { bookWords, progress, STEPS } from "@/lib/steps";
import { useStore } from "@/lib/store";

const PLACEHOLDER = { template: 0, bg: "#e7e0d0", fg: "#57534e", accent: "#b8892b", font: "serif" as const };

export default function Dashboard() {
  const { books, ready, deleteBook } = useStore();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <Link href="/new" className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-white">
            + New book
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-serif text-4xl font-semibold">Your library</h1>
        <p className="mt-2 text-muted">Every book you&apos;re working on, saved in this browser.</p>

        {!ready ? (
          <div className="mt-10 w-64">
            <Skeleton lines={4} />
          </div>
        ) : books.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-16 text-center">
            <div className="font-serif text-2xl">No books yet</div>
            <p className="mt-2 text-muted">Start with a topic — Quill will handle the research.</p>
            <Link href="/new" className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
              Create your first book
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((b) => {
              const next = STEPS.find((s) => !b.completed.includes(s.id)) ?? STEPS[STEPS.length - 1];
              return (
                <div key={b.id} className="group">
                  <Link href={`/book/${b.id}/${next.id}`}>
                    <Cover
                      title={b.title ?? b.topic}
                      subtitle={b.subtitle ?? "Untitled draft"}
                      author={b.authorName}
                      cfg={b.cover ?? PLACEHOLDER}
                      className="transition group-hover:-translate-y-1"
                    />
                  </Link>
                  <div className="mt-4">
                    <div className="truncate font-medium">{b.title ?? b.topic}</div>
                    <div className="mt-1 flex justify-between text-xs text-muted">
                      <span>Next: {next.label}</span>
                      <span>{bookWords(b).toLocaleString()} words</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-paper-2">
                      <div className="h-1.5 rounded-full bg-gold" style={{ width: `${progress(b)}%` }} />
                    </div>
                    <button
                      onClick={() => confirm(`Delete “${b.title ?? b.topic}”?`) && deleteBook(b.id)}
                      className="mt-2 text-xs text-muted opacity-0 hover:text-rose-600 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
