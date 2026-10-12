import OpenAI from "openai";
import { AiError, runTask } from "@/lib/ai/server";
import { AUTH_COOKIE, isValidToken } from "@/lib/auth";

export const maxDuration = 120;

export async function POST(req: Request) {
  // Checked here as well as in proxy.ts, so the paid endpoint never relies on the proxy alone.
  const token = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`))?.[1];
  if (!(await isValidToken(token))) return Response.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { task, book, args } = await req.json();
    const out = await runTask(task, book, args ?? {}, req.signal);
    if (out instanceof ReadableStream) {
      return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
    return Response.json(out);
  } catch (e) {
    if (e instanceof OpenAI.APIError) {
      console.error("[ai] OpenAI error", e.status, e.message);
      return Response.json({ error: `OpenAI: ${e.message}` }, { status: e.status ?? 502 });
    }
    const status = e instanceof AiError ? e.status : 500;
    console.error("[ai]", e);
    return Response.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status });
  }
}
