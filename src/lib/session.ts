// Shared by middleware (edge) and the login action (node): Web Crypto only.
export const SESSION_COOKIE = "growth_hub_session";

/** Session value = HMAC of a fixed string keyed by the password, so changing the password logs everyone out. */
export async function sessionValue(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("growth-hub-session-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
