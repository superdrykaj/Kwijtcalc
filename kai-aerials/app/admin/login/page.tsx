import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { site } from "@/content/site";
import { isAuthConfigured, isSignedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isSignedIn()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow text-center">{site.name}</p>
        <h1 className="display-2 mt-3 text-center">Beheeromgeving</h1>
        <p className="mt-3 text-center text-sm text-mist-500">
          Log in om je beschikbaarheid, boekingen en portfolio te beheren.
        </p>

        <div className="card mt-8 p-7">
          {isAuthConfigured() ? (
            <LoginForm />
          ) : (
            <div className="space-y-4 text-sm">
              <p className="notice notice-warning">
                De beheeromgeving is nog niet ingesteld.
              </p>
              <p className="text-mist-300">Stel eerst een wachtwoord in:</p>
              <ol className="ml-5 list-decimal space-y-2 text-mist-500">
                <li>
                  Draai in de projectmap:
                  <code className="mt-1 block rounded bg-ink-900 px-3 py-2 text-xs text-mist-300">
                    npm run hash-password -- &apos;jouw-lange-wachtwoord&apos;
                  </code>
                </li>
                <li>
                  Zet de twee regels uit de uitvoer in het bestand{" "}
                  <code className="text-mist-300">.env.local</code>.
                </li>
                <li>Start de server opnieuw.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
