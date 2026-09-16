import Image from "next/image";
import Link from "next/link";

import { BookingWidget } from "@/components/booking/booking-widget";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { site } from "@/content/site";
import { listProjects } from "@/lib/projects";
import { listServices } from "@/lib/services";

// De boekingsmodule toont actuele beschikbaarheid, dus niets vooraf cachen.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const services = listServices({ onlyActive: true });
  const projects = listProjects({
    onlyPublished: true,
    featuredFirst: true,
    limit: 3,
  });

  return (
    <>
      <Hero />
      <Services services={services} />
      <Work projects={projects} />
      <Process />
      <Booking services={services} />
      <About />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative isolate -mt-[4.5rem] flex min-h-[92svh] items-end overflow-hidden pt-[4.5rem]">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/70 via-ink-950/40 to-ink-950"
      />

      <div className="container-page pb-20 pt-24 sm:pb-28">
        <p className="eyebrow fade">{site.tagline}</p>
        <h1 className="display-1 rise mt-5 max-w-4xl text-balance">
          {site.heroTitle}
        </h1>
        <p className="lede rise mt-7 max-w-2xl" style={{ animationDelay: "120ms" }}>
          {site.heroIntro}
        </p>
        <div
          className="rise mt-10 flex flex-wrap gap-3"
          style={{ animationDelay: "220ms" }}
        >
          <a href="#boeken" className="btn btn-primary">
            Plan een afspraak
          </a>
          <Link href="/portfolio" className="btn btn-ghost">
            Bekijk mijn werk
          </Link>
        </div>
        <p
          className="rise mt-8 text-xs text-mist-600"
          style={{ animationDelay: "320ms" }}
        >
          Voorbeeldbeeld — vervang <code>public/images/hero.jpg</code> door je
          eigen dronefoto.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Services({
  services,
}: {
  services: { id: number; name: string; priceLabel: string; durationMinutes: number }[];
}) {
  return (
    <section className="container-page py-24" aria-labelledby="diensten-titel">
      <Reveal>
        <p className="eyebrow">Wat ik doe</p>
        <h2 id="diensten-titel" className="display-2 mt-4 max-w-2xl text-balance">
          Dronebeelden die laten zien wat er op de grond niet past.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
        {site.serviceHighlights.map((item, index) => (
          <Reveal key={item.title} delay={index * 70}>
            <article className="h-full bg-ink-900 p-7">
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-azure-600/15 text-sm font-semibold text-azure-300"
              >
                {index + 1}
              </span>
              <h3 className="display-3 mt-5 text-base">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist-500">{item.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      {services.length > 0 && (
        <Reveal delay={120}>
          <ul className="mt-10 flex flex-wrap gap-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-baseline gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm"
              >
                <span className="font-medium">{service.name}</span>
                <span className="text-mist-600">·</span>
                <span className="text-mist-500">{service.durationMinutes} min</span>
                {service.priceLabel && (
                  <>
                    <span className="text-mist-600">·</span>
                    <span className="text-azure-300">{service.priceLabel}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Work({ projects }: { projects: Awaited<ReturnType<typeof listProjects>> }) {
  return (
    <section className="border-y border-ink-700/70 bg-ink-900/40 py-24" aria-labelledby="werk-titel">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Voorbeeldprojecten</p>
              <h2 id="werk-titel" className="display-2 mt-4 max-w-xl text-balance">
                Een selectie uit mijn werk.
              </h2>
            </div>
            <Link href="/portfolio" className="btn btn-ghost">
              Alle projecten
            </Link>
          </div>
        </Reveal>

        {projects.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-600 px-6 py-16 text-center">
            <p className="text-mist-300">Er zijn nog geen projecten gepubliceerd.</p>
            <p className="mt-2 text-sm text-mist-500">
              Voeg projecten toe via de beheeromgeving.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project.id} delay={index * 90}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Process() {
  return (
    <section className="container-page py-24" aria-labelledby="werkwijze-titel">
      <Reveal>
        <p className="eyebrow">Werkwijze</p>
        <h2 id="werkwijze-titel" className="display-2 mt-4 max-w-2xl text-balance">
          Van eerste gesprek tot opgeleverde beelden.
        </h2>
      </Reveal>

      <ol className="mt-14 grid gap-8 md:grid-cols-4">
        {site.process.map((step, index) => (
          <Reveal key={step.title} delay={index * 80}>
            <li className="relative pt-6">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-azure-500/70 to-transparent"
              />
              <span className="text-sm font-semibold tabular-nums text-azure-300">
                0{index + 1}
              </span>
              <h3 className="display-3 mt-3 text-base">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist-500">{step.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Booking({
  services,
}: {
  services: Awaited<ReturnType<typeof listServices>>;
}) {
  const publicServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    priceLabel: s.priceLabel,
    bookable: s.bookable,
    introOnly: s.introOnly,
  }));

  return (
    <section
      id="boeken"
      className="scroll-mt-24 border-t border-ink-700/70 bg-ink-900/40 py-24"
      aria-labelledby="boeken-titel"
    >
      <div className="container-page">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Plan een afspraak</p>
            <h2 id="boeken-titel" className="display-2 mt-4 text-balance">
              Kies een moment dat jou uitkomt.
            </h2>
            <p className="lede mt-5">{site.bookingDisclaimer}</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-12 max-w-4xl">
            <BookingWidget services={publicServices} />
          </div>
        </Reveal>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-mist-600">
          Alle tijden staan in de Nederlandse tijdzone (Europe/Amsterdam).
          Liever eerst overleggen?{" "}
          <Link href="/contact" className="text-azure-300 hover:underline">
            Stuur me een bericht
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function About() {
  return (
    <section className="container-page py-24" aria-labelledby="over-titel">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-700">
            <Image
              src="/images/about.jpg"
              alt="Voorbeeldbeeld van een dronevlucht boven een landschap"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div>
            <p className="eyebrow">Over mij</p>
            <h2 id="over-titel" className="display-2 mt-4 text-balance">
              Eén aanspreekpunt, van plan tot oplevering.
            </h2>
            <div className="prose-body mt-6">
              <p>
                Ik werk als zelfstandig dronepiloot in {site.region}. Je hebt
                dus geen tussenpersonen: we bespreken samen wat je nodig hebt, ik
                vlieg zelf en ik lever de beelden zelf op.
              </p>
              <p>
                Ik vlieg met een {site.equipment}. Dat is een compacte drone,
                waardoor ik ook op krappere locaties kan werken en snel kan
                inspelen op het licht en het weer van dat moment.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#boeken" className="btn btn-primary">
                Plan een afspraak
              </a>
              <Link href="/contact" className="btn btn-ghost">
                Neem contact op
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
