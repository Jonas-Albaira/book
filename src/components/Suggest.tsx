"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui";
import { reportError, suggest, type SuggestField } from "@/lib/ai/client";
import type { Book } from "@/lib/types";

interface Props {
  field: SuggestField;
  book: Partial<Book>;
  /** Current field value. When set, suggestions are refinements of it. */
  value?: string;
  /** Extra prompt context, e.g. which chapter a summary belongs to. */
  extra?: string;
  onPick: (value: string) => void;
  children: React.ReactNode;
  /** "top" for textareas, "center" for single-line inputs. */
  align?: "top" | "center";
  /** Only show the icon while hovering the nearest `group` ancestor (for dense lists). */
  subtle?: boolean;
  className?: string;
}

/**
 * Wraps a form control and adds a ✦ button that fetches AI suggestions for it.
 * Give the wrapped control right padding (e.g. pr-10) so text doesn't run under the icon.
 */
export function Suggest({ field, book, value = "", extra, onPick, children, align = "center", subtle, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function load() {
    setLoading(true);
    setOpen(true);
    try {
      setItems(await suggest(field, book, value, extra));
    } catch (e) {
      reportError(e);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {children}
      <button
        type="button"
        title="Suggest with AI"
        aria-label="Suggest with AI"
        onClick={() => (open && !loading ? setOpen(false) : load())}
        className={`absolute right-1.5 grid h-7 w-7 place-items-center rounded-lg text-gold transition hover:bg-gold-soft ${
          align === "top" ? "top-1.5" : "top-1/2 -translate-y-1/2"
        } ${open ? "bg-gold-soft" : subtle ? "opacity-0 focus:opacity-100 group-hover:opacity-100" : ""}`}
      >
        {loading ? <Spinner /> : "✦"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-96 max-w-[90vw] rounded-xl border border-line bg-white p-1.5 text-left shadow-xl">
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span>{value.trim() ? "Suggested improvements" : "Suggestions"}</span>
            {!loading && (
              <button type="button" onClick={load} className="normal-case tracking-normal text-gold hover:underline">
                ↻ More
              </button>
            )}
          </div>
          {loading
            ? Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton m-2 h-4" style={{ width: `${85 - i * 15}%` }} />)
            : items.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    onPick(s);
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm font-normal hover:bg-paper-2"
                >
                  {s}
                </button>
              ))}
        </div>
      )}
    </div>
  );
}
