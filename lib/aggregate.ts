import type { Location, Product, Row } from "./data";

export function totals(rows: Row[]) {
  const net = rows.reduce((a, r) => a + r.net_sales, 0), orders = rows.reduce((a, r) => a + r.orders, 0);
  const sum = (f: (r: Row) => number) => rows.reduce((a, r) => a + f(r), 0);
  return {
    net, orders, units: sum((r) => r.units), discounts: sum((r) => r.discounts), aov: orders ? net / orders : 0,
    gross: sum((r) => r.gross_sales), returns: sum((r) => r.returns), shipping: sum((r) => r.shipping), taxes: sum((r) => r.taxes), total: sum((r) => r.total_sales),
  };
}

export function aggProducts(rows: Row[]): Product[] {
  const m = new Map<string, Product>();
  for (const r of rows) for (const p of r.top_products) {
    const x = m.get(p.name) ?? { name: p.name, units: 0, net: 0 };
    x.units += p.units; x.net += p.net;
    m.set(p.name, x);
  }
  return [...m.values()].sort((a, b) => b.net - a.net);
}

export function aggLocations(rows: Row[]): Location[] {
  const m = new Map<string, Location>();
  for (const r of rows) for (const l of r.locations) {
    const k = `${l.country}|${l.city}`;
    const x = m.get(k) ?? { ...l, orders: 0, units: 0, net: 0 };
    x.orders += l.orders; x.units += l.units; x.net += l.net;
    m.set(k, x);
  }
  return [...m.values()].sort((a, b) => b.net - a.net);
}

export function byCountry(locs: Location[]) {
  const m = new Map<string, { country: string; orders: number; units: number; net: number }>();
  for (const l of locs) {
    const x = m.get(l.country) ?? { country: l.country, orders: 0, units: 0, net: 0 };
    x.orders += l.orders; x.units += l.units; x.net += l.net;
    m.set(l.country, x);
  }
  return [...m.values()].sort((a, b) => b.net - a.net);
}
