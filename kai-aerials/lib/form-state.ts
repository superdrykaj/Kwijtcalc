/**
 * Gedeelde vorm van formulierantwoorden.
 * Staat los van de server actions, omdat een bestand met "use server"
 * alleen async functies mag exporteren.
 */

export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: Record<string, string>;
  /** Extra gegevens bij een geslaagde aanvraag. */
  result?: {
    reference: string;
    when: string;
    serviceName: string;
    mailSent: boolean;
  };
};

export const emptyFormState: FormState = {
  status: "idle",
  message: "",
  errors: {},
};

export type ActionState = {
  status: "idle" | "success" | "error" | "warning";
  message: string;
  errors?: Record<string, string>;
};

export const emptyActionState: ActionState = { status: "idle", message: "" };
