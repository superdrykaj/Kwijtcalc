import Image from "next/image";
import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/admin/ui";
import { categoryLabel } from "@/content/site";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = listProjects();

  return (
    <>
      <PageHeading
        title="Projecten"
        intro="Voeg projecten toe, bewerk ze en bepaal wat er op de website staat."
        action={
          <Link href="/admin/projecten/nieuw" className="btn btn-primary">
            Nieuw project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Nog geen projecten"
          body="Voeg je eerste project toe zodat bezoekers je werk kunnen zien."
          href="/admin/projecten/nieuw"
          linkLabel="Project toevoegen"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="card overflow-hidden">
              <Link href={`/admin/projecten/${project.id}`} className="block">
                <div className="relative aspect-[4/3] bg-ink-800">
                  {project.coverUrl ? (
                    <Image
                      src={project.coverUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-mist-600">
                      Geen omslagbeeld
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="chip">{categoryLabel(project.category)}</span>
                    {project.published ? (
                      <span className="chip border-emerald-500/40 text-emerald-300">
                        Gepubliceerd
                      </span>
                    ) : (
                      <span className="chip border-amber-500/40 text-amber-300">
                        Concept
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-semibold">{project.title}</h2>
                  {project.location && (
                    <p className="mt-1 text-sm text-mist-500">{project.location}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
