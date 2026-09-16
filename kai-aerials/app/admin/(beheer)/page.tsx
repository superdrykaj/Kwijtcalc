import Link from "next/link";

import { EmptyState, PageHeading, Panel, StatusBadge } from "@/components/admin/ui";
import { conflictingBookings } from "@/lib/availability";
import { countBookings, listBookings } from "@/lib/bookings";
import { isMailConfigured, recentMailLog } from "@/lib/mail";
import { countUnhandledMessages } from "@/lib/messages";
import { listProjects } from "@/lib/projects";
import { formatTimestamp } from "@/lib/time";
import { STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { now, pending, confirmed, unread, published, upcoming, conflicts, mailReady, mailLog } =
    await loadDashboard();
  return renderDashboard({
    now,
    pending,
    confirmed,
    unread,
    published,
    upcoming,
    conflicts,
    mailReady,
    mailLog,
  });
}

/** Alle gegevens voor het overzicht ophalen. */
async function loadDashboard() {
  const now = Date.now();
  const pending = countBookings("pending");
  const confirmed = countBookings("confirmed");
  const unread = countUnhandledMessages();
  const projects = listProjects();
  const published = projects.filter((p) => p.published).length;

  const upcoming = listBookings({ fromUtc: now })
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .slice(0, 6);

  const conflicts = conflictingBookings(now);
  const mailReady = isMailConfigured();
  const mailLog = recentMailLog(5);

  return {
    now,
    pending,
    confirmed,
    unread,
    published,
    upcoming,
    conflicts,
    mailReady,
    mailLog,
  };
}

function renderDashboard({
  pending,
  confirmed,
  unread,
  published,
  upcoming,
  conflicts,
  mailReady,
  mailLog,
}: Awaited<ReturnType<typeof loadDashboard>>) {
  return (
    <>
      <PageHeading
        title="Overzicht"
        intro="Wat er nu op je bordje ligt, en hoe de website ervoor staat."
      />

      {!mailReady && (
        <p className="notice notice-warning mb-6">
          <strong>E-mail is nog niet ingesteld.</strong> Aanvragen en berichten
          worden gewoon opgeslagen, maar er gaan geen bevestigingsmails uit. Zie{" "}
          <Link href="/admin/instellingen" className="underline">
            Instellingen
          </Link>{" "}
          voor wat je nog moet invullen.
        </p>
      )}

      {conflicts.length > 0 && (
        <div className="notice notice-warning mb-6">
          <p>
            <strong>Let op:</strong> {conflicts.length}{" "}
            {conflicts.length === 1 ? "boeking valt" : "boekingen vallen"} buiten
            je huidige beschikbaarheid. Ze zijn niet verwijderd.
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {conflicts.slice(0, 5).map((conflict) => (
              <li key={conflict.id}>
                {conflict.reference} — {conflict.name},{" "}
                {formatTimestamp(conflict.startUtc)} ({conflict.reason})
              </li>
            ))}
          </ul>
          <Link href="/admin/boekingen" className="btn btn-quiet mt-3">
            Naar de boekingen
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open aanvragen" value={pending} href="/admin/boekingen?status=pending" highlight={pending > 0} />
        <Stat label="Bevestigde afspraken" value={confirmed} href="/admin/boekingen?status=confirmed" />
        <Stat label="Nieuwe berichten" value={unread} href="/admin/berichten" highlight={unread > 0} />
        <Stat label="Gepubliceerde projecten" value={published} href="/admin/projecten" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Eerstvolgende afspraken">
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nog niets gepland"
              body="Zodra iemand een afspraak aanvraagt, verschijnt die hier."
              href="/admin/beschikbaarheid"
              linkLabel="Beschikbaarheid instellen"
            />
          ) : (
            <ul className="divide-y divide-ink-700">
              {upcoming.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-48 shrink-0 text-sm tabular-nums text-mist-300">
                    {formatTimestamp(booking.startUtc)}
                  </span>
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{booking.name}</span>
                    <span className="text-mist-500"> — {booking.serviceName}</span>
                  </span>
                  <StatusBadge status={booking.status} label={STATUS_LABELS[booking.status]} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/boekingen" className="btn btn-quiet mt-5">
            Alle boekingen
          </Link>
        </Panel>

        <Panel title="Verzonden e-mail" description="De laatste pogingen om e-mail te versturen.">
          {mailLog.length === 0 ? (
            <p className="text-sm text-mist-500">Nog geen e-mailverkeer.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {mailLog.map((entry, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-mist-300">{entry.subject}</span>
                    <span className="block text-xs text-mist-600">
                      {entry.to_address} · {formatTimestamp(entry.created_utc)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-xs ${
                      entry.status === "sent"
                        ? "text-emerald-300"
                        : entry.status === "failed"
                          ? "text-rose-300"
                          : "text-amber-300"
                    }`}
                  >
                    {entry.status === "sent"
                      ? "verzonden"
                      : entry.status === "failed"
                        ? "mislukt"
                        : "niet verstuurd"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card block p-5 transition-colors hover:border-azure-500/60 ${
        highlight ? "border-azure-500/50" : ""
      }`}
    >
      <p className="text-sm text-mist-500">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums">
        {value}
      </p>
    </Link>
  );
}
