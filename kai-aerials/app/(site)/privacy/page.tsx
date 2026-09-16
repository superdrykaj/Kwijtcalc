import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Concept-privacyverklaring van ${site.name}.`,
  alternates: { canonical: "/privacy" },
  robots: { index: false },
};

/** Plek die je zelf nog moet invullen. */
function Fill({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-400/15 px-1.5 py-0.5 font-medium text-amber-300">
      [in te vullen: {children}]
    </mark>
  );
}

export default function PrivacyPage() {
  return (
    <div className="container-page py-20">
      <div className="max-w-3xl">
        <p className="eyebrow">Concept</p>
        <h1 className="display-1 mt-4 text-balance">Privacyverklaring</h1>

        <p className="notice notice-warning mt-8">
          Dit is een <strong>concept</strong>. De gemarkeerde plekken moet je zelf
          invullen of laten controleren voordat je de website publiceert. Deze
          tekst is geen juridisch advies.
        </p>

        <div className="prose-body mt-12 space-y-10">
          <section>
            <h2 className="display-3 mb-3">Wie is verantwoordelijk?</h2>
            <p>
              {site.name}, gevestigd in <Fill>vestigingsplaats</Fill>, is
              verantwoordelijk voor de verwerking van persoonsgegevens via deze
              website.
            </p>
            <p>
              KvK-nummer: <Fill>KvK-nummer</Fill>. Btw-nummer:{" "}
              <Fill>btw-identificatienummer</Fill>. Contact:{" "}
              <a href={`mailto:${site.email}`} className="text-azure-300 hover:underline">
                {site.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Welke gegevens worden verwerkt?</h2>
            <p>Via deze website worden de volgende gegevens verwerkt:</p>
            <ul className="ml-5 list-disc space-y-2 text-mist-300">
              <li>
                <strong>Afspraakaanvragen:</strong> naam, e-mailadres, eventueel
                telefoonnummer, opnamelocatie, projectomschrijving en het gekozen
                tijdstip.
              </li>
              <li>
                <strong>Contactformulier:</strong> naam, e-mailadres, onderwerp en
                bericht.
              </li>
              <li>
                <strong>Technische gegevens:</strong> het IP-adres wordt kortdurend
                in het werkgeheugen gebruikt om formulierspam af te remmen. Het
                wordt niet in de database opgeslagen.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display-3 mb-3">Waarvoor worden ze gebruikt?</h2>
            <p>
              Uitsluitend om je aanvraag of bericht te beantwoorden, de afspraak in
              te plannen en de opdracht uit te voeren. Je gegevens zijn nooit
              zichtbaar voor andere bezoekers van de website.
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Grondslag en bewaartermijn</h2>
            <p>
              De verwerking is nodig om je verzoek te beantwoorden en om een
              overeenkomst voor te bereiden of uit te voeren. Gegevens van
              afspraken en berichten worden bewaard gedurende{" "}
              <Fill>bewaartermijn, bijvoorbeeld 24 maanden</Fill>. Facturen worden
              bewaard zolang de wettelijke bewaarplicht geldt.
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Delen met anderen</h2>
            <p>
              Gegevens worden niet verkocht. Ze worden alleen gedeeld met partijen
              die nodig zijn om de website te laten werken:{" "}
              <Fill>hostingpartij</Fill> en <Fill>e-maildienst</Fill>. Met deze
              partijen sluit je een verwerkersovereenkomst.
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Cookies</h2>
            <p>
              Deze website plaatst geen trackingcookies. Er wordt één technisch
              noodzakelijk cookie gebruikt, en alleen voor de beheerder: het
              cookie dat de beheerder ingelogd houdt. Gebruik je later statistieken
              of ingesloten video&apos;s, vul dan hier aan welke cookies dat plaatst:{" "}
              <Fill>eventuele statistiek- of videocookies</Fill>.
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Beeldmateriaal</h2>
            <p>
              Bij dronefoto&apos;s en dronevideo&apos;s kunnen personen of panden
              herkenbaar in beeld komen. Afspraken over publicatie van beeld
              worden per opdracht vastgelegd:{" "}
              <Fill>afspraken over publicatie en portretrecht</Fill>.
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Jouw rechten</h2>
            <p>
              Je mag je gegevens inzien, laten corrigeren of laten verwijderen, en
              je kunt bezwaar maken tegen de verwerking. Stuur daarvoor een mail
              naar{" "}
              <a href={`mailto:${site.email}`} className="text-azure-300 hover:underline">
                {site.email}
              </a>
              . Kom je er samen niet uit, dan kun je een klacht indienen bij de
              Autoriteit Persoonsgegevens.
            </p>
          </section>

          <section>
            <h2 className="display-3 mb-3">Wijzigingen</h2>
            <p>
              Deze verklaring kan worden aangepast. Laatst bijgewerkt:{" "}
              <Fill>datum</Fill>.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/contact" className="btn btn-ghost">
            Naar de contactpagina
          </Link>
          <Link href="/" className="btn btn-quiet">
            Terug naar de homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
