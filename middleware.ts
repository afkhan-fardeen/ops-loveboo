import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/auth/callback"];

export async function middleware(req: NextRequest) {
  // No Supabase configured yet → local demo mode, no auth.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const ok = !!user?.email && (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).includes(user.email.toLowerCase());
  const isPublic = PUBLIC.includes(req.nextUrl.pathname);

  if (!ok && !isPublic) return NextResponse.redirect(new URL("/login", req.url));
  if (ok && req.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron).*)"] };
