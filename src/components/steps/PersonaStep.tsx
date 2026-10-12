"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Skeleton, StepHeader } from "@/components/ui";
import { generatePersonas, reportError } from "@/lib/ai/client";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

export function PersonaStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  async function run() {
    setLoading(true);
    try {
      updateBook(book.id, { personaOptions: await generatePersonas(book) });
    } catch (e) {
      reportError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (book.personaOptions || started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepShell>
      <StepHeader eyebrow="Step 4 · Research" title="Author Persona">
        The voice your book is written in. Every generated section and inline rewrite follows this persona.
      </StepHeader>

      <div className="grid gap-5 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <Card key={i} className="p-6">
                <Skeleton lines={6} />
              </Card>
            ))
          : book.personaOptions?.map((p) => {
              const selected = book.persona?.name === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => updateBook(book.id, { persona: p })}
                  className={`flex flex-col rounded-2xl border bg-white p-6 text-left transition ${selected ? "border-gold ring-2 ring-gold-soft" : "border-line hover:border-stone-400"}`}
                >
                  <div className="font-serif text-xl font-semibold">{p.name}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-gold">{p.voice}</div>
                  <p className="mt-3 text-sm text-muted">{p.description}</p>
                  <blockquote className="mt-5 border-l-2 border-gold pl-4 font-serif text-sm italic">“{p.sample}”</blockquote>
                </button>
              );
            })}
      </div>
      <Button variant="secondary" className="mt-6" loading={loading} onClick={run}>
        ↻ {book.personaOptions ? "Suggest different personas" : "Suggest personas"}
      </Button>

      <StepFooter book={book} step="persona" canApprove={!!book.persona} note={book.persona ? undefined : "Choose a persona to continue."} />
    </StepShell>
  );
}
