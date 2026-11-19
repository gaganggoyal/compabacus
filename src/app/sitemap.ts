import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

/**
 * One sitemap for phones and computers alike: the site is responsive (same URLs and content on every device),
 * so Google's mobile-first crawler and desktop crawler use the same list.
 * Submit https://kudoscup.com/sitemap.xml in Google Search Console and Bing Webmaster Tools.
 */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; updated: string }[] = [
  { path: "", priority: 1, changeFrequency: "daily", updated: "2026-11-19" },
  { path: "/register", priority: 0.9, changeFrequency: "weekly", updated: "2026-11-19" },
  { path: "/schools", priority: 0.9, changeFrequency: "weekly", updated: "2026-11-19" },
  { path: "/schedule", priority: 0.8, changeFrequency: "daily", updated: "2026-11-19" },
  { path: "/schools/register", priority: 0.7, changeFrequency: "monthly", updated: "2026-11-19" },
  { path: "/practice", priority: 0.8, changeFrequency: "weekly", updated: "2026-11-19" },
  { path: "/rules", priority: 0.7, changeFrequency: "monthly", updated: "2026-11-19" },
  { path: "/results", priority: 0.6, changeFrequency: "daily", updated: "2026-11-19" },
  { path: "/verify", priority: 0.4, changeFrequency: "monthly", updated: "2026-11-19" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly", updated: "2026-11-19" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly", updated: "2026-11-19" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly", updated: "2026-11-19" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: `${site.url}${p.path}`,
    lastModified: p.updated,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
