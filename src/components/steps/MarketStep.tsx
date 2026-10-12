"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Meter, Skeleton, StepHeader } from "@/components/ui";
import { analyzeMarket, reportError } from "@/lib/ai/client";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { StepFooter, StepShell } from "./StepFooter";

export function MarketStep({ book }: { book: Book }) {
  const { updateBook } = useStore();
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  async function run() {
    setLoading(true);
    try {
      updateBook(book.id, { market: await analyzeMarket(book) });
    } catch (e) {
      reportError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!book.market && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = book.market;

  return (
    <StepShell>
      <StepHeader eyebrow="Step 1 · Research" title="Market Analysis">
        An AI read of the market for <b>“{book.topic}”</b>: competing books, what readers complain about, and where
        there&apos;s room for a better book.
      </StepHeader>

      {loading ? (
        <Card className="p-8">
          <div className="mb-6 flex items-center gap-3 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
            Analysing the niche, competing books and reader complaints…
          </div>
          <Skeleton lines={8} />
        </Card>
      ) : !m ? (
        <Card className="p-10 text-center">
          <p className="text-muted">No analysis yet.</p>
          <Button className="mt-4" onClick={run}>
            Run market analysis
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="space-y-4 p-6 md:col-span-1">
              <Meter label="Demand" value={m.demand} />
              <Meter label="Opportunity" value={m.opportunity} />
              <Meter label="Competition (lower is better)" value={100 - m.competition} />
              <div className="border-t border-line pt-4 text-sm">
                <div className="text-muted">Avg. price</div>
                <div className="font-serif text-2xl font-semibold">${m.avgPrice.toFixed(2)}</div>
              </div>
            </Card>

            <Card className="overflow-hidden md:col-span-3">
              <div className="border-b border-line px-6 py-4 font-semibold">Top competitors</div>
              <table className="w-full text-sm">
                <thead className="bg-paper text-left text-xs text-muted">
                  <tr>
                    <th className="px-6 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Rating</th>
                    <th className="px-2 py-2 font-medium">BSR</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-6 py-2 text-right font-medium">Est. revenue/mo</th>
                  </tr>
                </thead>
                <tbody>
                  {m.competitors.map((c) => (
                    <tr key={c.title} className="border-t border-line">
                      <td className="px-6 py-3">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted">
                          {c.author} · {c.pages} pages
                        </div>
                      </td>
                      <td className="px-2">
                        <span className="text-gold">★</span> {c.rating}{" "}
                        <span className="text-xs text-muted">({c.reviews.toLocaleString()})</span>
                      </td>
                      <td className="px-2">#{c.bsr.toLocaleString()}</td>
                      <td className="px-2">${c.price}</td>
                      <td className="px-6 text-right font-medium">${c.monthlyRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="font-semibold">Reader pain points</div>
              <p className="text-xs text-muted">Typical complaints in low-star reviews (AI summary)</p>
              <ul className="mt-4 space-y-3 text-sm">
                {m.painPoints.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className="text-rose-500">●</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-gold p-6">
              <div className="font-semibold">Your opportunity</div>
              <p className="text-xs text-muted">Gaps your book can fill to stand out</p>
              <ul className="mt-4 space-y-3 text-sm">
                {m.gaps.map((g) => (
                  <li key={g} className="flex gap-3">
                    <span className="text-gold">✦</span>
                    {g}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-6">
            <div className="font-semibold">Keywords to target</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.keywords.map((k) => (
                <span key={k} className="rounded-full bg-paper-2 px-3 py-1 text-sm">
                  {k}
                </span>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={run}>
              ↻ Re-run analysis
            </Button>
            <p className="text-xs text-muted">
              ⓘ Based on the AI model&apos;s knowledge, not live Amazon data. Sales figures, ranks and even competitor
              titles are estimates; verify them before making decisions.
            </p>
          </div>
        </div>
      )}

      <StepFooter book={book} step="market" canApprove={!!m && !loading} />
    </StepShell>
  );
}
