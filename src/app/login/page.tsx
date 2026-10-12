"use client";

import { useState } from "react";
import { Button, Card, inputCls } from "@/components/ui";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const next = new URLSearchParams(location.search).get("next");
      // Only allow same-site relative paths, to avoid open redirects.
      location.href = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else {
      setError((await res.json().catch(() => null))?.error ?? "Sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <Card className="w-full max-w-sm p-8">
        <div className="flex items-center gap-2 font-serif text-xl font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-sm text-paper">Q</span>
          Quill
        </div>
        <h1 className="mt-6 font-serif text-2xl font-semibold">Private preview</h1>
        <p className="mt-1 text-sm text-muted">Enter the site password to continue.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            autoFocus
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading} disabled={!password}>
            Enter
          </Button>
        </form>
      </Card>
    </div>
  );
}
