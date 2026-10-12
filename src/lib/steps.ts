import type { Book, StepId } from "./types";

export interface StepDef {
  id: StepId;
  label: string;
  blurb: string;
  phase: "Research" | "Write" | "Publish";
  /** Returns a reason the step is locked, or null if available. */
  locked?: (b: Book) => string | null;
}

export const STEPS: StepDef[] = [
  { id: "market", label: "Market Analysis", phase: "Research", blurb: "Study bestsellers, reader pain points and gaps." },
  { id: "title", label: "Book Title", phase: "Research", blurb: "Pick a title and subtitle built to rank." },
  { id: "resources", label: "Resources", phase: "Research", blurb: "Add references, notes and source material." },
  { id: "persona", label: "Author Persona", phase: "Research", blurb: "Choose the voice your book is written in." },
  { id: "bio", label: "Author Bio", phase: "Research", blurb: "Write the 'About the Author' blurb." },
  {
    id: "outline",
    label: "Outline Builder",
    phase: "Research",
    blurb: "Shape the chapter-by-chapter structure.",
    locked: (b) => (b.title ? null : "Choose a title first"),
  },
  {
    id: "write",
    label: "Writing Workspace",
    phase: "Write",
    blurb: "Generate and refine each section with inline agents.",
    locked: (b) => (b.outline?.length ? null : "Build an outline first"),
  },
  {
    id: "edit",
    label: "Editing & Review",
    phase: "Write",
    blurb: "Manuscript-wide readability and style review.",
    locked: (b) => (hasContent(b) ? null : "Write at least one section"),
  },
  {
    id: "description",
    label: "Book Description",
    phase: "Write",
    blurb: "Store-page copy and keywords.",
    locked: (b) => (b.title ? null : "Choose a title first"),
  },
  {
    id: "cover",
    label: "Cover Design",
    phase: "Publish",
    blurb: "Genre-aware cover variants.",
    locked: (b) => (b.title ? null : "Choose a title first"),
  },
  {
    id: "publish",
    label: "Preview & Export",
    phase: "Publish",
    blurb: "Read the book and export it for KDP and others.",
    locked: (b) => (hasContent(b) ? null : "Write at least one section"),
  },
];

export const PHASES = ["Research", "Write", "Publish"] as const;

export function hasContent(b: Book) {
  return !!b.outline?.some((c) => c.sections.some((s) => s.content.trim()));
}

export function nextStep(id: StepId): StepId | null {
  const i = STEPS.findIndex((s) => s.id === id);
  return STEPS[i + 1]?.id ?? null;
}

export function wordCount(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function bookWords(b: Book) {
  return (b.outline ?? []).reduce(
    (n, c) => n + c.sections.reduce((m, s) => m + wordCount(s.content), 0),
    0,
  );
}

export function progress(b: Book) {
  return Math.round((b.completed.length / STEPS.length) * 100);
}
