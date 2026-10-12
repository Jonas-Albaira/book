"use client";

import Link from "next/link";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold";
  loading?: boolean;
};

const variants = {
  primary: "bg-ink text-paper hover:bg-stone-700",
  secondary: "bg-white border border-line hover:border-stone-400",
  ghost: "hover:bg-paper-2",
  gold: "bg-gold text-white hover:brightness-110",
};

export function Button({ variant = "primary", loading, className = "", children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
  );
}

export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-2xl border border-line bg-white ${className}`}>
      {children}
    </div>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-sm text-paper">Q</span>
      Quill
    </Link>
  );
}

export function StepHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</div>
      <h1 className="mt-2 font-serif text-3xl font-semibold">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-muted">{children}</p>}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft";

export function Meter({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? "bg-emerald-500" : value > 45 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-paper-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
