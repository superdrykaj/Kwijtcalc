// Let op: dit bestand draait alleen op de server (leest en schrijft de database).
import { getDb } from "./db";
import type { ContactMessage } from "./types";

type Row = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: number;
  created_utc: number;
};

function map(row: Row): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    handled: row.handled === 1,
    createdUtc: row.created_utc,
  };
}

export function createMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): number {
  const result = getDb()
    .prepare(
      "INSERT INTO contact_messages (name, email, subject, message, created_utc) VALUES (?, ?, ?, ?, ?)",
    )
    .run(input.name, input.email, input.subject, input.message, Date.now());
  return Number(result.lastInsertRowid);
}

export function listMessages(): ContactMessage[] {
  const rows = getDb()
    .prepare("SELECT * FROM contact_messages ORDER BY created_utc DESC")
    .all() as Row[];
  return rows.map(map);
}

export function countUnhandledMessages(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM contact_messages WHERE handled = 0")
    .get() as { n: number };
  return row.n;
}

export function setMessageHandled(id: number, handled: boolean): void {
  getDb()
    .prepare("UPDATE contact_messages SET handled = ? WHERE id = ?")
    .run(handled ? 1 : 0, id);
}

export function deleteMessage(id: number): void {
  getDb().prepare("DELETE FROM contact_messages WHERE id = ?").run(id);
}
