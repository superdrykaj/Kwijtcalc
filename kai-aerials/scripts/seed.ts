/**
 * Vult de database met FICTIEVE voorbeeldgegevens.
 *
 *   npm run seed            # vult alleen wat nog leeg is
 *   npm run seed -- --reset # gooit eerst alles weg
 *
 * Alle projecten en diensten hieronder zijn voorbeelden. Vervang ze via de
 * beheeromgeving door je eigen gegevens.
 */
import { getDb } from "../lib/db";
import { DEFAULT_SETTINGS, saveSettings } from "../lib/settings";

const reset = process.argv.includes("--reset");
const db = getDb();

if (reset) {
  db.exec(`
    DELETE FROM project_images;
    DELETE FROM projects;
    DELETE FROM bookings;
    DELETE FROM contact_messages;
    DELETE FROM mail_log;
    DELETE FROM services;
    DELETE FROM weekly_availability;
    DELETE FROM date_overrides;
    DELETE FROM settings;
  `);
  console.log("Bestaande gegevens verwijderd.");
}

/* -------------------------------------------------------------------------- */
/* Boekingsregels                                                             */
/* -------------------------------------------------------------------------- */

saveSettings(DEFAULT_SETTINGS);

/* -------------------------------------------------------------------------- */
/* Diensten                                                                   */
/* -------------------------------------------------------------------------- */

const SERVICES = [
  {
    slug: "kennismaking",
    name: "Kennismaking",
    description:
      "Een kort videogesprek of telefoongesprek waarin we je plannen doornemen. Vrijblijvend.",
    duration_minutes: 20,
    price_label: "Gratis",
    buffer_minutes: 15,
    bookable: 1,
    intro_only: 0,
    sort_order: 1,
    active: 1,
  },
  {
    slug: "dronefotografie",
    name: "Dronefotografie",
    description:
      "Een fotosessie op locatie. Je ontvangt een selectie bewerkte foto's in hoge resolutie.",
    duration_minutes: 60,
    price_label: "Indicatie vanaf € 149",
    buffer_minutes: 45,
    bookable: 1,
    intro_only: 0,
    sort_order: 2,
    active: 1,
  },
  {
    slug: "dronevideo",
    name: "Dronevideo",
    description:
      "Videobeelden op locatie, inclusief montage tot een korte film voor je website of socials.",
    duration_minutes: 90,
    price_label: "Indicatie vanaf € 249",
    buffer_minutes: 45,
    bookable: 1,
    intro_only: 0,
    sort_order: 3,
    active: 1,
  },
  {
    slug: "project-op-maat",
    name: "Project op maat",
    description:
      "Meerdere locaties, meerdere dagen of een combinatie van foto en video. We beginnen met een kennismaking.",
    duration_minutes: 20,
    price_label: "Prijs in overleg",
    buffer_minutes: 15,
    bookable: 1,
    intro_only: 1,
    sort_order: 4,
    active: 1,
  },
];

const insertService = db.prepare(
  `INSERT INTO services
    (slug, name, description, duration_minutes, price_label, buffer_minutes,
     bookable, intro_only, sort_order, active)
   VALUES (@slug, @name, @description, @duration_minutes, @price_label,
           @buffer_minutes, @bookable, @intro_only, @sort_order, @active)
   ON CONFLICT(slug) DO NOTHING`,
);
for (const service of SERVICES) insertService.run(service);

/* -------------------------------------------------------------------------- */
/* Standaardbeschikbaarheid                                                   */
/* -------------------------------------------------------------------------- */

const existingWeekly = db
  .prepare("SELECT COUNT(*) AS n FROM weekly_availability")
  .get() as { n: number };

if (existingWeekly.n === 0) {
  const insertWindow = db.prepare(
    "INSERT INTO weekly_availability (weekday, start_minute, end_minute) VALUES (?, ?, ?)",
  );
  // Maandag t/m vrijdag: 09:00–12:30 en 13:30–17:30. Zaterdag: 10:00–14:00.
  for (const weekday of [1, 2, 3, 4, 5]) {
    insertWindow.run(weekday, 9 * 60, 12 * 60 + 30);
    insertWindow.run(weekday, 13 * 60 + 30, 17 * 60 + 30);
  }
  insertWindow.run(6, 10 * 60, 14 * 60);
}

/* -------------------------------------------------------------------------- */
/* Voorbeeldprojecten (FICTIEF)                                               */
/* -------------------------------------------------------------------------- */

const PROJECTS = [
  {
    slug: "herenhuis-aan-de-vecht",
    title: "Herenhuis aan de Vecht",
    category: "vastgoed",
    location: "Maarssen (voorbeeld)",
    summary:
      "Luchtfoto's van een vrijstaand herenhuis, gemaakt voor de verkoopbrochure van een makelaar.",
    body:
      "De makelaar wilde laten zien hoe het huis aan het water ligt en hoe diep de tuin doorloopt. Vanaf de grond is dat niet te vangen.\n\nIk heb gevlogen in het laatste uur voor zonsondergang, zodat het water rustig ligt en de gevel warm licht vangt. Er zijn twaalf foto's opgeleverd: een reeks overzichten en een paar detailopnames van het dak en de aanbouw.\n\nDe beelden zijn gebruikt in de brochure, op Funda en in de advertenties op sociale media.",
    cover_url: "/images/project-vastgoed-1.jpg",
    cover_alt:
      "Voorbeeldbeeld: luchtfoto van een vrijstaand huis met tuin aan het water",
    video_url: "",
    featured: 1,
    sort_order: 1,
    images: [
      ["/images/gallery-1.jpg", "Voorbeeldbeeld: overzicht van het perceel vanuit het zuiden"],
      ["/images/project-vastgoed-2.jpg", "Voorbeeldbeeld: het huis met de oprit in beeld"],
    ],
  },
  {
    slug: "nieuwbouwwijk-in-aanbouw",
    title: "Nieuwbouwwijk in aanbouw",
    category: "vastgoed",
    location: "Houten (voorbeeld)",
    summary:
      "Maandelijkse voortgangsopnames van een nieuwbouwproject, steeds vanaf hetzelfde punt.",
    body:
      "Een ontwikkelaar wilde de bouw van 48 woningen vastleggen, zodat kopers de voortgang konden volgen.\n\nElke maand vloog ik dezelfde route op dezelfde hoogte. Daardoor zijn de beelden onderling goed te vergelijken en ontstaat er vanzelf een reeks.\n\nDe foto's stonden op de projectwebsite en zijn aan het eind gebruikt voor een korte terugblikvideo.",
    cover_url: "/images/project-vastgoed-2.jpg",
    cover_alt: "Voorbeeldbeeld: luchtfoto van een nieuwbouwwijk in aanbouw",
    video_url: "",
    featured: 0,
    sort_order: 2,
    images: [["/images/gallery-2.jpg", "Voorbeeldbeeld: overzicht van de bouwplaats"]],
  },
  {
    slug: "bedrijventerrein-lage-weide",
    title: "Bedrijventerrein Lage Weide",
    category: "bedrijven",
    location: "Utrecht (voorbeeld)",
    summary:
      "Sfeer- en overzichtsbeelden van een logistiek terrein voor de nieuwe bedrijfswebsite.",
    body:
      "Het bedrijf verhuisde naar een groter pand en wilde daar beelden van voor de website en een investeerderspresentatie.\n\nWe hebben gevlogen op een rustige zaterdagochtend, zodat er geen vrachtverkeer op het terrein stond. Naast overzichten heb ik een paar lagere passages gemaakt langs de gevel.\n\nOpgeleverd: acht foto's en een montage van veertig seconden.",
    cover_url: "/images/project-bedrijven-1.jpg",
    cover_alt: "Voorbeeldbeeld: luchtfoto van een bedrijventerrein",
    video_url: "",
    featured: 1,
    sort_order: 3,
    images: [["/images/gallery-2.jpg", "Voorbeeldbeeld: het terrein vanuit het noorden"]],
  },
  {
    slug: "productielocatie-in-bedrijf",
    title: "Productielocatie in bedrijf",
    category: "bedrijven",
    location: "Nieuwegein (voorbeeld)",
    summary:
      "Beelden van een productielocatie, gebruikt in een wervingscampagne voor nieuwe collega's.",
    body:
      "Voor een wervingscampagne waren beelden nodig die laten zien hoe groot de locatie is en hoe er gewerkt wordt.\n\nWe hebben vooraf met de bedrijfsleiding afgestemd welke delen wel en niet in beeld mochten komen. Tijdens de vlucht hield een collega toezicht op de begane grond.\n\nDe beelden zijn gebruikt op de vacaturepagina en in korte video's voor sociale media.",
    cover_url: "/images/project-bedrijven-2.jpg",
    cover_alt: "Voorbeeldbeeld: luchtfoto van een productielocatie",
    video_url: "",
    featured: 0,
    sort_order: 4,
    images: [],
  },
  {
    slug: "zomerfestival-in-het-park",
    title: "Zomerfestival in het park",
    category: "evenementen",
    location: "Utrecht (voorbeeld)",
    summary:
      "Een overzichtsbeeld van een eendaags festival, in overleg met de organisatie en de terreinbeheerder.",
    body:
      "De organisatie wilde één goed overzichtsbeeld voor de aftermovie en de verantwoording richting de gemeente.\n\nEr is vooraf afgestemd wanneer er gevlogen mocht worden en over welke delen van het terrein. Tijdens de vlucht is er op veilige afstand van het publiek gebleven.\n\nOpgeleverd: drie overzichtsfoto's en ruw videomateriaal voor de montage van de organisatie.",
    cover_url: "/images/project-evenementen-1.jpg",
    cover_alt: "Voorbeeldbeeld: luchtfoto van een festivalterrein in een park",
    video_url: "",
    featured: 0,
    sort_order: 5,
    images: [["/images/gallery-3.jpg", "Voorbeeldbeeld: het terrein in de avond"]],
  },
  {
    slug: "uiterwaarden-bij-zonsopkomst",
    title: "Uiterwaarden bij zonsopkomst",
    category: "natuur",
    location: "Kromme Rijngebied (voorbeeld)",
    summary:
      "Vrij werk: een reeks landschapsbeelden van de uiterwaarden in de vroege ochtend.",
    body:
      "Dit is eigen werk, gemaakt om te oefenen met licht en compositie in het open landschap.\n\nDe beelden zijn gemaakt in het half uur na zonsopkomst, als er nog mist boven het water hangt. Ik vloog laag en langzaam, zodat de lijnen van de sloten goed uitkomen.\n\nEen deel van deze reeks hangt als print in mijn werkruimte.",
    cover_url: "/images/project-natuur-1.jpg",
    cover_alt: "Voorbeeldbeeld: luchtfoto van uiterwaarden in de ochtendmist",
    video_url: "",
    featured: 1,
    sort_order: 6,
    images: [
      ["/images/project-natuur-2.jpg", "Voorbeeldbeeld: waterloop door het landschap"],
      ["/images/gallery-1.jpg", "Voorbeeldbeeld: velden vanuit de lucht"],
    ],
  },
];

const insertProject = db.prepare(
  `INSERT INTO projects
    (slug, title, category, location, summary, body, cover_url, cover_alt,
     video_url, published, featured, sort_order, created_utc)
   VALUES (@slug, @title, @category, @location, @summary, @body, @cover_url,
           @cover_alt, @video_url, 1, @featured, @sort_order, @created_utc)
   ON CONFLICT(slug) DO NOTHING`,
);
const insertImage = db.prepare(
  "INSERT INTO project_images (project_id, url, alt, sort_order) VALUES (?, ?, ?, ?)",
);

for (const project of PROJECTS) {
  const { images, ...row } = project;
  const result = insertProject.run({ ...row, created_utc: Date.now() });
  if (result.changes === 0) continue; // bestond al
  const id = Number(result.lastInsertRowid);
  images.forEach(([url, alt], index) => insertImage.run(id, url, alt, index));
}

console.log(
  `Klaar. ${SERVICES.length} diensten en ${PROJECTS.length} voorbeeldprojecten beschikbaar.`,
);
