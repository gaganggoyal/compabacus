import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/register", "/practice", "/rules", "/results", "/verify", "/terms", "/privacy", "/refund-policy"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: p === "/results" ? "daily" : "weekly",
    priority: p === "" ? 1 : p === "/register" ? 0.9 : 0.6,
  }));
}
