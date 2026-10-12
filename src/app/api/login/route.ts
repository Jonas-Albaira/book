import { AUTH_COOKIE, isValidPassword, tokenFor } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!(await isValidPassword(String(password ?? "")))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${await tokenFor(password)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return res;
}
