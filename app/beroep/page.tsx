import type { Metadata } from "next";
import { AppealAssistant } from "@/components/beroep/appeal-assistant";

export const metadata: Metadata = {
  title: "Beroepsassistent — KwijtCalc",
  description:
    "Lees een beroeps-pdf lokaal in, bevestig de beroepspagina's en krijg mogelijke beroepsgronden voorgesteld.",
};

export default function BeroepPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Beroepsassistent
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Lees een beroepschrift in, controleer welke pagina&apos;s worden
          gebruikt en bekijk welke beroepsgronden in de tekst worden herkend. De
          pdf wordt volledig op dit apparaat verwerkt.
        </p>
      </header>
      <div className="mt-8">
        <AppealAssistant />
      </div>
    </div>
  );
}
