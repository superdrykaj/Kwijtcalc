# KwijtCalc

Hulpmiddel voor medewerkers kwijtschelding, invordering en gemeentelijke
belastingen. KwijtCalc bestaat uit twee onderdelen:

- **Inkomensberekening** — aangeleverde inkomstenperioden omrekenen naar een
  controleerbaar gemiddeld week-, 4-weken- en maandinkomen, inclusief correcties
  die buiten beschouwing moeten blijven.
- **Beroepsassistent** — een beroepschrift lokaal inlezen uit een pdf, de
  beroepspagina's bevestigen en zien welke beroepsgronden in de tekst worden
  herkend.

KwijtCalc ondersteunt bij het uitvoeren van berekeningen. De behandelend
medewerker blijft verantwoordelijk voor de beoordeling en toepassing van de
geldende wet- en regelgeving.

## Aan de slag

```bash
npm install
npm run dev        # http://localhost:3000
```

| Commando            | Doel                                        |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Ontwikkelserver                             |
| `npm run build`     | Productiebuild (Vercel-compatibel)          |
| `npm test`          | Unittests van de rekenengine en validatie   |
| `npm run typecheck` | TypeScript-controle                         |
| `npm run lint`      | ESLint                                      |

## Belangrijkste bestanden

| Bestand                                | Inhoud                                                        |
| -------------------------------------- | ------------------------------------------------------------- |
| `lib/money.ts`                          | Centen, Nederlandse invoer lezen, afronden, formatteren        |
| `lib/calculations/average-income.ts`    | De rekenengine: totalen, gemiddelden, omrekening, formules     |
| `lib/calculations/schema.ts`            | Validatie van het formulier en omzetting naar centen           |
| `lib/calculations/correction-categories.ts` | Register van correctiecategorieën                          |
| `lib/calculations/period-units.ts`      | Week, 4-wekenperiode en maand met hun omrekenfactoren          |
| `components/calculation-workspace.tsx`  | Het invoerscherm; koppelt interface aan de engine              |
| `lib/pdf/extract-text.ts`               | Losse pdf-fragmenten omzetten naar leesbare regels             |
| `lib/pdf/page-candidates.ts`            | Voorselectie van de vermoedelijke beroepspagina's              |
| `lib/pdf/compose-text.ts`               | Geselecteerde pagina's samenvoegen met paginamarkeringen       |
| `lib/pdf/errors.ts`                     | Foutmeldingen en bestandsgrenzen                               |
| `lib/pdf/pdfjs-client.ts`               | De enige plek die de pdf-bibliotheek aanroept (alleen browser) |
| `lib/beroep/grounds.ts`                 | Register van mogelijke beroepsgronden                          |
| `lib/beroep/suggest.ts`                 | Herkenning van gronden, met verwijzing naar de bronpagina      |
| `components/beroep/pdf-scanner.tsx`     | Pdf kiezen, pagina's tonen en bevestigen                       |
| `components/beroep/appeal-assistant.tsx`| Bewerkbare tekst en voorgestelde gronden                       |
| `components/result-summary.tsx`         | Resultaatblok met "Bekijk berekening"                          |
| `components/print-report.tsx`           | Afdrukweergave voor in het dossier                             |
| `app/page.tsx`, `app/berekening/page.tsx`, `app/beroep/page.tsx` | Startpagina, calculator en assistent         |

## Genomen beslissingen

1. **Bedragen in hele centen.** Alle bedragen zijn gehele getallen in
   eurocenten. Optellen en aftrekken zijn daarmee exact; er treden geen
   floating-point afwijkingen op.
2. **Eén keer afronden.** Afgeleide bedragen worden uit het exacte gemiddelde
   (totaal gedeeld door aantal perioden, als breuk) berekend en pas aan het eind
   afgerond op hele centen, halve centen naar boven. Zo ontstaat geen
   dubbele afronding.
3. **Periode-eenheid instelbaar.** De briefing gaat uit van weken. Omdat loon
   ook per 4-wekenperiode of per maand wordt aangeleverd, kiest de gebruiker de
   eenheid; week-, 4-weken- en maandbedrag worden altijd alle drie getoond.
   Gerekend wordt met 52 weken, 13 vierwekenperioden en 12 maanden per jaar.
4. **Negatieve bedragen worden geweigerd.** Een negatief nettoloon is geen
   inkomen maar een terugvordering of verrekening. Die hoort als correctie of
   als aparte regel te worden verwerkt, niet als min-inkomen, anders wordt het
   gemiddelde stilzwijgend vertekend.
5. **Correctie nooit hoger dan het ontvangen bedrag.** Anders zou het
   meetellend inkomen van een periode negatief worden. Gelijk aan het ontvangen
   bedrag mag wel; dat levert € 0,00 meetellend inkomen op.
6. **Reden verplicht bij een correctie.** Zonder categorie is de berekening niet
   uit te leggen in een dossier. De vrije notitie blijft optioneel.
7. **Lege regels tellen niet mee.** Een regel is leeg zolang zowel het
   ontvangen bedrag als de correctie leeg is. Een uitdrukkelijk ingevulde 0
   telt wél mee: een week zonder inkomen is iets anders dan een week die nog
   niet is ingevuld.
8. **Berekening loopt live mee.** Het resultaat werkt bij tijdens het typen.
   Foutmeldingen verschijnen pas nadat een veld is verlaten of nadat op
   "Bekijk resultaat" is geklikt, zodat de gebruiker niet tijdens het typen
   wordt gecorrigeerd.
9. **Niets opslaan.** Er is geen database, geen account en geen opslag in de
   browser. Gegevens verdwijnen bij het sluiten van het tabblad. Het enige
   identificerende veld is een optioneel dossierkenmerk.
10. **Geen componentbibliotheek, geen webfont.** De interface gebruikt Tailwind
    met eigen, toegankelijke elementen en het systeemlettertype. Dat scheelt
    afhankelijkheden en een externe verbinding bij het laden.

## Beslissingen bij de pdf-scanner

11. **De pdf verlaat het apparaat niet.** Het bestand wordt als bytes aan de
    pdf-bibliotheek gegeven en blijft in het geheugen van het tabblad. Er is
    geen upload, geen API-route, geen server, geen opslag en geen analytics.
12. **Bibliotheek en worker lokaal meegeleverd.** `pdfjs-dist` wordt met de
    applicatie meegebundeld; de worker wordt via `new URL(...)` opgenomen in de
    build en vanaf de eigen server geladen. Geen CDN en geen download tijdens
    gebruik.
13. **De legacy-build van pdfjs.** De gewone build gebruikt zeer recente
    JavaScript-methoden die op werkplekken met een oudere browser ontbreken;
    daar mislukte het renderen van miniaturen. De legacy-build werkt breder.
14. **Miniaturen op lage resolutie en pas bij tonen.** Een miniatuur wordt
    gerenderd zodra de pagina in beeld komt, één opdracht tegelijk. Een dossier
    van honderd pagina's blijft daardoor werkbaar.
15. **Voorselectie is een voorstel, geen regel.** De scanner wijst één tot drie
    pagina's aan op grond van doorlopende brieftekst, woorden rond beroep,
    besluit, kwijtschelding en motivering, en een aansluitende vervolgpagina.
    De eerste pagina telt mee als aanwijzing, niet als doorslaggevend. Elke
    pagina blijft handmatig aan en uit te zetten.
16. **Paginamarkeringen in de tekst zelf.** De overgenomen tekst bevat regels
    als `[Pagina 3]`. Daardoor blijft een passage naar de bronpagina te
    herleiden, ook nadat de medewerker de tekst heeft bewerkt; losse posities
    zouden na de eerste wijziging niet meer kloppen.
17. **Nog geen OCR.** Een pagina zonder bruikbare tekstlaag krijgt de melding
    "Scan — OCR nodig" en wordt niet overgenomen. De medewerker kiest een andere
    pagina of plakt de tekst zelf. De opzet laat toe hier later lokale
    tekstherkenning voor Nederlands en Engels aan toe te voegen.
18. **De assistent beoordeelt niets.** Gronden worden voorgesteld op grond van
    signaalwoorden per zin, met de passage en de bronpagina erbij. Er wordt geen
    juridische conclusie getrokken; de medewerker bepaalt wat van toepassing is.

## Architectuur

De rekenlogica staat volledig los van de interface:

```
lib/money.ts                 geldrepresentatie en afronding
lib/calculations/            pure functies: validatie, engine, registers
lib/pdf/                     pure functies voor pdf-tekst, plus één browsermodule
lib/beroep/                  pure functies: register van gronden en herkenning
components/                  interface; bevat zelf geen formules of beslisregels
app/                         routes
```

Interfacecomponenten roepen `validateDraft` en `calculateAverageIncome` aan en
tonen alleen wat daaruit komt. Nieuwe modules (partnerinkomen, vakantiegeld,
woonlasten, betalingscapaciteit) kunnen als extra bestanden onder
`lib/calculations/` worden toegevoegd zonder de bestaande engine te wijzigen.
De correctiecategorieën en periode-eenheden staan in registers: een categorie
toevoegen is één regel in `correction-categories.ts`.

## Tests

131 unittests, uit te voeren met `npm test`. Naast de rekenkundige testgevallen
uit de briefing (vier weken met één correctie, geen correcties, één periode,
bedragen met decimalen, correctie gelijk aan het ontvangen bedrag, correctie
hoger dan het ontvangen bedrag, lege regels, negatieve bedragen) zijn onder
meer gedekt: het lezen van Nederlandse notatie, afronding op halve centen, de
omrekening tussen week, 4-wekenperiode en maand, en het samenstellen van de
getoonde formules.

Voor de Beroepsassistent zijn gedekt: het samenvoegen van pdf-fragmenten tot
leesbare regels, het herkennen van een ontbrekende tekstlaag, de voorselectie
van beroepspagina's (inclusief vervolgpagina, bijlagen en documenten zonder
tekst), het samenstellen van de tekst, het behoud van paginanummers na bewerken,
de foutmeldingen en de herkenning van gronden met hun bronpagina.

De volledige flow is daarnaast in de browser gecontroleerd met een fictief
beroepschrift van vijf pagina's (waaronder één scan zonder tekstlaag) en met een
dossier van honderd pagina's. Daarbij is met een netwerkcontrole vastgesteld dat
er geen enkel extern verzoek en geen enkele verzending plaatsvindt.

## Bekende beperkingen

- Eén inkomstenbron per berekening; partnerinkomen, uitkering naast loon,
  vakantiegeld en IKB zijn nog niet ondersteund.
- Geen OCR: gescande pagina's kunnen niet worden uitgelezen.
- De voorselectie van beroepspagina's en de herkenning van gronden werken met
  signaalwoorden. Ze zijn een hulpmiddel en geen inhoudelijke beoordeling; een
  ongebruikelijk opgestelde brief kan worden gemist.
- Een pdf met wachtwoordbeveiliging is alleen met een unittest gecontroleerd,
  niet met een echt beveiligd bestand.
- Documenten worden tot 30 MB en 150 pagina's geaccepteerd; daarboven volgt een
  melding.
- Export gaat via de afdrukweergave van de browser (ook "opslaan als pdf").
  Er is nog geen server-side PDF-export.
- Berekeningen kunnen niet worden opgeslagen of hervat.
- De interface is Nederlandstalig en niet meertalig opgezet.
