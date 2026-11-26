export function SetupError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Growth Hub</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Couldn&apos;t load client data</h1>
      <p className="mt-4 rounded-md border border-line bg-surface p-4 text-sm">{message}</p>
      <p className="mt-4 text-sm text-muted">
        Fix it in Vercel → Settings → Environment Variables, then redeploy (Deployments → ⋯ → Redeploy).
      </p>
    </main>
  );
}
