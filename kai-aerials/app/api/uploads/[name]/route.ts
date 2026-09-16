import fs from "node:fs/promises";
import path from "node:path";

import { UPLOAD_CONTENT_TYPES, resolveUploadPath } from "@/lib/uploads";

/**
 * Serveert geüploade afbeeldingen uit de datamap.
 * Alleen bestandsnamen zonder padtekens worden geaccepteerd.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const full = resolveUploadPath(name);
  if (!full) {
    return new Response("Niet gevonden", { status: 404 });
  }

  const contentType = UPLOAD_CONTENT_TYPES[path.extname(full).toLowerCase()];
  if (!contentType) {
    return new Response("Niet gevonden", { status: 404 });
  }

  try {
    const file = await fs.readFile(full);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Niet gevonden", { status: 404 });
  }
}
