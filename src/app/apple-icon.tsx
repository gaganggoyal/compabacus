import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone/iPad (and the logo in search results): the gold trophy. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#15123b" }}>
        <svg width="132" height="132" viewBox="0 0 40 40">
          <path d="M13 12.5h-2.6a3 3 0 0 0 0 6h3.2M27 12.5h2.6a3 3 0 0 1 0 6h-3.2" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          <path d="M12.5 10h15v6.5a7.5 7.5 0 0 1-15 0z" fill="#f59e0b" />
          <path d="M18.5 23.5h3V27h-3z" fill="#f59e0b" />
          <rect x="14.5" y="27" width="11" height="3.2" rx="1.2" fill="#fbbf24" />
          <path d="M15.6 12.6v3.6" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M31.5 3.6l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" fill="#fde68a" />
        </svg>
      </div>
    ),
    size,
  );
}
