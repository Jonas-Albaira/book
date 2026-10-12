"use client";

import { useEffect, useState } from "react";

/** Renders error toasts dispatched via reportError() in lib/ai/client. */
export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  useEffect(() => {
    const onErr = (e: Event) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
    };
    window.addEventListener("ai-error", onErr);
    return () => window.removeEventListener("ai-error", onErr);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-96 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex gap-3 rounded-xl border border-rose-200 bg-white p-4 text-sm shadow-lg">
          <span className="text-rose-600">⚠</span>
          <div className="flex-1">
            <div className="font-medium">AI request failed</div>
            <div className="mt-0.5 break-words text-muted">{t.msg}</div>
          </div>
          <button className="text-muted hover:text-ink" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
