import { redirect } from "next/navigation";

// Reports currently holds one report; /reports goes straight to it.
export default function Reports() {
  redirect("/reports/daily-sales");
}
