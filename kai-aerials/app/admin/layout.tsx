import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beheer",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-ink-950">{children}</div>;
}
