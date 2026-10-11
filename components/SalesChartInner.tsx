"use client";
import { AreaChart } from "@mantine/charts";

export default function SalesChartInner({ data, currency }: { data: { date: string; "Net sales": number }[]; currency: string }) {
  const fmt = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  return (
    <AreaChart h={240} data={data} dataKey="date" series={[{ name: "Net sales", color: "brand.6" }]} curveType="monotone"
      withDots={false} valueFormatter={fmt} gridAxis="y" tickLine="none" />
  );
}
