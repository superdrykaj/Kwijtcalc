import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectGallery } from "@/components/project-gallery";
import { categoryLabel, site } from "@/content/site";
import { getProjectBySlug, listProjectImages, listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !project.published) {
    return { title: "Project niet gevonden" };
  }
  return {
    title: project.title,
    description:
      project.summary ||
      `Voorbeeldproject van ${site.name} in ${project.location || site.region}.`,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.coverUrl ? [{ url: project.coverUrl }] : undefined,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !project.published) notFound();

  const images = listProjectImages(project.id);
  const others = listProjects({ onlyPublished: true })
    .filter((p) => p.id !== project.id)
    .slice(0, 3);

  const videoEmbed = toEmbedUrl(project.videoUrl);

  return (
    <article className="pb-8">
      <div className="relative isolate -mt-[4.5rem] flex min-h-[62svh] items-end overflow-hidden pt-[4.5rem]">
        {project.coverUrl && (
          <Image
            src={project.coverUrl}
            alt={project.coverAlt || `Voorbeeldbeeld van ${project.title}`}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/80 via-ink-950/50 to-ink-950"
        />
        <div className="container-page pb-14 pt-24">
          <nav aria-label="Kruimelpad" className="mb-6 text-sm text-mist-500">
            <Link href="/portfolio" className="hover:text-mist-100">
              Portfolio
            </Link>
            <span aria-hidden="true" className="mx-2 text-ink-600">
              /
            </span>
            <span className="text-mist-300">{categoryLabel(project.category)}</span>
          </nav>
          <h1 className="display-1 max-w-4xl text-balance">{project.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="chip">{categoryLabel(project.category)}</span>
            {project.location && <span className="chip">{project.location}</span>}
            <span className="chip border-azure-500/40 text-azure-300">
              Voorbeeldproject
            </span>
          </div>
        </div>
      </div>

      <div className="container-page">
        <div className="grid gap-14 py-16 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {project.summary && <p className="lede">{project.summary}</p>}
            {project.body && (
              <div className="prose-body mt-8">
                {project.body.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-ink-700 bg-ink-900 p-6">
            <h2 className="display-3 text-base">Ook zo&apos;n project laten maken?</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist-500">
              Vertel me over je locatie en je plannen. Ik denk graag mee.
            </p>
            <Link href="/#boeken" className="btn btn-primary mt-6 w-full">
              Ook zo&apos;n project laten maken?
            </Link>
            <Link href="/contact" className="btn btn-quiet mt-3 w-full">
              Eerst een vraag stellen
            </Link>
          </aside>
        </div>

        {/* Video ------------------------------------------------------------ */}
        <section aria-labelledby="video-titel" className="pb-4">
          <h2 id="video-titel" className="display-2 mb-6">
            Video
          </h2>
          {videoEmbed ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-ink-700 bg-ink-900">
              <iframe
                src={videoEmbed}
                title={`Video van ${project.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 px-6 text-center">
              <div>
                <p className="text-mist-300">Hier komt de video van dit project.</p>
                <p className="mt-2 text-sm text-mist-500">
                  Voeg in de beheeromgeving een YouTube- of Vimeo-link toe bij dit
                  project.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Galerij ---------------------------------------------------------- */}
        <section aria-labelledby="galerij-titel" className="py-16">
          <h2 id="galerij-titel" className="display-2 mb-6">
            Fotogalerij
          </h2>
          {images.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-600 px-6 py-16 text-center">
              <p className="text-mist-300">Nog geen foto&apos;s bij dit project.</p>
            </div>
          ) : (
            <ProjectGallery images={images} title={project.title} />
          )}
        </section>

        {/* Andere projecten ------------------------------------------------- */}
        {others.length > 0 && (
          <section aria-labelledby="meer-titel" className="border-t border-ink-700 py-16">
            <h2 id="meer-titel" className="display-2 mb-8">
              Meer werk
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/portfolio/${other.slug}`}
                    className="group flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-azure-500/60"
                  >
                    {other.coverUrl && (
                      <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={other.coverUrl}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </span>
                    )}
                    <span>
                      <span className="block text-sm font-semibold group-hover:text-azure-300">
                        {other.title}
                      </span>
                      <span className="mt-1 block text-xs text-mist-500">
                        {categoryLabel(other.category)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

/** Zet een YouTube- of Vimeo-link om naar een insluitbare URL. */
function toEmbedUrl(input: string): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) return url.toString();
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url.toString();
    return null;
  } catch {
    return null;
  }
}
