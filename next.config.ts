import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/**
 * This computer's own network addresses (e.g. 192.168.x.x), so the dev server also works
 * when you open it from a phone on the same Wi-Fi. Only needed for `next dev`; skipped in
 * production, where the sandboxed service isn't allowed to list network interfaces.
 */
function lanAddresses() {
  if (process.env.NODE_ENV === "production") return [];
  try {
    return Object.values(networkInterfaces())
      .flat()
      .filter((i) => i && i.family === "IPv4" && !i.internal)
      .map((i) => i!.address);
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: lanAddresses(),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
