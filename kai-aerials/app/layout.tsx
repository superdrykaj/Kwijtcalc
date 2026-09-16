import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

import { site } from "@/content/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description:
    `${site.name} maakt dronefoto's en dronevideo's voor vastgoed, bedrijven, ` +
    `locaties en evenementen in ${site.region}. Plan direct een afspraak.`,
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: `Dronebeelden voor vastgoed, bedrijven, locaties en evenementen in ${site.region}.`,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: site.name }],
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${sora.variable} min-h-dvh`}>
        <a
          href="#hoofdinhoud"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-azure-500 focus:px-5 focus:py-2 focus:font-semibold focus:text-ink-950"
        >
          Naar de hoofdinhoud
        </a>
        {children}
      </body>
    </html>
  );
}
