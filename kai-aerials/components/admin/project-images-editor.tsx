"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  addProjectImageAction,
  deleteProjectImageAction,
  updateProjectImageAction,
} from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";
import type { ProjectImage } from "@/lib/types";

export function ProjectImagesEditor({
  projectId,
  images,
}: {
  projectId: number;
  images: ProjectImage[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    addProjectImageAction,
    emptyActionState,
  );

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        {state.status !== "idle" && (
          <p
            className={`notice ${state.status === "error" ? "notice-error" : "notice-success"}`}
            role="status"
          >
            {state.message}
          </p>
        )}
        <input type="hidden" name="projectId" value={projectId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gallery-file" className="field-label">
              Afbeelding uploaden
            </label>
            <input
              id="gallery-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="field-input file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-sm file:text-mist-100"
            />
          </div>
          <div>
            <label htmlFor="gallery-url" className="field-label">
              Of: pad naar een bestaand bestand
            </label>
            <input
              id="gallery-url"
              name="url"
              type="text"
              placeholder="/images/gallery-1.jpg"
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="gallery-alt" className="field-label">
              Alternatieve tekst
            </label>
            <input
              id="gallery-alt"
              name="alt"
              type="text"
              className="field-input"
              aria-describedby="gallery-alt-hint"
            />
            <p id="gallery-alt-hint" className="field-hint">
              Beschrijf kort wat er op de foto staat.
            </p>
          </div>
        </div>

        <button type="submit" className="btn btn-ghost" disabled={pending}>
          {pending ? "Bezig met toevoegen…" : "Afbeelding toevoegen"}
        </button>
      </form>

      {images.length === 0 ? (
        <p className="text-sm text-mist-500">Nog geen foto&apos;s in de galerij.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <li key={image.id} className="rounded-xl border border-ink-700 p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink-800">
                <Image
                  src={image.url}
                  alt={image.alt || ""}
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              </div>
              <form action={updateProjectImageAction} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={image.id} />
                <input type="hidden" name="projectId" value={projectId} />
                <div>
                  <label htmlFor={`alt-${image.id}`} className="field-label">
                    Alternatieve tekst
                  </label>
                  <input
                    id={`alt-${image.id}`}
                    name="alt"
                    type="text"
                    defaultValue={image.alt}
                    className="field-input"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-28">
                    <label htmlFor={`order-${image.id}`} className="field-label">
                      Volgorde
                    </label>
                    <input
                      id={`order-${image.id}`}
                      name="sortOrder"
                      type="number"
                      defaultValue={image.sortOrder}
                      className="field-input"
                    />
                  </div>
                  <button type="submit" className="btn btn-quiet">
                    Opslaan
                  </button>
                </div>
              </form>
              <form action={deleteProjectImageAction} className="mt-2">
                <input type="hidden" name="id" value={image.id} />
                <input type="hidden" name="projectId" value={projectId} />
                <button type="submit" className="btn btn-quiet text-rose-300">
                  Verwijderen
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
