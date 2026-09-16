import Link from "next/link";

export function PageHeading({
  title,
  intro,
  action,
}: {
  title: string;
  intro?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-2">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-sm text-mist-500">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-6 ${className}`}>
      {title && <h2 className="display-3 text-base">{title}</h2>}
      {description && (
        <p className="mt-1.5 text-sm leading-relaxed text-mist-500">{description}</p>
      )}
      <div className={title ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  body,
  href,
  linkLabel,
}: {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink-600 px-6 py-14 text-center">
      <p className="font-semibold text-mist-100">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-mist-500">{body}</p>
      {href && linkLabel && (
        <Link href={href} className="btn btn-ghost mt-6">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  confirmed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  rejected: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  cancelled: "border-ink-600 bg-ink-800 text-mist-500",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "border-ink-600 text-mist-500"
      }`}
    >
      {label}
    </span>
  );
}
