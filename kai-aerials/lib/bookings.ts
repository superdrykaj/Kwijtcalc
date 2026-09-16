// Let op: dit bestand draait alleen op de server (leest en schrijft de database).
import crypto from "node:crypto";

import { validateSlot } from "./availability";
import { getDb, withWriteTransaction } from "./db";
import { getService } from "./services";
import {
  BLOCKING_STATUSES,
  type Booking,
  type BookingStatus,
} from "./types";

type Row = {
  id: number;
  reference: string;
  service_id: number;
  service_name: string | null;
  start_utc: number;
  end_utc: number;
  status: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  admin_note: string;
  created_utc: number;
  updated_utc: number;
};

const SELECT =
  `SELECT b.*, s.name AS service_name FROM bookings b
   LEFT JOIN services s ON s.id = b.service_id`;

function map(row: Row): Booking {
  return {
    id: row.id,
    reference: row.reference,
    serviceId: row.service_id,
    serviceName: row.service_name ?? "Verwijderde dienst",
    startUtc: row.start_utc,
    endUtc: row.end_utc,
    status: row.status as BookingStatus,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    description: row.description,
    adminNote: row.admin_note,
    createdUtc: row.created_utc,
    updatedUtc: row.updated_utc,
  };
}

/** Kort, goed voorleesbaar kenmerk zoals "KA-7F3QD2". */
function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(6);
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `KA-${out}`;
}

export type NewBooking = {
  serviceId: number;
  startUtc: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  description: string;
};

export type CreateResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string };

/**
 * Maakt een aanvraag aan. De controle op beschikbaarheid gebeurt binnen
 * dezelfde exclusieve transactie als het wegschrijven, zodat twee bezoekers
 * niet allebei hetzelfde tijdslot kunnen claimen.
 */
export function createBooking(input: NewBooking): CreateResult {
  return withWriteTransaction((db): CreateResult => {
    const service = getService(input.serviceId);
    if (!service || !service.active || !service.bookable) {
      return { ok: false, error: "Deze dienst is niet beschikbaar." };
    }
    if (!Number.isFinite(input.startUtc)) {
      return { ok: false, error: "Kies een geldige datum en tijd." };
    }
    const problem = validateSlot(service, input.startUtc);
    if (problem) return { ok: false, error: problem };

    const now = Date.now();
    const endUtc = input.startUtc + service.durationMinutes * 60000;
    let reference = makeReference();
    // Uiterst zeldzaam, maar een dubbel kenmerk moet nooit een fout geven.
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = db
        .prepare("SELECT 1 FROM bookings WHERE reference = ?")
        .get(reference);
      if (!exists) break;
      reference = makeReference();
    }

    const result = db
      .prepare(
        `INSERT INTO bookings
          (reference, service_id, start_utc, end_utc, status, name, email,
           phone, location, description, admin_note, created_utc, updated_utc)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, '', ?, ?)`,
      )
      .run(
        reference,
        service.id,
        input.startUtc,
        endUtc,
        input.name,
        input.email,
        input.phone,
        input.location,
        input.description,
        now,
        now,
      );

    const row = db
      .prepare(`${SELECT} WHERE b.id = ?`)
      .get(Number(result.lastInsertRowid)) as Row;
    return { ok: true, booking: map(row) };
  });
}

export function listBookings(filter?: {
  status?: BookingStatus;
  fromUtc?: number;
  toUtc?: number;
}): Booking[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filter?.status) {
    clauses.push("b.status = ?");
    params.push(filter.status);
  }
  if (filter?.fromUtc !== undefined) {
    clauses.push("b.end_utc >= ?");
    params.push(filter.fromUtc);
  }
  if (filter?.toUtc !== undefined) {
    clauses.push("b.start_utc <= ?");
    params.push(filter.toUtc);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(`${SELECT} ${where} ORDER BY b.start_utc`)
    .all(...params) as Row[];
  return rows.map(map);
}

export function getBooking(id: number): Booking | null {
  const row = getDb().prepare(`${SELECT} WHERE b.id = ?`).get(id) as
    | Row
    | undefined;
  return row ? map(row) : null;
}

export function getBookingByReference(reference: string): Booking | null {
  const row = getDb()
    .prepare(`${SELECT} WHERE b.reference = ?`)
    .get(reference) as Row | undefined;
  return row ? map(row) : null;
}

export function countBookings(status: BookingStatus): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM bookings WHERE status = ?")
    .get(status) as { n: number };
  return row.n;
}

export function setBookingStatus(
  id: number,
  status: BookingStatus,
): { ok: boolean; error?: string } {
  return withWriteTransaction((db) => {
    const booking = getBooking(id);
    if (!booking) return { ok: false, error: "Boeking niet gevonden." };

    // Van vrijgegeven terug naar bezet? Dan opnieuw op botsingen controleren.
    if (
      BLOCKING_STATUSES.includes(status) &&
      !BLOCKING_STATUSES.includes(booking.status)
    ) {
      const service = getService(booking.serviceId);
      if (service) {
        const problem = validateSlot(service, booking.startUtc, Date.now(), id, {
          asAdmin: true,
        });
        if (problem) return { ok: false, error: problem };
      }
    }

    db.prepare(
      "UPDATE bookings SET status = ?, updated_utc = ? WHERE id = ?",
    ).run(status, Date.now(), id);
    return { ok: true };
  });
}

export function setAdminNote(id: number, note: string): void {
  getDb()
    .prepare("UPDATE bookings SET admin_note = ?, updated_utc = ? WHERE id = ?")
    .run(note, Date.now(), id);
}

/** Verplaatst een boeking naar een nieuw tijdstip, met botsingscontrole. */
export function rescheduleBooking(
  id: number,
  startUtc: number,
  options: { asAdmin?: boolean } = {},
): { ok: boolean; error?: string } {
  return withWriteTransaction((db) => {
    const booking = getBooking(id);
    if (!booking) return { ok: false, error: "Boeking niet gevonden." };
    const service = getService(booking.serviceId);
    if (!service) return { ok: false, error: "Dienst niet gevonden." };

    if (!Number.isFinite(startUtc)) {
      return { ok: false, error: "Kies een geldige datum en tijd." };
    }
    const problem = validateSlot(service, startUtc, Date.now(), id, {
      asAdmin: options.asAdmin,
    });
    if (problem) return { ok: false, error: problem };

    db.prepare(
      "UPDATE bookings SET start_utc = ?, end_utc = ?, updated_utc = ? WHERE id = ?",
    ).run(startUtc, startUtc + service.durationMinutes * 60000, Date.now(), id);
    return { ok: true };
  });
}

export function deleteBooking(id: number): void {
  getDb().prepare("DELETE FROM bookings WHERE id = ?").run(id);
}
