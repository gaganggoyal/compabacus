import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas. Login pages stay crawlable but carry a noindex tag instead.
      disallow: ["/admin", "/dashboard", "/exam", "/certificate", "/schools/dashboard", "/reset-pin"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
