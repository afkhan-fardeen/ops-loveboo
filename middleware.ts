import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  // getClaims verifies the JWT locally (no network call) and refreshes the cookie when needed.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;
  const isPublic = req.nextUrl.pathname === "/login";
  if (!user && !isPublic) {
    const to = new URL("/login", req.url);
    if (req.nextUrl.pathname !== "/") to.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|api/cron|api/webhooks|manifest\\.webmanifest|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)"] };
