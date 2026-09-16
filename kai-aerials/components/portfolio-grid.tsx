"use client";

import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { site } from "@/content/site";
import type { Project } from "@/lib/types";

const ALL = "alle";

export function PortfolioGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<string>(ALL);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of projects) {
      map.set(project.category, (map.get(project.category) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  const shown =
    filter === ALL ? projects : projects.filter((p) => p.category === filter);

  return (
    <div>
      <div
        role="group"
        aria-label="Filter projecten op categorie"
        className="flex flex-wrap gap-2"
      >
        <FilterButton
          active={filter === ALL}
          onClick={() => setFilter(ALL)}
          label="Alles"
          count={projects.length}
        />
        {site.categories.map((category) => (
          <FilterButton
            key={category.key}
            active={filter === category.key}
            onClick={() => setFilter(category.key)}
            label={category.label}
            count={counts.get(category.key) ?? 0}
          />
        ))}
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-mist-500">
        {shown.length === 0
          ? "Geen projecten in deze categorie."
          : `${shown.length} ${shown.length === 1 ? "project" : "projecten"}`}
      </p>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-600 px-6 py-16 text-center">
          <p className="text-mist-300">Nog niets in deze categorie.</p>
          <button
            type="button"
            className="btn btn-ghost mt-5"
            onClick={() => setFilter(ALL)}
          >
            Toon alle projecten
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project, index) => (
            <ProjectCard key={project.id} project={project} priority={index < 3} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={count === 0}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-azure-500 bg-azure-600/15 text-azure-300"
          : count === 0
            ? "cursor-not-allowed border-ink-800 text-mist-600"
            : "border-ink-600 text-mist-300 hover:border-azure-500/60 hover:text-mist-100"
      }`}
    >
      {label}
      <span className="ml-2 text-xs text-mist-600">{count}</span>
    </button>
  );
}
