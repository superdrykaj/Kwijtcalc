"use server";

import { headers } from "next/headers";

import { createBooking } from "@/lib/bookings";
import { isMailConfigured, sendBookingRequestMails, sendContactMails } from "@/lib/mail";
import { createMessage } from "@/lib/messages";
import type { FormState } from "@/lib/form-state";
import { rateLimit } from "@/lib/rate-limit";
import { formatTimestamp } from "@/lib/time";
import { bookingFormSchema, contactFormSchema, fieldErrors } from "@/lib/validation";

/* -------------------------------------------------------------------------- */
/* Gedeelde hulpmiddelen                                                      */
/* -------------------------------------------------------------------------- */

async function clientKey(prefix: string): Promise<string> {
  const head = await headers();
  const forwarded = head.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || head.get("x-real-ip") || "onbekend";
  return `${prefix}:${ip}`;
}

/* -------------------------------------------------------------------------- */
/* Afspraak aanvragen                                                          */
/* -------------------------------------------------------------------------- */

export async function requestBookingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = rateLimit(await clientKey("boeking"), 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return {
      status: "error",
      message:
        "Er zijn net te veel aanvragen vanaf dit adres verstuurd. Probeer het over een paar minuten opnieuw.",
      errors: {},
    };
  }

  const parsed = bookingFormSchema.safeParse({
    serviceId: formData.get("serviceId"),
    startUtc: formData.get("startUtc"),
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    location: formData.get("location") ?? "",
    description: formData.get("description") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Controleer de gemarkeerde velden.",
      errors: fieldErrors(parsed.error),
    };
  }

  const created = createBooking({
    serviceId: parsed.data.serviceId,
    startUtc: parsed.data.startUtc,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? "",
    location: parsed.data.location,
    description: parsed.data.description,
  });

  if (!created.ok) {
    return { status: "error", message: created.error, errors: {} };
  }

  const mail = await sendBookingRequestMails(created.booking);

  return {
    status: "success",
    message: "Je aanvraag is ontvangen.",
    errors: {},
    result: {
      reference: created.booking.reference,
      when: formatTimestamp(created.booking.startUtc),
      serviceName: created.booking.serviceName,
      mailSent: isMailConfigured() && mail.customer === "sent",
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Contactformulier                                                            */
/* -------------------------------------------------------------------------- */

export async function sendContactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = rateLimit(await clientKey("contact"), 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return {
      status: "error",
      message:
        "Er zijn net te veel berichten vanaf dit adres verstuurd. Probeer het over een paar minuten opnieuw.",
      errors: {},
    };
  }

  const parsed = contactFormSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Controleer de gemarkeerde velden.",
      errors: fieldErrors(parsed.error),
    };
  }

  const id = createMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  const mail = await sendContactMails({
    id,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    handled: false,
    createdUtc: Date.now(),
  });

  return {
    status: "success",
    message: "Je bericht is opgeslagen en staat klaar voor Kai.",
    errors: {},
    result: {
      reference: "",
      when: "",
      serviceName: "",
      mailSent: isMailConfigured() && mail.customer === "sent",
    },
  };
}
