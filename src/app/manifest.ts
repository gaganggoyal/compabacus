import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: "Online abacus championship for Nursery to Class 12.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f2",
    theme_color: "#15123b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
