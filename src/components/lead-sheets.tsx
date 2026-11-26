const pill =
  "rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-fg shadow-[0_0_14px_-2px_rgba(var(--accent-rgb),0.6)] transition hover:bg-white hover:text-black hover:shadow-[0_0_22px_rgba(var(--accent-rgb),0.8)]";

/** "Lead Sheet ↗" for one sheet; a small dropdown when a profile has several. */
export function LeadSheets({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  if (urls.length === 1) {
    return (
      <a href={urls[0]} target="_blank" rel="noreferrer" className={pill}>
        Lead Sheet ↗
      </a>
    );
  }
  return (
    <details className="relative">
      <summary className={`${pill} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        Lead Sheets ({urls.length}) ▾
      </summary>
      <ul className="glow absolute right-0 z-20 mt-2 w-44 rounded-lg border p-1.5 text-xs">
        {urls.map((u, i) => (
          <li key={u}>
            <a href={u} target="_blank" rel="noreferrer" className="block rounded-md px-2.5 py-2 hover:bg-white/10">
              Sheet {i + 1} ↗
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
