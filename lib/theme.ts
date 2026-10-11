import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Love Boo teal, built around #006D68 (shade 6).
const brand: MantineColorsTuple = ["#e6f4f3", "#c9e6e4", "#a3d3d0", "#78bdb9", "#4ea6a1", "#238f8a", "#006d68", "#005f5a", "#00514d", "#00403d"];

export const makeTheme = (fontFamily: string) =>
  createTheme({
    colors: { brand },
    primaryColor: "brand",
    primaryShade: 6,
    fontFamily,
    headings: { fontFamily, fontWeight: "650" },
    defaultRadius: "md",
    components: { Paper: { defaultProps: { radius: "lg" } } },
  });
