import Link from "next/link";

import { site } from "@/content/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-ink-700/70 bg-ink-900">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {site.name}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-500">
            {site.footerNote}
          </p>
          <p className="mt-4 text-sm text-mist-500">
            Werkgebied: <span className="text-mist-300">{site.region}</span>
          </p>
        </div>

        <nav aria-label="Footermenu">
          <h2 className="text-sm font-semibold text-mist-100">Menu</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-mist-500 hover:text-mist-100">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className="text-mist-500 hover:text-mist-100">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-mist-100">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="text-mist-500 hover:text-mist-100"
              >
                {site.email}
              </a>
            </li>
            {site.phone && (
              <li>
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="text-mist-500 hover:text-mist-100"
                >
                  {site.phone}
                </a>
              </li>
            )}
            <li>
              <Link href="/#boeken" className="text-azure-300 hover:text-azure-400">
                Plan een afspraak
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-700/70">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Alle bedrijfsgegevens en projecten op deze site
            zijn voorbeelden.
          </p>
          <Link href="/admin" className="hover:text-mist-300">
            Beheer
          </Link>
        </div>
      </div>
    </footer>
  );
}
