import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProjectAction } from "@/app/actions/admin";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectImagesEditor } from "@/components/admin/project-images-editor";
import { PageHeading, Panel } from "@/components/admin/ui";
import { getProject, listProjectImages } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(Number(id));
  if (!project) notFound();

  const images = listProjectImages(project.id);

  return (
    <>
      <PageHeading
        title={project.title}
        intro="Bewerk dit project, beheer de fotogalerij en bepaal of het gepubliceerd is."
        action={
          <div className="flex gap-2">
            {project.published && (
              <Link
                href={`/portfolio/${project.slug}`}
                target="_blank"
                className="btn btn-quiet"
              >
                Bekijk op de site ↗
              </Link>
            )}
            <Link href="/admin/projecten" className="btn btn-quiet">
              Terug
            </Link>
          </div>
        }
      />

      <div className="space-y-8">
        <Panel title="Projectgegevens">
          <ProjectForm project={project} />
        </Panel>

        <Panel
          title="Fotogalerij"
          description="Upload foto's of verwijs naar een bestand in public/images. Geef elke foto een alternatieve tekst voor schermlezers."
        >
          <ProjectImagesEditor projectId={project.id} images={images} />
        </Panel>

        <Panel title="Project verwijderen">
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn btn-danger">
              Dit project definitief verwijderen
            </button>
            <p className="field-hint">
              Dit kan niet ongedaan worden gemaakt. Wil je het project alleen van
              de site halen, zet dan &quot;Gepubliceerd&quot; uit.
            </p>
          </form>
        </Panel>
      </div>
    </>
  );
}
