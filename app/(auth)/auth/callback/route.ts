import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const base = process.env.APP_URL ?? req.nextUrl.origin;
  if (code) {
    const { error } = await (await serverClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}/`);
  }
  return NextResponse.redirect(`${base}/login?error=1`);
}
