import { notFound, redirect } from "next/navigation";

// Older links (and emails) point here; the day view now lives on the Overview.
export default async function Day({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  redirect(`/sales?date=${date}`);
}
