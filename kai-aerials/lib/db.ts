// Let op: dit bestand draait alleen op de server (native module + bestandssysteem).
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite-database. Het bestand staat standaard in `data/kai-aerials.db`.
 * Zet DATABASE_PATH in het .env-bestand om een andere locatie te gebruiken.
 */

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(DATA_DIR, "kai-aerials.db");

declare global {
  var __kaiAerialsDb: Database.Database | undefined;
}

function create(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Wacht tot 5 seconden als een andere schrijver bezig is.
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__kaiAerialsDb) {
    globalThis.__kaiAerialsDb = create();
  }
  return globalThis.__kaiAerialsDb;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      slug             TEXT NOT NULL UNIQUE,
      name             TEXT NOT NULL,
      description      TEXT NOT NULL DEFAULT '',
      duration_minutes INTEGER NOT NULL,
      price_label      TEXT NOT NULL DEFAULT '',
      buffer_minutes   INTEGER NOT NULL DEFAULT 0,
      bookable         INTEGER NOT NULL DEFAULT 1,
      intro_only       INTEGER NOT NULL DEFAULT 0,
      sort_order       INTEGER NOT NULL DEFAULT 0,
      active           INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS weekly_availability (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday      INTEGER NOT NULL,  -- 0 = zondag
      start_minute INTEGER NOT NULL,
      end_minute   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS date_overrides (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      date_key     TEXT NOT NULL,     -- 'YYYY-MM-DD'
      kind         TEXT NOT NULL,     -- 'block' | 'open'
      start_minute INTEGER NOT NULL,
      end_minute   INTEGER NOT NULL,
      note         TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_overrides_date ON date_overrides(date_key);

    CREATE TABLE IF NOT EXISTS bookings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      reference    TEXT NOT NULL UNIQUE,
      service_id   INTEGER NOT NULL REFERENCES services(id),
      start_utc    INTEGER NOT NULL,
      end_utc      INTEGER NOT NULL,
      status       TEXT NOT NULL,     -- pending | confirmed | rejected | cancelled
      name         TEXT NOT NULL,
      email        TEXT NOT NULL,
      phone        TEXT NOT NULL DEFAULT '',
      location     TEXT NOT NULL DEFAULT '',
      description  TEXT NOT NULL DEFAULT '',
      admin_note   TEXT NOT NULL DEFAULT '',
      created_utc  INTEGER NOT NULL,
      updated_utc  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_utc);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

    CREATE TABLE IF NOT EXISTS projects (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT NOT NULL UNIQUE,
      title        TEXT NOT NULL,
      category     TEXT NOT NULL,
      location     TEXT NOT NULL DEFAULT '',
      summary      TEXT NOT NULL DEFAULT '',
      body         TEXT NOT NULL DEFAULT '',
      cover_url    TEXT NOT NULL DEFAULT '',
      cover_alt    TEXT NOT NULL DEFAULT '',
      video_url    TEXT NOT NULL DEFAULT '',
      published    INTEGER NOT NULL DEFAULT 0,
      featured     INTEGER NOT NULL DEFAULT 0,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      created_utc  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_images (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      url        TEXT NOT NULL,
      alt        TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_project_images ON project_images(project_id);

    CREATE TABLE IF NOT EXISTS contact_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      subject     TEXT NOT NULL,
      message     TEXT NOT NULL,
      handled     INTEGER NOT NULL DEFAULT 0,
      created_utc INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mail_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      to_address  TEXT NOT NULL,
      subject     TEXT NOT NULL,
      status      TEXT NOT NULL,     -- sent | skipped | failed
      detail      TEXT NOT NULL DEFAULT '',
      created_utc INTEGER NOT NULL
    );
  `);
}

/**
 * Voert een schrijfbewerking uit in een exclusieve transactie.
 * `BEGIN IMMEDIATE` zorgt ervoor dat twee gelijktijdige aanvragen niet allebei
 * hetzelfde tijdslot kunnen claimen: de tweede wacht tot de eerste klaar is en
 * ziet dan de zojuist aangemaakte boeking.
 */
export function withWriteTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  const run = db.transaction(fn);
  return run.immediate(db);
}
