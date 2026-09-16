import { AvailabilityEditor } from "@/components/admin/availability-editor";
import { PageHeading } from "@/components/admin/ui";
import {
  conflictingBookings,
  listOverrides,
  listWeeklyWindows,
} from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { todayKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function AvailabilityPage() {
  return (
    <>
      <PageHeading
        title="Beschikbaarheid"
        intro="Stel je standaardweek in, voeg uitzonderingen toe en blokkeer dagen. Wijzigingen zijn direct zichtbaar in de boekingsmodule."
      />
      <AvailabilityEditor
        weekly={listWeeklyWindows()}
        overrides={listOverrides(todayKey())}
        conflicts={conflictingBookings()}
        settings={getSettings()}
      />
    </>
  );
}
