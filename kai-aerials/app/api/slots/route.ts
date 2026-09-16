import { NextResponse } from "next/server";

import { slotsForRange } from "@/lib/availability";
import { getService } from "@/lib/services";
import { getSettings } from "@/lib/settings";
import { addDays, todayKey } from "@/lib/time";

/**
 * Vrije tijdsloten voor de boekingsmodule.
 * Geeft alleen beschikbaarheid terug, nooit gegevens van andere klanten.
 *
 *   /api/slots?serviceId=2&from=2026-09-16&days=14
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = Number(url.searchParams.get("serviceId"));
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 14, 1), 42);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "Onbekende dienst." }, { status: 400 });
  }

  const service = getService(serviceId);
  if (!service || !service.active || !service.bookable) {
    return NextResponse.json({ error: "Onbekende dienst." }, { status: 404 });
  }

  const today = todayKey();
  const requested = url.searchParams.get("from") ?? today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requested)) {
    return NextResponse.json({ error: "Ongeldige datum." }, { status: 400 });
  }
  // Nooit in het verleden kijken.
  const from = requested < today ? today : requested;

  const settings = getSettings();
  const days_ = slotsForRange(service, from, days);

  return NextResponse.json(
    {
      from,
      days: days_,
      lastBookableDate: addDays(today, settings.maxAdvanceDays),
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
