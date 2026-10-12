/**
 * Minimal shared-password gate. Set APP_PASSWORD to enable it; when unset
 * (e.g. local dev) everything is open. The cookie stores a hash, never the password.
 */
export const AUTH_COOKIE = "quill_auth";

export const authEnabled = () => !!process.env.APP_PASSWORD;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cookie value for a correct password. Salted so the cookie isn't a plain hash of the password. */
export const tokenFor = (password: string) => sha256(`quill:${password}`);

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidToken(token: string | undefined) {
  if (!authEnabled()) return true;
  return !!token && safeEqual(token, await tokenFor(process.env.APP_PASSWORD!));
}

export async function isValidPassword(password: string) {
  return authEnabled() && safeEqual(await tokenFor(password), await tokenFor(process.env.APP_PASSWORD!));
}
