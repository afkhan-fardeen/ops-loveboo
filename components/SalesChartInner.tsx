"use client";
import { AreaChart } from "@mantine/charts";

export default function SalesChartInner({ data, currency, compare }: { data: Record<string, string | number>[]; currency: string; compare?: boolean }) {
  const fmt = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  return (
    <AreaChart h={240} data={data} dataKey="date" series={compare ? [{ name: "Previous period", color: "gray.5" }, { name: "Net sales", color: "brand.6" }] : [{ name: "Net sales", color: "brand.6" }]} curveType="monotone"
      withDots={false} valueFormatter={fmt} gridAxis="y" tickLine="none" />
  );
}
