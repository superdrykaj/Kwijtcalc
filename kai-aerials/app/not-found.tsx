import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60svh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display-1 mt-4">Deze pagina bestaat niet.</h1>
      <p className="lede mt-5 max-w-md">
        De link klopt niet meer, of de pagina is verplaatst. Vanaf hier kom je
        weer verder.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Naar de homepage
        </Link>
        <Link href="/portfolio" className="btn btn-ghost">
          Bekijk het portfolio
        </Link>
      </div>
    </div>
  );
}
