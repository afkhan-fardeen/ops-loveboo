import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next hydration and Mantine's colour-scheme script are inline
  "style-src 'self' 'unsafe-inline'",  // Mantine injects style attributes
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const config: NextConfig = {
  poweredByHeader: false,
  // Old addresses (including links in emails already sent) keep working.
  async redirects() {
    const to = "/reports/daily-sales";
    return [
      { source: "/sales", destination: to, permanent: false },
      { source: "/sales/reports/:date(\\d{4}-\\d{2}-\\d{2})", destination: `${to}?date=:date`, permanent: false },
      { source: "/sales/:path*", destination: to, permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default config;
