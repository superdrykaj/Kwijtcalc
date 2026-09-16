import { PageHeading, Panel } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { site } from "@/content/site";
import { isMailConfigured } from "@/lib/mail";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = getSettings();
  const mailReady = isMailConfigured();

  return (
    <>
      <PageHeading
        title="Instellingen"
        intro="Boekingsregels en de koppelingen die nog ingesteld moeten worden."
      />

      <div className="space-y-8">
        <Panel
          title="Boekingsregels"
          description="Deze regels gelden voor alle diensten in de boekingsmodule."
        >
          <SettingsForm settings={settings} />
        </Panel>

        <Panel title="E-mail" description="Bevestigingsmails naar klanten en meldingen naar jou.">
          {mailReady ? (
            <p className="notice notice-success">
              E-mail is ingesteld. Bevestigingen worden verstuurd via{" "}
              <code>{process.env.SMTP_HOST}</code>.
            </p>
          ) : (
            <>
              <p className="notice notice-warning">
                E-mail is nog niet ingesteld. Aanvragen en berichten worden wél
                opgeslagen, maar er gaan geen e-mails uit.
              </p>
              <p className="mt-4 text-sm text-mist-300">
                Zet deze regels in <code>.env.local</code> en start de server
                opnieuw:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-700 bg-ink-900 p-4 text-xs text-mist-300">
{`SMTP_HOST="smtp.jouwprovider.nl"
SMTP_PORT="587"
SMTP_USER="jouw-gebruikersnaam"
SMTP_PASSWORD="jouw-wachtwoord"
MAIL_FROM="${site.name} <no-reply@jouwdomein.nl>"
MAIL_TO="${site.email}"`}
              </pre>
              <p className="field-hint">
                Deze waarden staan alleen op de server en komen nooit in de
                frontend terecht.
              </p>
            </>
          )}
        </Panel>

        <Panel title="Bedrijfsgegevens en teksten">
          <p className="text-sm leading-relaxed text-mist-300">
            Bedrijfsnaam, e-mailadres, werkgebied en alle vaste teksten staan in
            één bestand: <code className="text-mist-100">content/site.ts</code>.
            Pas dat bestand aan en de wijziging is direct overal op de site
            zichtbaar.
          </p>
          <p className="field-hint">
            Tijdelijke afbeeldingen staan in <code>public/images/</code>. Vervang
            de bestanden en houd dezelfde namen aan.
          </p>
        </Panel>
      </div>
    </>
  );
}
