import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { pricing, site } from "@/lib/config";
import { rupees } from "@/lib/pricing";
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

const description = `India's online abacus competition for Nursery to Class 12. Launch offer: register for ${rupees(pricing.individual.offer)} (regular ${rupees(pricing.individual.regular)}); schools ${rupees(pricing.school.offer)} for unlimited students. Class-wise papers, one-hour exam slots in December, verified e-certificates and surprise gift vouchers for toppers. Winners on 1 January 2027.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Online abacus competition, Nursery to Class 12`,
    template: `%s · ${site.shortName}`,
  },
  description,
  applicationName: site.shortName,
  keywords: [
    site.shortName,
    site.name,
    "abacus competition",
    "online abacus competition",
    "abacus competition 2026",
    "abacus olympiad",
    "abacus championship India",
    "mental maths competition",
    "maths competition for kids",
    "flash anzan",
    "abacus exam for kids",
    "abacus competition for schools",
  ],
  authors: [{ name: site.organiser, url: site.url }],
  creator: site.organiser,
  publisher: site.organiser,
  category: "education",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `${site.name}: register for ${rupees(pricing.individual.offer)}`,
    description: "Online abacus championship for Nursery to Class 12. Book a one-hour exam slot in December. Toppers win surprise gift vouchers; winners on New Year's Day.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: register for ${rupees(pricing.individual.offer)}`,
    description: "Online abacus championship for Nursery to Class 12. Exam slots across December. Toppers win surprise gift vouchers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Search Console / Bing Webmaster verification codes, if you verify with an HTML tag instead of DNS.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#15123b",
  width: "device-width",
  initialScale: 1,
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.organiser,
  url: site.url,
  logo: `${site.url}/apple-icon`,
  email: site.contact.email,
  founder: site.founders.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role })),
  contactPoint: {
    "@type": "ContactPoint",
    telephone: `+${site.contact.whatsapp}`,
    email: site.contact.email,
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  name: site.name,
  alternateName: site.shortName,
  url: site.url,
  inLanguage: "en-IN",
  publisher: { "@id": `${site.url}/#organization` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <JsonLd data={[organizationLd, websiteLd]} />
        {children}
      </body>
    </html>
  );
}
