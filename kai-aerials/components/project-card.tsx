import Image from "next/image";
import Link from "next/link";

import { categoryLabel } from "@/content/site";
import type { Project } from "@/lib/types";

export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-850">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={project.coverAlt || `Voorbeeldbeeld van ${project.title}`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-mist-600">
            Nog geen afbeelding
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
        <span className="chip absolute left-4 top-4 bg-ink-950/70 backdrop-blur">
          {categoryLabel(project.category)}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          <Link href={`/portfolio/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        {project.location && (
          <p className="mt-1 text-sm text-mist-500">{project.location}</p>
        )}
        {project.summary && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mist-500">
            {project.summary}
          </p>
        )}
        <p className="mt-4 text-sm font-semibold text-azure-300">
          Bekijk project
          <span aria-hidden="true" className="ml-1 inline-block transition-transform group-hover:translate-x-1">
            →
          </span>
        </p>
      </div>
    </article>
  );
}
