"use client";
import { useState } from "react";
import { TagsInput } from "@mantine/core";
import { MARKET_SUGGESTIONS } from "@/lib/mkt";

/** Markets as tags: pick from the suggestions or type any country or region. Submits a hidden `markets` JSON array. */
export default function MarketsField({ initial }: { initial: string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <input type="hidden" name="markets" value={JSON.stringify(value)} />
      <TagsInput label="Markets" placeholder={value.length ? "" : "Pick or type a country, e.g. UAE"} data={MARKET_SUGGESTIONS} value={value} onChange={setValue}
        splitChars={[","]} maxTags={60} clearable description="Where it runs. Type any country or region and press Enter." />
    </>
  );
}
