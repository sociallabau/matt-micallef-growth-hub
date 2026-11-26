import Image from "next/image";
import Link from "next/link";
import { refresh } from "@/app/actions";
import { logout } from "@/app/login/actions";
import { tenant } from "@/lib/tenants";

export function Header({ fetchedAt, back }: { fetchedAt: Date; back?: boolean }) {
  const time = new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    timeZone: "Australia/Brisbane",
  }).format(fetchedAt);
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {back && (
            <Link href="/" className="whitespace-nowrap text-sm text-muted hover:text-fg">
              ←<span className="hidden sm:inline"> All accounts</span>
            </Link>
          )}
          <Link href="/" className="hidden leading-tight md:block">
            <span className="block text-[10px] uppercase tracking-[0.22em] text-muted">{tenant().name}</span>
            <span className="block font-semibold tracking-tight">Growth Hub</span>
          </Link>
        </div>

        <Link href="/" aria-label="Social Lab · Growth Hub home" className="animate-logo justify-self-center">
          <Image
            src="/social-lab-logo.png"
            alt="Social Lab"
            width={900}
            height={127}
            priority
            className="h-6 w-auto drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.6)] sm:h-8"
          />
        </Link>

        <div className="flex items-center justify-end gap-3 text-xs text-muted">
          <span className="hidden lg:inline">Updated {time}</span>
          <form action={refresh}>
            <button className="rounded-md border border-white/15 px-2.5 py-1.5 text-fg transition-shadow hover:shadow-[0_0_16px_rgba(var(--accent-rgb),0.45)]">
              Refresh
            </button>
          </form>
          <form action={logout}>
            <button className="px-1 py-1.5 hover:text-fg">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
