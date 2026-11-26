import "server-only";

/** Read a secret env var, forgiving stray whitespace, wrapping quotes or a pasted "Bearer " prefix. */
export function secret(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const v = raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  return v || undefined;
}
