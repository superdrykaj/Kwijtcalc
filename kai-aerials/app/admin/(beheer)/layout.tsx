import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { site } from "@/content/site";
import { isSignedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Alles in deze routegroep is alleen bereikbaar na inloggen.
 * Deze controle draait op de server, vóór er iets wordt weergegeven.
 */
export default async function BeheerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isSignedIn())) {
    redirect("/admin/login");
  }

  return (
    <>
      <header className="border-b border-ink-700 bg-ink-900">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-baseline gap-3">
            <Link
              href="/admin"
              className="font-[family-name:var(--font-display)] text-lg font-semibold"
            >
              {site.name}
            </Link>
            <span className="chip">Beheer</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-quiet" target="_blank">
              Bekijk site ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-quiet">
                Uitloggen
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>

      <div className="container-page py-10">{children}</div>
    </>
  );
}
