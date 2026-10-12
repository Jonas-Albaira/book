import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Logo } from "@/components/ui";

const SAMPLE_COVERS = [
  { title: "The Calm Mind", subtitle: "Ten Minutes a Day to Less Anxiety", author: "Elena Ruiz", cfg: { template: 0, bg: "#0f172a", fg: "#f8fafc", accent: "#f59e0b", font: "serif" as const } },
  { title: "Side Hustle Blueprint", subtitle: "From Idea to $1k a Month", author: "Mark Ellison", cfg: { template: 1, bg: "#fef3c7", fg: "#1c1917", accent: "#f97316", font: "sans" as const } },
  { title: "The Last Lantern", subtitle: "A Novel", author: "Hannah Cole", cfg: { template: 3, bg: "#172554", fg: "#dbeafe", accent: "#fbbf24", font: "serif" as const } },
  { title: "Plant-Based Simplified", subtitle: "The No-Fluff Guide", author: "Priya Raman", cfg: { template: 2, bg: "#064e3b", fg: "#ecfdf5", accent: "#6ee7b7", font: "sans" as const } },
];

const PHASES = [
  {
    n: "01",
    name: "Research",
    steps: ["Market analysis of bestsellers", "Title generation", "Resources & references", "Author persona & bio", "Outline builder"],
  },
  {
    n: "02",
    name: "Write",
    steps: ["Section-by-section drafting", "Inline agents: expand, tighten, cite", "Review & apply suggestions", "Manuscript-wide editing", "Book description"],
  },
  {
    n: "03",
    name: "Publish",
    steps: ["Genre-aware cover design", "Reader preview", "Export for KDP & other stores", "Launch checklist"],
  },
];

export default function Landing() {
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden gap-8 text-sm text-muted md:flex">
            <a href="#how">How it works</a>
            <a href="#compare">Why Quill</a>
          </nav>
          <Link href="/dashboard" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
            Open studio
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Chapter 01 · The idea</div>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] md:text-6xl">
            Write books designed to sell — <em className="text-gold">in hours, not months.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            Quill studies what&apos;s already selling, helps you shape a better book, writes alongside you section by
            section, and packages it for publishing. You approve every step.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/new" className="rounded-full bg-gold px-6 py-3 font-medium text-white">
              Start writing →
            </Link>
            <Link href="/dashboard" className="rounded-full border border-line bg-white px-6 py-3 font-medium">
              My books
            </Link>
          </div>
        </div>
        <div className="relative h-[420px]">
          {SAMPLE_COVERS.map((c, i) => (
            <div
              key={c.title}
              className="absolute w-44 transition hover:-translate-y-2"
              style={{ left: `${i * 22}%`, top: `${[10, 0, 18, 6][i]}%`, transform: `rotate(${[-6, 3, -2, 5][i]}deg)`, zIndex: i }}
            >
              <Cover {...c} />
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border-y border-line bg-ink py-3 text-paper">
        <div className="animate-ticker flex w-max gap-10 whitespace-nowrap font-serif text-lg tracking-widest">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i}>RESEARCH · WRITE · PUBLISH · SELL ·</span>
          ))}
        </div>
      </div>

      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Chapter 02 · How it works</div>
        <h2 className="mt-3 font-serif text-4xl font-semibold">Fourteen steps. Three phases. One book.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PHASES.map((p) => (
            <div key={p.name} className="rounded-2xl border border-line bg-white p-7">
              <div className="font-serif text-5xl text-gold-soft">{p.n}</div>
              <div className="mt-2 font-serif text-2xl font-semibold">{p.name}</div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {p.steps.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-gold">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="compare" className="border-t border-line bg-paper-2 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Chapter 03 · Before / After</div>
            <h2 className="mt-3 font-serif text-4xl font-semibold">Stop guessing what readers want.</h2>
            <p className="mt-4 text-muted">
              Traditional self-publishing means months of guesswork, freelancers, and blank pages. Quill puts the
              research, writing, editing and packaging in one guided workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="font-semibold text-rose-700">Before</div>
              <ul className="mt-3 space-y-2 text-muted">
                <li>✕ Guess at a topic</li>
                <li>✕ Stare at a blank page</li>
                <li>✕ Hire an editor & designer</li>
                <li>✕ 6–12 months</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gold bg-white p-6">
              <div className="font-semibold text-emerald-700">With Quill</div>
              <ul className="mt-3 space-y-2">
                <li>✓ Data-backed topic & title</li>
                <li>✓ Drafts section by section</li>
                <li>✓ Built-in edit, cover & copy</li>
                <li>✓ Days, not months</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl justify-between px-6 py-10 text-sm text-muted">
        <Logo />
        <span>Prototype · AI by OpenAI · always review AI output.</span>
      </footer>
    </div>
  );
}
