import {
  deleteMessageAction,
  toggleMessageAction,
} from "@/app/actions/admin";
import { EmptyState, PageHeading } from "@/components/admin/ui";
import { listMessages } from "@/lib/messages";
import { formatTimestamp } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  const messages = listMessages();

  return (
    <>
      <PageHeading
        title="Berichten"
        intro="Berichten uit het contactformulier. Alleen jij ziet deze gegevens."
      />

      {messages.length === 0 ? (
        <EmptyState
          title="Nog geen berichten"
          body="Zodra iemand het contactformulier invult, verschijnt het bericht hier."
          href="/contact"
          linkLabel="Bekijk de contactpagina"
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`card p-5 ${message.handled ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold">{message.subject}</h2>
                  <p className="mt-1 text-sm text-mist-500">
                    {message.name} ·{" "}
                    <a
                      href={`mailto:${message.email}`}
                      className="text-azure-300 hover:underline"
                    >
                      {message.email}
                    </a>{" "}
                    · {formatTimestamp(message.createdUtc)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleMessageAction}>
                    <input type="hidden" name="id" value={message.id} />
                    <input
                      type="hidden"
                      name="handled"
                      value={message.handled ? "false" : "true"}
                    />
                    <button type="submit" className="btn btn-quiet">
                      {message.handled ? "Markeer als open" : "Markeer als afgehandeld"}
                    </button>
                  </form>
                  <form action={deleteMessageAction}>
                    <input type="hidden" name="id" value={message.id} />
                    <button type="submit" className="btn btn-quiet text-rose-300">
                      Verwijderen
                    </button>
                  </form>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm text-mist-300">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
