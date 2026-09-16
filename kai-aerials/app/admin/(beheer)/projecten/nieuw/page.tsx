import Link from "next/link";

import { ProjectForm } from "@/components/admin/project-form";
import { PageHeading, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <>
      <PageHeading
        title="Nieuw project"
        intro="Vul de basisgegevens in. Na het opslaan kun je foto's toevoegen."
        action={
          <Link href="/admin/projecten" className="btn btn-quiet">
            Terug
          </Link>
        }
      />
      <Panel>
        <ProjectForm />
      </Panel>
    </>
  );
}
