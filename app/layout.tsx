import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import FlashToast from "@/components/FlashToast";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const theme = createTheme({
  primaryColor: "blue",
  fontFamily: inter.style.fontFamily,
  headings: { fontFamily: inter.style.fontFamily, fontWeight: "650" },
  defaultRadius: "md",
});

export const metadata: Metadata = { title: "Love Boo Ops", robots: { index: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" {...mantineHtmlProps}>
      <head><ColorSchemeScript defaultColorScheme="light" /></head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" limit={3} />
          <Suspense><FlashToast /></Suspense>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
