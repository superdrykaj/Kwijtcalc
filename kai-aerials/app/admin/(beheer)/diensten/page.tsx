import { ServicesEditor } from "@/components/admin/services-editor";
import { PageHeading } from "@/components/admin/ui";
import { listServices } from "@/lib/services";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  return (
    <>
      <PageHeading
        title="Diensten"
        intro="Pas de naam, duur, buffertijd en prijsindicatie aan. Deze diensten kiest de bezoeker in de boekingsmodule."
      />
      <ServicesEditor services={listServices()} settings={getSettings()} />
    </>
  );
}
