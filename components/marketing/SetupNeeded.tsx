import { EmptyState } from "@/components/ui";

/** Shown until migrations/011_marketing.sql has been run. */
export default function SetupNeeded() {
  return <EmptyState title="Marketing needs one setup step">An admin needs to run <b>migrations/011_marketing.sql</b> once in the ops Supabase SQL Editor. After that, this page works.</EmptyState>;
}
