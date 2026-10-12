import type { CodeUse, Location, Product, Row, Source } from "./data";

export function totals(rows: Row[]) {
  const net = rows.reduce((a, r) => a + r.net_sales, 0), orders = rows.reduce((a, r) => a + r.orders, 0);
  const sum = (f: (r: Row) => number) => rows.reduce((a, r) => a + f(r), 0);
  return {
    net, orders, units: sum((r) => r.units), discounts: sum((r) => r.discounts), aov: orders ? net / orders : 0,
    sessions: sum((r) => r.sessions),
    // Conversion is session-weighted: total converted sessions over total sessions.
    conversion: sum((r) => r.sessions) ? sum((r) => r.conversion * r.sessions) / sum((r) => r.sessions) : 0,
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

export function aggSources(rows: Row[]): Source[] {
  const m = new Map<string, number>();
  for (const r of rows) for (const s of r.sources) m.set(s.source, (m.get(s.source) ?? 0) + s.sessions);
  return [...m.entries()].map(([source, sessions]) => ({ source, sessions })).sort((a, b) => b.sessions - a.sessions);
}

export function aggCodes(rows: Row[]): CodeUse[] {
  const m = new Map<string, CodeUse>();
  for (const r of rows) for (const c of r.discount_codes) {
    const x = m.get(c.code) ?? { code: c.code, orders: 0, discount: 0 };
    x.orders += c.orders; x.discount += c.discount;
    m.set(c.code, x);
  }
  return [...m.values()].map((c) => ({ ...c, discount: Math.round(c.discount * 100) / 100 })).sort((a, b) => b.orders - a.orders || b.discount - a.discount);
}
