"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import type { ProjectImage } from "@/lib/types";

export function ProjectGallery({
  images,
  title,
}: {
  images: ProjectImage[];
  title: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null
          ? null
          : (current + delta + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : images[openIndex];

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-ink-700 bg-ink-800"
            >
              <Image
                src={image.url}
                alt={image.alt || `Foto ${index + 1} van ${title}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="sr-only">Vergroot deze foto</span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt || `Foto van ${title}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 p-4"
          onClick={close}
        >
          <div
            className="relative max-h-full w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[3/2] w-full">
              <Image
                src={active.url}
                alt={active.alt || `Foto van ${title}`}
                fill
                sizes="90vw"
                className="rounded-xl object-contain"
              />
            </div>
            {active.alt && (
              <p className="mt-3 text-center text-sm text-mist-500">{active.alt}</p>
            )}

            <div className="mt-5 flex items-center justify-center gap-3">
              <button type="button" className="btn btn-quiet" onClick={() => step(-1)}>
                ← Vorige
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => step(1)}>
                Volgende →
              </button>
            </div>

            <button
              type="button"
              onClick={close}
              autoFocus
              className="absolute -top-2 right-0 inline-flex h-10 w-10 -translate-y-full items-center justify-center rounded-full border border-ink-600 bg-ink-900 text-mist-300 hover:text-mist-100"
            >
              <span className="sr-only">Sluiten</span>
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M4 4l12 12M16 4L4 16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
