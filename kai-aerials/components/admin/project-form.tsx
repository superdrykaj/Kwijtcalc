"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import {
  saveProjectAction,
} from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";
import { site } from "@/content/site";
import type { Project } from "@/lib/types";

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveProjectAction,
    emptyActionState,
  );
  const [coverUrl, setCoverUrl] = useState(project?.coverUrl ?? "");

  return (
    <form action={action} className="space-y-6">
      {state.status !== "idle" && (
        <p
          className={`notice ${state.status === "error" ? "notice-error" : "notice-success"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      {project && <input type="hidden" name="id" value={project.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Text
          id="title"
          name="title"
          label="Titel"
          required
          defaultValue={project?.title ?? ""}
          error={state.errors?.title}
        />
        <div>
          <label htmlFor="category" className="field-label">
            Categorie
          </label>
          <select
            id="category"
            name="category"
            defaultValue={project?.category ?? site.categories[0].key}
            className="field-input"
          >
            {site.categories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <Text
          id="location"
          name="location"
          label="Locatie"
          defaultValue={project?.location ?? ""}
          hint="Bijvoorbeeld: Nieuwegein"
        />
        <Text
          id="sortOrder"
          name="sortOrder"
          label="Volgorde"
          type="number"
          defaultValue={String(project?.sortOrder ?? 0)}
          hint="Lager getal staat bovenaan."
        />
      </div>

      <div>
        <label htmlFor="summary" className="field-label">
          Korte beschrijving
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          defaultValue={project?.summary ?? ""}
          className="field-input"
          aria-describedby="summary-hint"
        />
        <p id="summary-hint" className="field-hint">
          Eén of twee zinnen. Staat op de projectkaart en in zoekresultaten.
        </p>
      </div>

      <div>
        <label htmlFor="body" className="field-label">
          Uitgebreide tekst
        </label>
        <textarea
          id="body"
          name="body"
          rows={7}
          defaultValue={project?.body ?? ""}
          className="field-input"
          aria-describedby="body-hint"
        />
        <p id="body-hint" className="field-hint">
          Beschrijf de opdracht en het resultaat. Een lege regel begint een nieuwe
          alinea.
        </p>
      </div>

      {/* Omslagbeeld ------------------------------------------------------- */}
      <fieldset className="rounded-xl border border-ink-700 p-5">
        <legend className="px-2 text-sm font-semibold">Hoofdafbeelding</legend>

        {coverUrl && (
          <div className="relative mb-4 aspect-[16/9] w-full max-w-md overflow-hidden rounded-lg border border-ink-700">
            <Image src={coverUrl} alt="" fill sizes="400px" className="object-cover" />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="coverFile" className="field-label">
              Nieuwe afbeelding uploaden
            </label>
            <input
              id="coverFile"
              name="coverFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="field-input file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-sm file:text-mist-100"
              aria-describedby="coverFile-hint"
            />
            <p id="coverFile-hint" className="field-hint">
              JPG, PNG, WebP of AVIF, maximaal 12 MB. Een upload overschrijft het
              pad hiernaast.
            </p>
            {state.errors?.coverFile && (
              <p className="field-error">{state.errors.coverFile}</p>
            )}
          </div>
          <Text
            id="coverUrl"
            name="coverUrl"
            label="Of: pad naar een bestaand bestand"
            defaultValue={project?.coverUrl ?? ""}
            hint="Bijvoorbeeld /images/project-vastgoed-1.jpg"
            onChange={(value) => setCoverUrl(value)}
          />
        </div>

        <div className="mt-5">
          <Text
            id="coverAlt"
            name="coverAlt"
            label="Alternatieve tekst"
            defaultValue={project?.coverAlt ?? ""}
            hint="Beschrijf wat er te zien is, voor mensen die de foto niet kunnen zien."
          />
        </div>
      </fieldset>

      <Text
        id="videoUrl"
        name="videoUrl"
        label="Videolink"
        defaultValue={project?.videoUrl ?? ""}
        hint="YouTube- of Vimeo-link. Laat leeg als er nog geen video is."
      />

      <div className="flex flex-wrap gap-6">
        <label htmlFor="published" className="flex items-center gap-2 text-sm">
          <input
            id="published"
            name="published"
            type="checkbox"
            defaultChecked={project?.published ?? false}
            className="h-4 w-4 rounded border-ink-600 bg-ink-900"
          />
          Gepubliceerd (zichtbaar op de site)
        </label>
        <label htmlFor="featured" className="flex items-center gap-2 text-sm">
          <input
            id="featured"
            name="featured"
            type="checkbox"
            defaultChecked={project?.featured ?? false}
            className="h-4 w-4 rounded border-ink-600 bg-ink-900"
          />
          Uitgelicht op de homepage
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Bezig met opslaan…" : project ? "Wijzigingen opslaan" : "Project aanmaken"}
      </button>
    </form>
  );
}

function Text({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  hint,
  error,
  required,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="field-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
