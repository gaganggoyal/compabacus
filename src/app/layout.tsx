import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { site } from "@/lib/config";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Online Abacus Competition for Ages 4–18`,
    template: `%s · ${site.shortName}`,
  },
  description:
    "Register for just ₹10. A fair, timed online abacus competition for children aged 4–18, open all of December. 7 levels, 6 age groups, verified e-certificates for every child, winners announced on 1 January.",
  keywords: [
    "abacus competition",
    "online abacus competition",
    "abacus olympiad",
    "mental maths competition",
    "flash anzan",
    "abacus exam for kids",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — Register for ₹10`,
    description: "Online abacus championship for ages 4–18. Exam open all December. Winners on New Year's Day.",
  },
};

export const viewport: Viewport = {
  themeColor: "#15123b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
