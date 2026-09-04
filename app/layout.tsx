import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KwijtCalc — inkomensberekening",
  description:
    "Rekenhulp voor medewerkers kwijtschelding en invordering: inkomensperioden invoeren, correcties toepassen en een controleerbaar gemiddeld inkomen berekenen.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-line bg-surface print:hidden">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
              <Link
                href="/"
                className="text-base font-semibold tracking-tight text-ink"
              >
                Kwijt<span className="text-brand">Calc</span>
              </Link>
              <nav aria-label="Hoofdmenu">
                <Link
                  href="/berekening"
                  className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                >
                  Nieuwe inkomensberekening
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-line bg-surface print:hidden">
            <div className="mx-auto w-full max-w-5xl px-5 py-6 text-sm leading-relaxed text-ink-muted">
              <p>
                KwijtCalc ondersteunt bij het uitvoeren van berekeningen. De
                behandelend medewerker blijft verantwoordelijk voor de
                beoordeling en toepassing van de geldende wet- en regelgeving.
              </p>
              <p className="mt-2">
                Voer geen persoonsgegevens in. Gegevens blijven in deze versie
                in uw browser en worden niet opgeslagen of verzonden.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
