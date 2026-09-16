/** Vult de database met duidelijk herkenbare DEMO-gegevens voor een preview. */
import { createBooking, setBookingStatus } from "../lib/bookings";
import { listServices } from "../lib/services";
import { createMessage } from "../lib/messages";
import { addDays, todayKey, zonedToUtc } from "../lib/time";

const day = (n: number) => addDays(todayKey(), n);

const services = listServices({ onlyActive: true });
const bySlug = (slug: string) => {
  const found = services.find((s) => s.slug === slug);
  if (!found) throw new Error(`Dienst niet gevonden: ${slug}`);
  return found.id;
};

const items = [
  { serviceId: bySlug("dronefotografie"), dateKey: day(2), minutes: 9 * 60, name: "DEMO — Sanne de Wit", email: "demo-sanne@voorbeeld.test", phone: "06 12 34 56 78", location: "DEMO: Vechtdijk 12, Maarssen", description: "DEMOGEGEVENS. Luchtfoto's van een herenhuis voor de verkoopbrochure. Graag in het laatste uur voor zonsondergang.", confirm: true },
  { serviceId: bySlug("dronevideo"), dateKey: day(5), minutes: 10 * 60, name: "DEMO — Bouwbedrijf Van Leeuwen", email: "demo-bouw@voorbeeld.test", phone: "", location: "DEMO: Bedrijfsweg 40, Nieuwegein", description: "DEMOGEGEVENS. Video van het terrein voor de nieuwe website. Circa twee minuten montage.", confirm: false },
  { serviceId: bySlug("kennismaking"), dateKey: day(3), minutes: 11 * 60, name: "DEMO — Marijke Bos", email: "demo-marijke@voorbeeld.test", phone: "06 87 65 43 21", location: "DEMO: online", description: "DEMOGEGEVENS. Kort gesprek over een reeks opnames van een recreatieterrein.", confirm: false },
];

for (const item of items) {
  const result = createBooking({
    serviceId: item.serviceId,
    startUtc: zonedToUtc(item.dateKey, item.minutes),
    name: item.name,
    email: item.email,
    phone: item.phone,
    location: item.location,
    description: item.description,
  });
  if (result.ok && item.confirm) setBookingStatus(result.booking.id, "confirmed");
  console.log(item.name, result.ok ? "aangemaakt" : `mislukt: ${result.error}`);
}

createMessage({
  name: "DEMO — Joris Hendriks",
  email: "demo-joris@voorbeeld.test",
  subject: "DEMO: vraag over opnames bij een evenement",
  message:
    "DEMOGEGEVENS. Hoi Kai, we organiseren in juni een festival in het park. " +
    "Is het mogelijk om daar een overzichtsbeeld van te maken? Ik hoor graag wat er kan.",
});
console.log("Demobericht toegevoegd.");
