export type Genre = "nonfiction" | "fiction";

export type StepId =
  | "market"
  | "title"
  | "resources"
  | "persona"
  | "bio"
  | "outline"
  | "write"
  | "edit"
  | "description"
  | "cover"
  | "publish";

export interface CompetitorBook {
  title: string;
  author: string;
  rating: number;
  reviews: number;
  bsr: number;
  price: number;
  pages: number;
  monthlyRevenue: number;
}

export interface MarketAnalysis {
  demand: number; // 0-100
  competition: number; // 0-100
  opportunity: number; // 0-100
  avgPrice: number;
  competitors: CompetitorBook[];
  painPoints: string[];
  gaps: string[];
  keywords: string[];
}

export interface TitleOption {
  title: string;
  subtitle: string;
  rationale: string;
  score: number;
}

export interface Resource {
  id: string;
  kind: "link" | "note" | "file";
  label: string;
  detail: string;
}

export interface Persona {
  name: string;
  voice: string;
  description: string;
  sample: string;
}

export interface Section {
  id: string;
  title: string;
  brief: string;
  content: string;
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  sections: Section[];
}

export interface CoverConfig {
  template: number;
  bg: string;
  fg: string;
  accent: string;
  font: "serif" | "sans";
  /** AI-generated cover art as a data URL. When set, it replaces the CSS layout's background. */
  image?: string;
  /** The art already contains the title and author lettering, so no text is overlaid. */
  imageText?: boolean;
  imagePrompt?: string;
}

export interface Book {
  id: string;
  createdAt: number;
  updatedAt: number;
  topic: string;
  audience: string;
  goal: string;
  genre: Genre;
  tone: string;
  targetWords: number;
  market?: MarketAnalysis;
  titleOptions?: TitleOption[];
  title?: string;
  subtitle?: string;
  resources: Resource[];
  personaOptions?: Persona[];
  persona?: Persona;
  authorName?: string;
  bio?: string;
  outline?: Chapter[];
  description?: string;
  keywords?: string[];
  cover?: CoverConfig;
  completed: StepId[];
}
