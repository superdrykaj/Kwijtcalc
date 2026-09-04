/**
 * Register van correctiecategorieën.
 *
 * Een nieuwe categorie toevoegen = één regel toevoegen aan CORRECTION_CATEGORIES.
 * Bestaande categorieën worden nooit verwijderd of van id gewisseld, zodat
 * eerdere berekeningen (en straks opgeslagen dossiers) leesbaar blijven.
 */

export interface CorrectionCategory {
  /** Stabiele technische sleutel. Nooit wijzigen. */
  readonly id: string;
  /** Label zoals de medewerker het ziet. */
  readonly label: string;
  /** Korte toelichting, getoond als hulptekst. */
  readonly description: string;
}

export const CORRECTION_CATEGORIES: readonly CorrectionCategory[] = [
  {
    id: "reiskostenvergoeding",
    label: "Reiskostenvergoeding",
    description: "Vergoeding voor woon-werkverkeer of zakelijke reizen.",
  },
  {
    id: "onkostenvergoeding",
    label: "Onkostenvergoeding",
    description: "Vergoeding van gemaakte kosten, zoals materiaal of telefoon.",
  },
  {
    id: "eenmalige_vergoeding",
    label: "Eenmalige vergoeding",
    description: "Een uitkering of vergoeding met een eenmalig karakter.",
  },
  {
    id: "overige_correctie",
    label: "Overige correctie",
    description: "Andere reden. Licht deze toe in de notitie.",
  },
] as const;

export function getCorrectionCategory(
  id: string | null | undefined,
): CorrectionCategory | undefined {
  if (!id) return undefined;
  return CORRECTION_CATEGORIES.find((category) => category.id === id);
}

export function correctionCategoryLabel(id: string | null | undefined): string {
  return getCorrectionCategory(id)?.label ?? "Overige correctie";
}
