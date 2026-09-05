"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Miniatuur van één pdf-pagina.
 *
 * De miniatuur wordt pas gerenderd wanneer de pagina in beeld komt, en de
 * renderopdrachten worden één voor één afgehandeld. Bij een document van
 * honderd pagina's blijft de browser daardoor bruikbaar.
 */

let renderQueue: Promise<unknown> = Promise.resolve();

/** Zet renderopdrachten achter elkaar in de rij. */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = renderQueue.then(task, task);
  renderQueue = result.catch(() => undefined);
  return result;
}

interface PageThumbnailProps {
  pageNumber: number;
  /** Rendert de pagina en geeft een data-URL terug. */
  render: (pageNumber: number) => Promise<string>;
}

export function PageThumbnail({ pageNumber, render }: PageThumbnailProps) {
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = holder.current;
    if (!element || source) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        enqueue(() => render(pageNumber)).then(
          (url) => {
            if (!cancelled) setSource(url);
          },
          () => {
            if (!cancelled) setFailed(true);
          },
        );
      },
      { rootMargin: "300px" },
    );

    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pageNumber, render, source]);

  return (
    <div
      ref={holder}
      className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-canvas"
    >
      {source ? (
        // Een data-URL uit de eigen browser; geen externe afbeelding.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source}
          alt={`Miniatuur van pagina ${pageNumber}`}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="px-1 text-center text-[10px] leading-tight text-ink-muted">
          {failed ? "Geen weergave" : `Pagina ${pageNumber}`}
        </span>
      )}
    </div>
  );
}
