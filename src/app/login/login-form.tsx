"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm text-muted" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoFocus
        required
        className="w-full rounded-md border border-line bg-surface px-3 py-2.5 outline-none focus:border-fg"
      />
      {error && <p className="text-sm text-fg">{error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-md bg-fg px-3 py-2.5 font-medium text-bg transition-opacity disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
