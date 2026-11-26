import Image from "next/image";
import { LoginForm } from "./login-form";
import { tenant } from "@/lib/tenants";

export const metadata = { title: "Sign in · Growth Hub" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="glow animate-rise w-full max-w-sm rounded-2xl border p-8">
        <Image
          src="/social-lab-logo.png"
          alt="Social Lab"
          width={900}
          height={127}
          priority
          className="animate-logo mb-8 h-6 w-auto drop-shadow-[0_0_16px_rgba(var(--accent-rgb),0.6)]"
        />
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{tenant().name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Growth Hub</h1>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
