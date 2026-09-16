import "server-only";

import { site } from "@/content/site";
import { getDb } from "./db";
import { formatTimestamp } from "./time";
import type { Booking, ContactMessage } from "./types";

/**
 * E-mail versturen via SMTP.
 *
 * Zolang de SMTP-instellingen ontbreken wordt er GEEN e-mail verstuurd.
 * De poging wordt dan met status "skipped" in de tabel `mail_log` gezet en de
 * beheeromgeving laat zien dat e-mail nog niet is ingesteld. De website doet
 * dus nooit alsof er een mail is verzonden.
 *
 * Benodigde omgevingsvariabelen (zie .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM, MAIL_TO
 */

export type MailStatus = "sent" | "skipped" | "failed";

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.MAIL_FROM &&
      process.env.MAIL_TO,
  );
}

function logMail(
  to: string,
  subject: string,
  status: MailStatus,
  detail: string,
) {
  getDb()
    .prepare(
      "INSERT INTO mail_log (to_address, subject, status, detail, created_utc) VALUES (?, ?, ?, ?, ?)",
    )
    .run(to, subject, status, detail, Date.now());
}

export function recentMailLog(limit = 20) {
  return getDb()
    .prepare(
      "SELECT to_address, subject, status, detail, created_utc FROM mail_log ORDER BY id DESC LIMIT ?",
    )
    .all(limit) as {
    to_address: string;
    subject: string;
    status: string;
    detail: string;
    created_utc: number;
  }[];
}

async function send(
  to: string,
  subject: string,
  text: string,
): Promise<MailStatus> {
  if (!isMailConfigured()) {
    logMail(to, subject, "skipped", "SMTP nog niet ingesteld; niets verzonden.");
    return "skipped";
  }
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
    });
    logMail(to, subject, "sent", "");
    return "sent";
  } catch (error) {
    logMail(to, subject, "failed", String(error).slice(0, 500));
    return "failed";
  }
}

function bookingSummary(booking: Booking): string {
  return [
    `Kenmerk: ${booking.reference}`,
    `Dienst: ${booking.serviceName}`,
    `Datum en tijd: ${formatTimestamp(booking.startUtc)} (Europe/Amsterdam)`,
    `Locatie: ${booking.location || "niet opgegeven"}`,
    `Naam: ${booking.name}`,
    `E-mail: ${booking.email}`,
    `Telefoon: ${booking.phone || "niet opgegeven"}`,
    "",
    "Omschrijving:",
    booking.description || "(geen omschrijving)",
  ].join("\n");
}

/** Bevestiging naar de klant en melding naar de eigenaar. */
export async function sendBookingRequestMails(booking: Booking): Promise<{
  customer: MailStatus;
  owner: MailStatus;
}> {
  const customer = await send(
    booking.email,
    `Aanvraag ontvangen (${booking.reference}) — ${site.name}`,
    [
      `Hoi ${booking.name},`,
      "",
      `Bedankt voor je aanvraag bij ${site.name}. Ik heb hem in goede orde ontvangen.`,
      "",
      bookingSummary(booking),
      "",
      "Let op: dit is nog geen definitieve afspraak. Ik controleer eerst de",
      "locatie, de regels voor het luchtruim en de weersverwachting en",
      "bevestig daarna per e-mail.",
      "",
      "Vragen? Antwoord gerust op deze mail.",
      "",
      `Groet, Kai — ${site.name}`,
      site.email,
    ].join("\n"),
  );

  const owner = await send(
    process.env.MAIL_TO ?? site.email,
    `Nieuwe aanvraag ${booking.reference} — ${booking.name}`,
    ["Er is een nieuwe aanvraag binnengekomen.", "", bookingSummary(booking)].join(
      "\n",
    ),
  );

  return { customer, owner };
}

export async function sendBookingConfirmedMail(
  booking: Booking,
): Promise<MailStatus> {
  return send(
    booking.email,
    `Afspraak bevestigd (${booking.reference}) — ${site.name}`,
    [
      `Hoi ${booking.name},`,
      "",
      "Je afspraak is bevestigd. Tot dan!",
      "",
      bookingSummary(booking),
      "",
      "Verandert er iets aan het weer of de locatie, dan neem ik op tijd contact op.",
      "",
      `Groet, Kai — ${site.name}`,
    ].join("\n"),
  );
}

export async function sendBookingCancelledMail(
  booking: Booking,
  reason: "rejected" | "cancelled",
): Promise<MailStatus> {
  const what =
    reason === "rejected"
      ? "Helaas kan ik deze aanvraag niet inplannen."
      : "Deze afspraak is geannuleerd.";
  return send(
    booking.email,
    `Afspraak ${booking.reference} — ${site.name}`,
    [
      `Hoi ${booking.name},`,
      "",
      what,
      "",
      bookingSummary(booking),
      "",
      "Wil je een ander moment proberen? Je kunt een nieuwe aanvraag doen via de website.",
      "",
      `Groet, Kai — ${site.name}`,
    ].join("\n"),
  );
}

export async function sendContactMails(
  message: ContactMessage,
): Promise<{ customer: MailStatus; owner: MailStatus }> {
  const customer = await send(
    message.email,
    `Bericht ontvangen — ${site.name}`,
    [
      `Hoi ${message.name},`,
      "",
      "Bedankt voor je bericht. Ik lees het en reageer meestal binnen één werkdag.",
      "",
      "Je bericht:",
      message.message,
      "",
      `Groet, Kai — ${site.name}`,
    ].join("\n"),
  );
  const owner = await send(
    process.env.MAIL_TO ?? site.email,
    `Contactformulier: ${message.subject}`,
    [
      `Van: ${message.name} <${message.email}>`,
      `Onderwerp: ${message.subject}`,
      "",
      message.message,
    ].join("\n"),
  );
  return { customer, owner };
}
