import { ImageResponse } from "next/og";
import { pricing, site } from "@/lib/config";
import { rupees } from "@/lib/pricing";
import { pricingSnapshot } from "@/lib/pricing-cache";

export const alt = `${site.name}: online abacus competition for Nursery to Class 12`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const price = await pricingSnapshot();
  const beads = ["#f59e0b", "#818cf8", "#f43f5e", "#34d399", "#38bdf8"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #15123b 0%, #2a2170 100%)",
          color: "white",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          {beads.map((c) => (
            <div key={c} style={{ width: 56, height: 42, borderRadius: 999, background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: "#fcd34d", fontWeight: 700, letterSpacing: 4 }}>EXAM SLOTS 1–31 DECEMBER 2026 · 100% ONLINE</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, marginTop: 18, color: "#fcd34d" }}>{site.shortName}</div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, marginTop: 6 }}>{site.event}</div>
          <div style={{ fontSize: 34, color: "#c7d2fe", marginTop: 20 }}>Nursery to Class 12 · Surprise gift vouchers for toppers</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#fbbf24", color: "#15123b", fontSize: 40, fontWeight: 800, padding: "14px 32px", borderRadius: 999 }}>
            {price.offerLive && <span style={{ fontSize: 30, textDecoration: "line-through", opacity: 0.55 }}>{rupees(pricing.individual.regular)}</span>}
            <span>{`Register for ${rupees(price.individual)}`}</span>
          </div>
          <div style={{ fontSize: 30, color: "#c7d2fe" }}>{`Schools: unlimited students ${rupees(price.school)}`}</div>
        </div>
      </div>
    ),
    size,
  );
}
