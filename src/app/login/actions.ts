"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionValue } from "@/lib/session";

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return "DASHBOARD_PASSWORD isn't set on the server.";
  if (form.get("password") !== password) return "Incorrect password.";

  (await cookies()).set(SESSION_COOKIE, await sessionValue(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
