"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[60svh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Er ging iets mis</p>
      <h1 className="display-2 mt-4">Deze pagina kon niet worden geladen.</h1>
      <p className="lede mt-5 max-w-md">
        Probeer het opnieuw. Blijft het misgaan, laat het me dan weten.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-mist-600">Foutcode: {error.digest}</p>
      )}
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Opnieuw proberen
      </button>
    </div>
  );
}
