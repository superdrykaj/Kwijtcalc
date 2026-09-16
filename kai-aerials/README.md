# Kai Aerials — website met online boekingsmodule

Een complete website voor een zelfstandige dronepiloot: portfolio, contactpagina
en een boekingsmodule op de homepage, met een beveiligde beheeromgeving op
`/admin`.

> **Alle bedrijfsgegevens, projecten en prijzen in dit project zijn fictief.**
> Ze staan er als voorbeeld en zijn bedoeld om vervangen te worden.

## Inhoud

1. [Starten en publiceren](#1-starten-en-publiceren)
2. [Toegang tot de beheeromgeving](#2-toegang-tot-de-beheeromgeving)
3. [Beschikbaarheid aanpassen](#3-beschikbaarheid-aanpassen)
4. [Fictieve inhoud vervangen](#4-fictieve-inhoud-vervangen)
5. [Koppelingen die je nog moet instellen](#5-koppelingen-die-je-nog-moet-instellen)
6. [Technische opzet](#technische-opzet)

---

## 1. Starten en publiceren

### Lokaal starten

```bash
cd kai-aerials
npm install

# Wachtwoord voor de beheeromgeving aanmaken
npm run hash-password -- 'kies-hier-een-lang-wachtwoord'
# Zet de twee regels uit de uitvoer in .env.local (zie .env.example)

npm run seed      # vult de database met de fictieve voorbeeldgegevens
npm run dev       # http://localhost:3000
```

| Commando                  | Doel                                                  |
| ------------------------- | ----------------------------------------------------- |
| `npm run dev`             | Ontwikkelserver                                       |
| `npm run build`           | Productiebuild                                        |
| `npm start`               | Productieserver (na `build`)                          |
| `npm test`                | Unittests (tijdzone, tijdvakken, wachtwoorden)        |
| `npm run typecheck`       | TypeScript-controle                                   |
| `npm run lint`            | ESLint                                                |
| `npm run seed`            | Voorbeeldgegevens toevoegen                           |
| `npm run seed -- --reset` | Alles wissen en opnieuw vullen                        |
| `npm run hash-password`   | Wachtwoord-hash en sessiesleutel maken                |
| `npm run placeholders`    | De tijdelijke voorbeeldafbeeldingen opnieuw genereren |

### Publiceren

De site gebruikt een SQLite-database en slaat geüploade foto's op de schijf op.
Kies daarom een hosting waar **bestanden blijven bestaan**: een VPS, een
Docker-host of een platform met een persistente schijf. Een omgeving die bij elke
nieuwe versie de schijf leeggooit (zoals de standaard serverless hosting van
Vercel) werkt niet zonder aanpassing.

Op een eigen server:

```bash
npm ci
npm run build
NODE_ENV=production npm start        # standaard poort 3000
```

Zet daarbij:

- Een reverse proxy (nginx, Caddy) met HTTPS ervoor. Het inlogcookie wordt in
  productie alleen over HTTPS verstuurd.
- `DATA_DIR` naar een map die bewaard blijft, bijvoorbeeld
  `/var/lib/kai-aerials`. Daar komen de database en de uploads te staan.
- Een back-up van die map. Daar staan al je boekingen, projecten en berichten in.

---

## 2. Toegang tot de beheeromgeving

De beheeromgeving zit op `/admin` en is alleen toegankelijk na inloggen.

1. Maak een wachtwoord aan:

   ```bash
   npm run hash-password -- 'jouw-lange-wachtwoord'
   ```

2. Zet de twee regels uit de uitvoer in `.env.local`:

   ```
   ADMIN_PASSWORD_HASH="scrypt:…"
   AUTH_SECRET="…"
   ```

3. Start de server opnieuw en ga naar `/admin`.

Hoe het werkt:

- Alleen de **hash** van je wachtwoord staat in het bestand, nooit het wachtwoord
  zelf. De hash is gemaakt met scrypt.
- `AUTH_SECRET` ondertekent het inlogcookie. Verander je deze waarde, dan zijn
  alle sessies meteen ongeldig.
- Je blijft twaalf uur ingelogd. Het cookie is `httpOnly`, dus JavaScript in de
  browser kan er niet bij.
- Na acht mislukte pogingen binnen tien minuten wordt inloggen tijdelijk
  geblokkeerd.
- Elke beheerpagina én elke bewerking controleert op de server opnieuw of je
  bent ingelogd.

Zet `.env.local` **nooit** in je repository. Het bestand staat al in
`.gitignore`.

---

## 3. Beschikbaarheid aanpassen

Alles staat onder **Beheer → Beschikbaarheid**. Wijzigingen zijn direct zichtbaar
in de boekingsmodule op de homepage.

**Standaardweek.** Per weekdag maximaal vier periodes, bijvoorbeeld 09:00–12:30
en 13:30–17:30. Een dag zonder periodes is niet boekbaar.

**Uitzonderingen op losse datums.**

- *Blokkeren* haalt tijd weg: een hele dag (vakantie) of een dagdeel (andere
  afspraak).
- *Extra beschikbaarheid* voegt tijd toe buiten je standaardweek.

**Boekingsregels** staan onder **Beheer → Instellingen**:

| Instelling             | Betekenis                                              |
| ---------------------- | ------------------------------------------------------ |
| Tijdsloten om de …     | Raster waarop afspraken beginnen (bijvoorbeeld elke 30 minuten) |
| Standaard buffertijd   | Rust tussen twee afspraken; per dienst te overschrijven |
| Minimaal … uur vooraf  | Hoe kort van tevoren iemand nog mag boeken             |
| Maximaal … dagen vooruit | Hoe ver vooruit de agenda openstaat                  |

**Duur per dienst** stel je in onder **Beheer → Diensten**.

Goed om te weten:

- Bestaande boekingen verdwijnen nooit als je je beschikbaarheid aanpast. Vallen
  ze erbuiten, dan krijg je een waarschuwing op het overzicht en bij de
  boekingen, zodat je ze zelf kunt verplaatsen of annuleren.
- Alle tijden gelden in **Europe/Amsterdam**. Zomer- en wintertijd worden
  automatisch verwerkt. Het uur dat in het voorjaar wordt overgeslagen, wordt
  nooit aangeboden.
- Een openstaande aanvraag houdt het tijdslot bezet. Wijs je hem af of annuleer
  je hem, dan komt het slot meteen weer vrij.

---

## 4. Fictieve inhoud vervangen

### Teksten en bedrijfsgegevens

Alles staat in één bestand: **`content/site.ts`**. Daarin vind je de bedrijfsnaam,
het e-mailadres, het werkgebied, de hero-titel, het dienstenoverzicht, de
werkwijze en de categorieën van het portfolio. Pas het bestand aan en de
wijziging is overal op de site zichtbaar.

### Afbeeldingen

De tijdelijke beelden staan in **`public/images/`**:

| Bestand                   | Waar het staat                    |
| ------------------------- | --------------------------------- |
| `hero.jpg`                | Grote afbeelding op de homepage   |
| `about.jpg`               | Over-mij-blok op de homepage      |
| `og.jpg`                  | Deelbeeld voor sociale media (1200 × 630) |
| `project-*.jpg`           | Hoofdafbeeldingen van de voorbeeldprojecten |
| `gallery-*.jpg`           | Foto's in de projectgalerijen     |

Vervang de bestanden en houd dezelfde namen aan, dan hoef je verder niets te
wijzigen. Gebruik liefst JPG of WebP van ongeveer 1600 × 1000 pixels of groter.
Foto's worden automatisch geoptimaliseerd en in moderne formaten geserveerd.

### Projecten

Ga naar **Beheer → Projecten**. Daar kun je projecten toevoegen, bewerken,
publiceren en verwijderen, foto's uploaden met een alternatieve tekst, en een
YouTube- of Vimeo-link invoeren. Geüploade foto's komen in `DATA_DIR/uploads` te
staan en worden geserveerd via `/api/uploads/…`.

Zet **Gepubliceerd** uit om een project van de site te halen zonder het te
verwijderen. **Uitgelicht** bepaalt welke drie projecten op de homepage komen.

### Diensten en prijzen

**Beheer → Diensten**: naam, omschrijving, duur, buffertijd, prijsindicatie en
volgorde. De prijsindicatie is vrije tekst, dus "Gratis", "Indicatie vanaf € 149"
of "Prijs in overleg" kan allemaal.

### Privacyverklaring

`app/(site)/privacy/page.tsx` bevat een **concept**. De plekken die je nog moet
invullen zijn geel gemarkeerd, zoals je vestigingsplaats, KvK-nummer,
bewaartermijn en hostingpartij. Laat de tekst controleren voordat je publiceert.

### Alle voorbeeldgegevens wissen

```bash
npm run seed -- --reset   # verwijdert álles en zet alleen de voorbeelden terug
```

---

## 5. Koppelingen die je nog moet instellen

### E-mail (nodig voor bevestigingsmails)

Zolang de SMTP-gegevens ontbreken, wordt er **geen e-mail verstuurd**. De site
doet daar niet geheimzinnig over: bezoekers zien na het aanvragen dat er geen
bevestigingsmail is verstuurd, en in de beheeromgeving staat een waarschuwing.
Aanvragen en berichten worden wél gewoon opgeslagen.

Zet in `.env.local`:

```
SMTP_HOST="smtp.jouwprovider.nl"
SMTP_PORT="587"
SMTP_USER="jouw-gebruikersnaam"
SMTP_PASSWORD="jouw-wachtwoord"
MAIL_FROM="Kai Aerials <no-reply@jouwdomein.nl>"
MAIL_TO="hallo@jouwdomein.nl"
```

Daarna worden verstuurd:

- een bevestiging van de aanvraag naar de klant, met het kenmerk;
- een melding van de nieuwe aanvraag naar jou;
- een bericht bij bevestigen, afwijzen of annuleren;
- een ontvangstbevestiging van het contactformulier naar de afzender, plus het
  bericht naar jou.

Op het beheeroverzicht zie je van de laatste vijf e-mails of ze zijn verzonden,
overgeslagen of mislukt.

### Publieke adres van de site

```
NEXT_PUBLIC_SITE_URL="https://jouwdomein.nl"
```

Dit adres wordt gebruikt voor de paginatitels, het deelbeeld op sociale media,
`robots.txt` en `sitemap.xml`.

### Opslaglocatie (aanbevolen in productie)

```
DATA_DIR="/var/lib/kai-aerials"
```

### Wat er níét nodig is

Er zit geen betaalsysteem in en dat is ook niet nodig: klanten vragen een
afspraak aan, jij bevestigt. Er zijn geen accounts voor bezoekers en er worden
geen trackingcookies geplaatst.

---

## Technische opzet

- **Next.js 16** (App Router, React Server Components, Turbopack) met
  **TypeScript** en **Tailwind CSS v4**.
- **SQLite** via `better-sqlite3`, met WAL en een schema dat bij het opstarten
  wordt aangemaakt of bijgewerkt.
- **Server actions** voor alle bewerkingen, met validatie via **Zod** op de
  server. Formulieren werken ook zonder JavaScript waar dat kan.
- **Eigen sessiebeheer**: scrypt-hash voor het wachtwoord, een HMAC-ondertekend
  `httpOnly`-cookie voor de sessie. Geen sleutels in de frontend.
- **Nodemailer** voor e-mail, alleen actief als de SMTP-gegevens zijn ingevuld.

### Hoe dubbele boekingen worden voorkomen

Een aanvraag wordt aangemaakt binnen één exclusieve transactie
(`BEGIN IMMEDIATE`). Binnen diezelfde transactie wordt de beschikbaarheid nog
één keer volledig opnieuw gecontroleerd: openingstijden, uitzonderingen,
buffertijd en bestaande boekingen. Twee bezoekers die op hetzelfde moment
hetzelfde tijdslot aanvragen, kunnen dus niet allebei slagen — de tweede krijgt
netjes te zien dat het slot net bezet is geraakt.

Te controleren met:

```bash
npx tsx scripts/test-concurrency.ts <startUtc> A &
npx tsx scripts/test-concurrency.ts <startUtc> B &
wait
```

### Privacy en beveiliging

- Gegevens van klanten zijn alleen zichtbaar na inloggen. De publieke API
  (`/api/slots`) geeft uitsluitend vrije tijdstippen terug, nooit namen of
  omschrijvingen.
- Elke server action controleert zelf of je bent ingelogd; een pagina-check
  alleen is niet genoeg.
- Formulieren hebben een spamval (een verborgen veld dat leeg moet blijven) en
  een snelheidsbegrenzing per IP-adres. Het IP-adres wordt alleen kortdurend in
  het werkgeheugen gebruikt en niet opgeslagen.
- Uploads accepteren alleen JPG, PNG, WebP en AVIF tot 12 MB en krijgen een
  nieuwe, willekeurige bestandsnaam.
- `/admin` en `/api` staan in `robots.txt` uitgesloten van indexering.

### Toegankelijkheid

Alle velden hebben een zichtbaar label, foutmeldingen zijn aan hun veld
gekoppeld via `aria-describedby`, en de hele site is met het toetsenbord te
bedienen met een duidelijke focusrand. Er is een "naar de hoofdinhoud"-link, en
animaties worden uitgezet als het systeem om minder beweging vraagt.

### Mappen

```
app/
  (site)/        publieke pagina's: home, portfolio, contact, privacy
  admin/         inlogpagina en beveiligde beheeromgeving
  actions/       server actions (publiek en beheer)
  api/           tijdsloten en het serveren van uploads
components/      onderdelen van de interface
content/site.ts  ← alle teksten en bedrijfsgegevens
lib/             database, beschikbaarheid, boekingen, tijdzone, validatie
scripts/         seed, wachtwoord-hash, voorbeeldafbeeldingen
public/images/   tijdelijke voorbeeldafbeeldingen
data/            database en uploads (niet in de repository)
```
