"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    loginAction,
    emptyActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <p className="notice notice-error" role="alert">
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="password" className="field-label">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="field-input"
          aria-invalid={state.status === "error" ? "true" : undefined}
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
