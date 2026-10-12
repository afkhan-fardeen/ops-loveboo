import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth";
import { liveToday } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireModule("reports");
  try {
    const d = await liveToday();
    return NextResponse.json({ date: d.date, net_sales: d.net_sales, orders: d.orders, units: d.units, discounts: d.discounts, updatedAt: d.updatedAt });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
