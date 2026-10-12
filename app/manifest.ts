import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Love Boo Ops",
    short_name: "Love Boo",
    description: "Love Boo operations portal",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f8f7",
    theme_color: "#006d68",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
