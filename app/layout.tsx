import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import FlashToast from "@/components/FlashToast";
import TopProgress from "@/components/TopProgress";
import { makeTheme } from "@/lib/theme";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const theme = makeTheme(inter.style.fontFamily);

export const metadata: Metadata = {
  title: { default: "Love Boo Ops", template: "%s · Love Boo Ops" },
  robots: { index: false },
  appleWebApp: { capable: true, title: "Love Boo Ops", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { themeColor: "#006d68", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" {...mantineHtmlProps}>
      <head><ColorSchemeScript defaultColorScheme="light" /></head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" limit={3} />
          <Suspense><FlashToast /><TopProgress /></Suspense>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
