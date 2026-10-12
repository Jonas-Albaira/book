"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { nextStep, STEPS } from "@/lib/steps";
import { useStore } from "@/lib/store";
import type { Book, StepId } from "@/lib/types";

/** Sticky "approve & continue" bar shared by every step. */
export function StepFooter({ book, step, canApprove = true, note }: { book: Book; step: StepId; canApprove?: boolean; note?: string }) {
  const router = useRouter();
  const { completeStep } = useStore();
  const next = nextStep(step);
  const nextLabel = STEPS.find((s) => s.id === next)?.label;

  return (
    <div className="sticky bottom-0 z-10 -mx-10 mt-12 flex items-center justify-between border-t border-line bg-paper/90 px-10 py-4 backdrop-blur">
      <span className="text-sm text-muted">{note ?? (book.completed.includes(step) ? "✓ Approved" : "Review, edit, then approve to continue.")}</span>
      <Button
        variant="gold"
        disabled={!canApprove}
        onClick={() => {
          completeStep(book.id, step);
          router.push(next ? `/book/${book.id}/${next}` : `/dashboard`);
        }}
      >
        {next ? `Approve & continue to ${nextLabel} →` : "Finish"}
      </Button>
    </div>
  );
}

export function StepShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-10 pt-10">{children}</div>;
}
