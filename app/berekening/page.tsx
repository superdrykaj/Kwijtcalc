import type { Metadata } from "next";
import { CalculationWorkspace } from "@/components/calculation-workspace";

export const metadata: Metadata = {
  title: "Nieuwe inkomensberekening — KwijtCalc",
  description:
    "Voer inkomstenperioden in, pas correcties toe en bereken een controleerbaar gemiddeld week-, 4-weken- en maandinkomen.",
};

export default function BerekeningPage() {
  return <CalculationWorkspace />;
}
