# KwijtCalc

Rekenhulp voor medewerkers kwijtschelding, invordering en gemeentelijke
belastingen. KwijtCalc rekent aangeleverde inkomstenperioden om naar een
controleerbaar gemiddeld week-, 4-weken- en maandinkomen, inclusief correcties
die buiten beschouwing moeten blijven.

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
| `components/result-summary.tsx`         | Resultaatblok met "Bekijk berekening"                          |
| `components/print-report.tsx`           | Afdrukweergave voor in het dossier                             |
| `app/page.tsx`, `app/berekening/page.tsx` | Startpagina en calculator                                    |

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

## Architectuur

De rekenlogica staat volledig los van de interface:

```
lib/money.ts                 geldrepresentatie en afronding
lib/calculations/            pure functies: validatie, engine, registers
components/                  interface; bevat zelf geen financiële formules
app/                         routes
```

Interfacecomponenten roepen `validateDraft` en `calculateAverageIncome` aan en
tonen alleen wat daaruit komt. Nieuwe modules (partnerinkomen, vakantiegeld,
woonlasten, betalingscapaciteit) kunnen als extra bestanden onder
`lib/calculations/` worden toegevoegd zonder de bestaande engine te wijzigen.
De correctiecategorieën en periode-eenheden staan in registers: een categorie
toevoegen is één regel in `correction-categories.ts`.

## Tests

63 unittests, uit te voeren met `npm test`. Naast de rekenkundige testgevallen
uit de briefing (vier weken met één correctie, geen correcties, één periode,
bedragen met decimalen, correctie gelijk aan het ontvangen bedrag, correctie
hoger dan het ontvangen bedrag, lege regels, negatieve bedragen) zijn onder
meer gedekt: het lezen van Nederlandse notatie, afronding op halve centen, de
omrekening tussen week, 4-wekenperiode en maand, en het samenstellen van de
getoonde formules.

## Bekende beperkingen

- Eén inkomstenbron per berekening; partnerinkomen, uitkering naast loon,
  vakantiegeld en IKB zijn nog niet ondersteund.
- Export gaat via de afdrukweergave van de browser (ook "opslaan als pdf").
  Er is nog geen server-side PDF-export.
- Berekeningen kunnen niet worden opgeslagen of hervat.
- De interface is Nederlandstalig en niet meertalig opgezet.
