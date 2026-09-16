import type { Metadata } from "next";
import Link from "next/link";

import { PortfolioGrid } from "@/components/portfolio-grid";
import { site } from "@/content/site";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio",
  description: `Voorbeeldprojecten van ${site.name}: dronefoto's en dronevideo's voor vastgoed, bedrijven, evenementen, natuur en locaties in ${site.region}.`,
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  const projects = listProjects({ onlyPublished: true, featuredFirst: true });

  return (
    <div className="container-page py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Portfolio</p>
        <h1 className="display-1 mt-4 text-balance">Werk vanuit de lucht.</h1>
        <p className="lede mt-6">
          Hieronder staan voorbeeldprojecten uit {site.region}. Filter op het
          soort opdracht om te zien wat er mogelijk is.
        </p>
        <p className="notice notice-info mt-8">
          Let op: dit zijn <strong>fictieve voorbeeldprojecten</strong> met
          tijdelijke afbeeldingen. Vervang ze in de beheeromgeving door je eigen
          werk.
        </p>
      </header>

      <div className="mt-14">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-600 px-6 py-20 text-center">
            <p className="text-mist-300">Er zijn nog geen projecten gepubliceerd.</p>
            <Link href="/admin/projecten" className="btn btn-ghost mt-6">
              Naar de beheeromgeving
            </Link>
          </div>
        ) : (
          <PortfolioGrid projects={projects} />
        )}
      </div>

      <section className="mt-24 rounded-2xl border border-ink-700 bg-ink-900 px-6 py-14 text-center sm:px-12">
        <h2 className="display-2 text-balance">Ook zo&apos;n project laten maken?</h2>
        <p className="lede mx-auto mt-4 max-w-xl">
          Vertel me wat je voor ogen hebt. Een kennismaking van twintig minuten
          is gratis en vrijblijvend.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/#boeken" className="btn btn-primary">
            Plan een afspraak
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Stel een vraag
          </Link>
        </div>
      </section>
    </div>
  );
}
