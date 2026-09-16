import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/** De publieke website: kop, inhoud en footer. */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="hoofdinhoud" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
