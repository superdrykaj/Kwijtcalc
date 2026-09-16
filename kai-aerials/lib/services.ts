// Let op: dit bestand draait alleen op de server (leest de database).
import { getDb } from "./db";
import type { Service } from "./types";

type Row = {
  id: number;
  slug: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_label: string;
  buffer_minutes: number;
  bookable: number;
  intro_only: number;
  sort_order: number;
  active: number;
};

function map(row: Row): Service {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceLabel: row.price_label,
    bufferMinutes: row.buffer_minutes,
    bookable: row.bookable === 1,
    introOnly: row.intro_only === 1,
    sortOrder: row.sort_order,
    active: row.active === 1,
  };
}

export function listServices(options: { onlyActive?: boolean } = {}): Service[] {
  const where = options.onlyActive ? "WHERE active = 1" : "";
  const rows = getDb()
    .prepare(`SELECT * FROM services ${where} ORDER BY sort_order, id`)
    .all() as Row[];
  return rows.map(map);
}

export function getService(id: number): Service | null {
  const row = getDb()
    .prepare("SELECT * FROM services WHERE id = ?")
    .get(id) as Row | undefined;
  return row ? map(row) : null;
}

export function updateService(
  id: number,
  values: Omit<Service, "id" | "slug">,
): void {
  getDb()
    .prepare(
      `UPDATE services SET name = ?, description = ?, duration_minutes = ?,
       price_label = ?, buffer_minutes = ?, bookable = ?, intro_only = ?,
       sort_order = ?, active = ? WHERE id = ?`,
    )
    .run(
      values.name,
      values.description,
      values.durationMinutes,
      values.priceLabel,
      values.bufferMinutes,
      values.bookable ? 1 : 0,
      values.introOnly ? 1 : 0,
      values.sortOrder,
      values.active ? 1 : 0,
      id,
    );
}

export function createService(values: Omit<Service, "id">): number {
  const result = getDb()
    .prepare(
      `INSERT INTO services
        (slug, name, description, duration_minutes, price_label, buffer_minutes,
         bookable, intro_only, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      values.slug,
      values.name,
      values.description,
      values.durationMinutes,
      values.priceLabel,
      values.bufferMinutes,
      values.bookable ? 1 : 0,
      values.introOnly ? 1 : 0,
      values.sortOrder,
      values.active ? 1 : 0,
    );
  return Number(result.lastInsertRowid);
}

export function deleteService(id: number): void {
  // Diensten met boekingen worden gedeactiveerd in plaats van verwijderd,
  // zodat bestaande boekingen hun dienstnaam behouden.
  const used = getDb()
    .prepare("SELECT COUNT(*) AS n FROM bookings WHERE service_id = ?")
    .get(id) as { n: number };
  if (used.n > 0) {
    getDb().prepare("UPDATE services SET active = 0 WHERE id = ?").run(id);
    return;
  }
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
}
