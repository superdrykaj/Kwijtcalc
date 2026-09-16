import "server-only";

import { getDb } from "./db";
import type { Project, ProjectImage } from "./types";

type Row = {
  id: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  summary: string;
  body: string;
  cover_url: string;
  cover_alt: string;
  video_url: string;
  published: number;
  featured: number;
  sort_order: number;
  created_utc: number;
};

function map(row: Row): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    location: row.location,
    summary: row.summary,
    body: row.body,
    coverUrl: row.cover_url,
    coverAlt: row.cover_alt,
    videoUrl: row.video_url,
    published: row.published === 1,
    featured: row.featured === 1,
    sortOrder: row.sort_order,
    createdUtc: row.created_utc,
  };
}

export function listProjects(
  options: { onlyPublished?: boolean; featuredFirst?: boolean; limit?: number } = {},
): Project[] {
  const where = options.onlyPublished ? "WHERE published = 1" : "";
  const order = options.featuredFirst
    ? "ORDER BY featured DESC, sort_order, id DESC"
    : "ORDER BY sort_order, id DESC";
  const limit = options.limit ? `LIMIT ${Number(options.limit)}` : "";
  const rows = getDb()
    .prepare(`SELECT * FROM projects ${where} ${order} ${limit}`)
    .all() as Row[];
  return rows.map(map);
}

export function getProject(id: number): Project | null {
  const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? map(row) : null;
}

export function getProjectBySlug(slug: string): Project | null {
  const row = getDb()
    .prepare("SELECT * FROM projects WHERE slug = ?")
    .get(slug) as Row | undefined;
  return row ? map(row) : null;
}

export type ProjectInput = Omit<Project, "id" | "createdUtc">;

export function createProject(values: ProjectInput): number {
  const result = getDb()
    .prepare(
      `INSERT INTO projects
        (slug, title, category, location, summary, body, cover_url, cover_alt,
         video_url, published, featured, sort_order, created_utc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      values.slug,
      values.title,
      values.category,
      values.location,
      values.summary,
      values.body,
      values.coverUrl,
      values.coverAlt,
      values.videoUrl,
      values.published ? 1 : 0,
      values.featured ? 1 : 0,
      values.sortOrder,
      Date.now(),
    );
  return Number(result.lastInsertRowid);
}

export function updateProject(id: number, values: ProjectInput): void {
  getDb()
    .prepare(
      `UPDATE projects SET slug = ?, title = ?, category = ?, location = ?,
        summary = ?, body = ?, cover_url = ?, cover_alt = ?, video_url = ?,
        published = ?, featured = ?, sort_order = ? WHERE id = ?`,
    )
    .run(
      values.slug,
      values.title,
      values.category,
      values.location,
      values.summary,
      values.body,
      values.coverUrl,
      values.coverAlt,
      values.videoUrl,
      values.published ? 1 : 0,
      values.featured ? 1 : 0,
      values.sortOrder,
      id,
    );
}

export function deleteProject(id: number): void {
  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function listProjectImages(projectId: number): ProjectImage[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order, id",
    )
    .all(projectId) as {
    id: number;
    project_id: number;
    url: string;
    alt: string;
    sort_order: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    url: r.url,
    alt: r.alt,
    sortOrder: r.sort_order,
  }));
}

export function addProjectImage(
  projectId: number,
  url: string,
  alt: string,
  sortOrder = 0,
): void {
  getDb()
    .prepare(
      "INSERT INTO project_images (project_id, url, alt, sort_order) VALUES (?, ?, ?, ?)",
    )
    .run(projectId, url, alt, sortOrder);
}

export function updateProjectImage(id: number, alt: string, sortOrder: number): void {
  getDb()
    .prepare("UPDATE project_images SET alt = ?, sort_order = ? WHERE id = ?")
    .run(alt, sortOrder, id);
}

export function deleteProjectImage(id: number): void {
  getDb().prepare("DELETE FROM project_images WHERE id = ?").run(id);
}

/** Maakt een URL-veilige slug van een titel. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Zorgt voor een unieke slug binnen de projecten. */
export function uniqueSlug(base: string, ignoreId?: number): string {
  const root = slugify(base) || "project";
  let candidate = root;
  let n = 2;
  for (;;) {
    const row = getDb()
      .prepare("SELECT id FROM projects WHERE slug = ?")
      .get(candidate) as { id: number } | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${root}-${n++}`;
  }
}
