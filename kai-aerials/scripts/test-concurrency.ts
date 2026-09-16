/**
 * Controleert dat twee gelijktijdige aanvragen voor hetzelfde tijdslot niet
 * allebei kunnen slagen. Draai dit terwijl de server niet schrijft.
 *
 *   npx tsx scripts/test-concurrency.ts <startUtc>
 */
import { createBooking } from "../lib/bookings";

const startUtc = Number(process.argv[2]);
const label = process.argv[3] ?? "?";

const result = createBooking({
  serviceId: 2,
  startUtc,
  name: `Gelijktijdig ${label}`,
  email: `gelijktijdig-${label}@voorbeeld.test`,
  phone: "",
  location: "DEMOGEGEVENS: testlocatie",
  description: "DEMOGEGEVENS: gelijktijdigheidstest",
});

console.log(
  JSON.stringify({ label, ok: result.ok, detail: result.ok ? result.booking.reference : result.error }),
);
