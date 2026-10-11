"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@mantine/core";

// The chart library is the heaviest dependency: load it after first paint.
const Chart = dynamic(() => import("./SalesChartInner"), { ssr: false, loading: () => <Skeleton h={240} /> });

export default function SalesChart(props: { data: { date: string; "Net sales": number }[]; currency: string }) {
  return <Chart {...props} />;
}
