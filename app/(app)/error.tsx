"use client";
import { Button, Card } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="flex flex-col items-start gap-3">
      <h1 className="font-display text-xl font-semibold">We couldn’t load this page</h1>
      <p className="text-ink/70">Something went wrong reading the report data. Your data is safe — try again.</p>
      <Button onClick={reset}>Try again</Button>
    </Card>
  );
}
