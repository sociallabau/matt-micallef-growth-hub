import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionValue } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  // No password configured: open in local dev, locked in production.
  if (!password && process.env.NODE_ENV !== "production") return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (password && cookie && cookie === (await sessionValue(password))) return NextResponse.next();

  const login = new URL("/login", req.url);
  if (req.nextUrl.pathname !== "/") login.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Public files (logo etc.) must load on the sign-in page too.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
