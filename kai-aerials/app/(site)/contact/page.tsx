import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { site } from "@/content/site";
import { isMailConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: `Neem contact op met ${site.name} voor dronefoto's en dronevideo's in ${site.region}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const mailReady = isMailConfigured();

  return (
    <div className="container-page py-20">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="display-1 mt-4 text-balance">Even sparren?</h1>
          <p className="lede mt-6">{site.contactIntro}</p>

          <dl className="mt-10 space-y-6">
            <div>
              <dt className="text-sm text-mist-500">E-mail</dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${site.email}`}
                  className="text-lg font-medium text-azure-300 hover:underline"
                >
                  {site.email}
                </a>
              </dd>
            </div>
            {site.phone && (
              <div>
                <dt className="text-sm text-mist-500">Telefoon</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${site.phone.replace(/\s/g, "")}`}
                    className="text-lg font-medium hover:underline"
                  >
                    {site.phone}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-mist-500">Werkgebied</dt>
              <dd className="mt-1 text-lg font-medium">{site.region}</dd>
            </div>
            <div>
              <dt className="text-sm text-mist-500">Liever meteen een moment prikken?</dt>
              <dd className="mt-3">
                <Link href="/#boeken" className="btn btn-primary">
                  Plan een afspraak
                </Link>
              </dd>
            </div>
          </dl>

          <p className="mt-10 text-xs leading-relaxed text-mist-600">
            Alle gegevens op deze pagina zijn voorbeelden. Lees in de{" "}
            <Link href="/privacy" className="text-mist-500 underline">
              privacyverklaring
            </Link>{" "}
            hoe met je gegevens wordt omgegaan.
          </p>
        </div>

        <div>
          <div className="card p-6 sm:p-8">
            <h2 className="display-3">Stuur een bericht</h2>
            <p className="mt-2 text-sm text-mist-500">
              Vul het formulier in en ik reageer meestal binnen één werkdag.
            </p>
            <div className="mt-7">
              <ContactForm mailReady={mailReady} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
