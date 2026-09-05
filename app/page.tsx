import Link from "next/link";

const voordelen = [
  {
    titel: "Sneller rekenen",
    tekst:
      "Voer de aangeleverde perioden in en zie het gemiddelde inkomen direct meelopen. Geen losse rekenmachine of eigen spreadsheet meer nodig.",
  },
  {
    titel: "Correcties inzichtelijk",
    tekst:
      "Leg per periode vast welk bedrag buiten beschouwing blijft en waarom. Het meetellend inkomen volgt automatisch.",
  },
  {
    titel: "Berekeningen reproduceerbaar",
    tekst:
      "Elke uitkomst is te herleiden tot de gebruikte formule en de ingevoerde bedragen, en is af te drukken als onderbouwing bij het dossier.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-24">
      <section className="max-w-3xl">
        <p className="text-sm font-medium text-brand">
          Rekenhulp voor gemeentelijke belastingen
        </p>
        <h1 className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-ink hyphens-auto sm:text-4xl">
          Van inkomensgegevens naar een controleerbare berekening.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">
          KwijtCalc helpt professionals binnen gemeentelijke belastingen om
          inkomensgegevens sneller, consistent en transparant te verwerken.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/berekening"
            className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            Start berekening
          </Link>
          <span className="text-sm text-ink-muted">
            Geen account nodig. Geen persoonsgegevens.
          </span>
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-3" aria-label="Voordelen">
        {voordelen.map((voordeel) => (
          <article
            key={voordeel.titel}
            className="rounded-lg border border-line bg-surface p-6"
          >
            <h2 className="text-base font-semibold text-ink">{voordeel.titel}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {voordeel.tekst}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-lg border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-base font-semibold text-ink">Hoe het werkt</h2>
        <ol className="mt-4 grid gap-4 text-sm leading-relaxed text-ink-muted sm:grid-cols-3">
          <li>
            <span className="font-medium text-ink">1. Perioden invoeren.</span>{" "}
            Neem de aangeleverde weken, 4-wekenperioden of maanden over.
          </li>
          <li>
            <span className="font-medium text-ink">2. Correcties toepassen.</span>{" "}
            Geef aan welk deel van het loon buiten beschouwing blijft en waarom.
          </li>
          <li>
            <span className="font-medium text-ink">3. Resultaat vastleggen.</span>{" "}
            Bekijk de gebruikte formules en druk de onderbouwing af.
          </li>
        </ol>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-base font-semibold text-ink">Ook beschikbaar</h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href="/beroep"
            className="text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Beroepsassistent
          </Link>
          <p className="text-sm leading-relaxed text-ink-muted">
            Lees een beroepschrift in en bekijk welke beroepsgronden in de tekst
            worden herkend. De pdf wordt volledig op het eigen apparaat verwerkt.
          </p>
        </div>
      </section>

      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-ink-muted">
        KwijtCalc neemt geen besluit over kwijtschelding en beoordeelt geen
        aanvragen. Het is een hulpmiddel bij het rekenwerk.
      </p>
    </div>
  );
}
