"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overzicht" },
  { href: "/admin/boekingen", label: "Boekingen" },
  { href: "/admin/beschikbaarheid", label: "Beschikbaarheid" },
  { href: "/admin/diensten", label: "Diensten" },
  { href: "/admin/projecten", label: "Projecten" },
  { href: "/admin/berichten", label: "Berichten" },
  { href: "/admin/instellingen", label: "Instellingen" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Beheermenu" className="border-t border-ink-800">
      <ul className="container-page flex gap-1 overflow-x-auto py-2">
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-ink-800 font-semibold text-mist-100"
                    : "text-mist-500 hover:text-mist-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
