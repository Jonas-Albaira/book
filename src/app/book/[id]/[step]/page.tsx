"use client";

import { useParams } from "next/navigation";
import { BioStep } from "@/components/steps/BioStep";
import { CoverStep } from "@/components/steps/CoverStep";
import { DescriptionStep } from "@/components/steps/DescriptionStep";
import { EditStep } from "@/components/steps/EditStep";
import { MarketStep } from "@/components/steps/MarketStep";
import { OutlineStep } from "@/components/steps/OutlineStep";
import { PersonaStep } from "@/components/steps/PersonaStep";
import { PublishStep } from "@/components/steps/PublishStep";
import { ResourcesStep } from "@/components/steps/ResourcesStep";
import { TitleStep } from "@/components/steps/TitleStep";
import { WriteStep } from "@/components/steps/WriteStep";
import { STEPS } from "@/lib/steps";
import { useBook } from "@/lib/store";
import type { Book, StepId } from "@/lib/types";

const COMPONENTS: Record<StepId, React.ComponentType<{ book: Book }>> = {
  market: MarketStep,
  title: TitleStep,
  resources: ResourcesStep,
  persona: PersonaStep,
  bio: BioStep,
  outline: OutlineStep,
  write: WriteStep,
  edit: EditStep,
  description: DescriptionStep,
  cover: CoverStep,
  publish: PublishStep,
};

export default function StepPage() {
  const { id, step } = useParams<{ id: string; step: StepId }>();
  const { book } = useBook(id);
  const def = STEPS.find((s) => s.id === step);
  if (!book || !def) return <div className="p-10 text-muted">Unknown step.</div>;

  const lock = def.locked?.(book);
  if (lock) return <div className="p-10 text-muted">🔒 {lock}.</div>;

  const C = COMPONENTS[def.id];
  return <C key={book.id + def.id} book={book} />;
}
