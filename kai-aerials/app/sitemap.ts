import type { MetadataRoute } from "next";

import { site } from "@/content/site";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const projects = listProjects({ onlyPublished: true });

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/portfolio`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    ...projects.map((project) => ({
      url: `${base}/portfolio/${project.slug}`,
      lastModified: new Date(project.createdUtc),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
