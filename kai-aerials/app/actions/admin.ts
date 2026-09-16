"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addOverride,
  conflictingBookings,
  deleteOverride,
  replaceWeeklyWindows,
} from "@/lib/availability";
import {
  deleteBooking,
  getBooking,
  rescheduleBooking,
  setAdminNote,
  setBookingStatus,
} from "@/lib/bookings";
import {
  AuthNotConfiguredError,
  isAuthConfigured,
  requireAdmin,
  signIn,
  signOut,
} from "@/lib/auth";
import {
  sendBookingCancelledMail,
  sendBookingConfirmedMail,
} from "@/lib/mail";
import { deleteMessage, setMessageHandled } from "@/lib/messages";
import {
  addProjectImage,
  createProject,
  deleteProject,
  deleteProjectImage,
  updateProject,
  updateProjectImage,
  uniqueSlug,
} from "@/lib/projects";
import type { ActionState } from "@/lib/form-state";
import { rateLimit } from "@/lib/rate-limit";
import { createService, deleteService, updateService } from "@/lib/services";
import { saveSettings } from "@/lib/settings";
import { parseMinutes, zonedToUtc } from "@/lib/time";
import { saveUpload } from "@/lib/uploads";
import {
  fieldErrors,
  projectFormSchema,
  serviceFormSchema,
  settingsFormSchema,
} from "@/lib/validation";
import type { BookingStatus } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Inloggen                                                                    */
/* -------------------------------------------------------------------------- */

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isAuthConfigured()) {
    return {
      status: "error",
      message:
        "De beheeromgeving is nog niet ingesteld. Zet AUTH_SECRET en ADMIN_PASSWORD_HASH in je .env.local.",
    };
  }
  // Rem pogingen af om wachtwoorden te raden.
  const limit = rateLimit("admin-login", 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Te veel inlogpogingen. Probeer het over ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minuten opnieuw.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  try {
    const ok = await signIn(password);
    if (!ok) {
      return { status: "error", message: "Onjuist wachtwoord." };
    }
  } catch (error) {
    if (error instanceof AuthNotConfiguredError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/* Boekingen                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateBookingStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as BookingStatus;
  if (!["pending", "confirmed", "rejected", "cancelled"].includes(status)) {
    return { status: "error", message: "Onbekende status." };
  }

  const result = setBookingStatus(id, status);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Wijzigen is niet gelukt." };
  }

  const booking = getBooking(id);
  let mailNote = "";
  if (booking) {
    if (status === "confirmed") {
      const sent = await sendBookingConfirmedMail(booking);
      mailNote =
        sent === "sent"
          ? " De klant heeft een bevestigingsmail gekregen."
          : " Let op: e-mail is niet ingesteld, dus de klant kreeg géén bericht.";
    } else if (status === "rejected" || status === "cancelled") {
      const sent = await sendBookingCancelledMail(booking, status);
      mailNote =
        sent === "sent"
          ? " De klant is per e-mail op de hoogte gebracht."
          : " Let op: e-mail is niet ingesteld, dus de klant kreeg géén bericht.";
    }
  }

  revalidatePath("/admin/boekingen");
  revalidatePath("/admin");
  revalidatePath("/");
  return { status: "success", message: `Status bijgewerkt.${mailNote}` };
}

export async function rescheduleBookingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dateKey = String(formData.get("dateKey") ?? "");
  const time = parseMinutes(String(formData.get("time") ?? ""));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || time === null) {
    return { status: "error", message: "Vul een geldige datum en tijd in." };
  }

  const result = rescheduleBooking(id, zonedToUtc(dateKey, time), {
    asAdmin: true,
  });
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Verplaatsen is niet gelukt." };
  }

  revalidatePath("/admin/boekingen");
  revalidatePath("/");
  return { status: "success", message: "De afspraak is verplaatst." };
}

export async function saveBookingNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  setAdminNote(Number(formData.get("id")), String(formData.get("note") ?? "").slice(0, 2000));
  revalidatePath("/admin/boekingen");
  return { status: "success", message: "Notitie opgeslagen." };
}

export async function deleteBookingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  deleteBooking(Number(formData.get("id")));
  revalidatePath("/admin/boekingen");
  revalidatePath("/");
}

/* -------------------------------------------------------------------------- */
/* Beschikbaarheid                                                             */
/* -------------------------------------------------------------------------- */

export async function saveWeeklyAvailabilityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const windows: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    // Per dag maximaal vier periodes.
    for (let slot = 0; slot < 4; slot++) {
      const from = String(formData.get(`d${weekday}-from-${slot}`) ?? "").trim();
      const to = String(formData.get(`d${weekday}-to-${slot}`) ?? "").trim();
      if (!from && !to) continue;
      const start = parseMinutes(from);
      const end = parseMinutes(to);
      if (start === null || end === null) {
        return {
          status: "error",
          message: `Ongeldige tijd op dag ${weekday + 1}. Gebruik het formaat 09:00.`,
        };
      }
      if (end <= start) {
        return {
          status: "error",
          message: `De eindtijd moet later zijn dan de begintijd (dag ${weekday + 1}).`,
        };
      }
      windows.push({ weekday, startMinute: start, endMinute: end });
    }
  }

  replaceWeeklyWindows(windows);
  revalidatePath("/admin/beschikbaarheid");
  revalidatePath("/");

  const conflicts = conflictingBookings();
  if (conflicts.length > 0) {
    return {
      status: "warning",
      message:
        `Opgeslagen. Let op: ${conflicts.length} bestaande ` +
        `${conflicts.length === 1 ? "boeking valt" : "boekingen vallen"} nu buiten je ` +
        "beschikbaarheid. Ze blijven staan; bekijk ze hieronder.",
    };
  }
  return { status: "success", message: "Je weekschema is opgeslagen." };
}

export async function addOverrideAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const dateKey = String(formData.get("dateKey") ?? "");
  const kind = String(formData.get("kind") ?? "block") === "open" ? "open" : "block";
  const wholeDay = formData.get("wholeDay") === "on";
  const note = String(formData.get("note") ?? "").slice(0, 200);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return { status: "error", message: "Kies een geldige datum." };
  }

  let start = 0;
  let end = 1440;
  if (!wholeDay) {
    const parsedStart = parseMinutes(String(formData.get("from") ?? ""));
    const parsedEnd = parseMinutes(String(formData.get("to") ?? ""));
    if (parsedStart === null || parsedEnd === null) {
      return { status: "error", message: "Vul een begin- en eindtijd in (bijvoorbeeld 09:00)." };
    }
    if (parsedEnd <= parsedStart) {
      return { status: "error", message: "De eindtijd moet later zijn dan de begintijd." };
    }
    start = parsedStart;
    end = parsedEnd;
  }

  addOverride({ dateKey, kind, startMinute: start, endMinute: end, note });
  revalidatePath("/admin/beschikbaarheid");
  revalidatePath("/");

  const conflicts = conflictingBookings();
  if (kind === "block" && conflicts.length > 0) {
    return {
      status: "warning",
      message:
        `Toegevoegd. Let op: ${conflicts.length} bestaande ` +
        `${conflicts.length === 1 ? "boeking valt" : "boekingen vallen"} nu buiten je ` +
        "beschikbaarheid. Ze blijven staan; bekijk ze hieronder.",
    };
  }
  return {
    status: "success",
    message: kind === "block" ? "De blokkade is toegevoegd." : "De extra beschikbaarheid is toegevoegd.",
  };
}

export async function deleteOverrideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  deleteOverride(Number(formData.get("id")));
  revalidatePath("/admin/beschikbaarheid");
  revalidatePath("/");
}

/* -------------------------------------------------------------------------- */
/* Diensten en instellingen                                                    */
/* -------------------------------------------------------------------------- */

export async function saveServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = serviceFormSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    durationMinutes: formData.get("durationMinutes"),
    priceLabel: formData.get("priceLabel") ?? "",
    bufferMinutes: formData.get("bufferMinutes") || 0,
    bookable: formData.get("bookable") === "on",
    introOnly: formData.get("introOnly") === "on",
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Controleer de gemarkeerde velden.",
      errors: fieldErrors(parsed.error),
    };
  }

  const idRaw = formData.get("id");
  const values = {
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    durationMinutes: parsed.data.durationMinutes,
    priceLabel: parsed.data.priceLabel ?? "",
    bufferMinutes: parsed.data.bufferMinutes ?? 0,
    bookable: parsed.data.bookable ?? true,
    introOnly: parsed.data.introOnly ?? false,
    sortOrder: parsed.data.sortOrder ?? 0,
    active: parsed.data.active ?? true,
  };

  if (idRaw) {
    updateService(Number(idRaw), values);
  } else {
    const slug = parsed.data.name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    createService({ ...values, slug: `${slug}-${Date.now().toString(36)}` });
  }

  revalidatePath("/admin/diensten");
  revalidatePath("/");
  return { status: "success", message: "De dienst is opgeslagen." };
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  deleteService(Number(formData.get("id")));
  revalidatePath("/admin/diensten");
  revalidatePath("/");
}

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = settingsFormSchema.safeParse({
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
    defaultBufferMinutes: formData.get("defaultBufferMinutes"),
    minLeadHours: formData.get("minLeadHours"),
    maxAdvanceDays: formData.get("maxAdvanceDays"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Controleer de gemarkeerde velden.",
      errors: fieldErrors(parsed.error),
    };
  }

  saveSettings(parsed.data);
  revalidatePath("/admin/instellingen");
  revalidatePath("/");
  return { status: "success", message: "De boekingsregels zijn opgeslagen." };
}

/* -------------------------------------------------------------------------- */
/* Projecten                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = projectFormSchema.safeParse({
    title: formData.get("title") ?? "",
    category: formData.get("category") ?? "",
    location: formData.get("location") ?? "",
    summary: formData.get("summary") ?? "",
    body: formData.get("body") ?? "",
    coverUrl: formData.get("coverUrl") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    videoUrl: formData.get("videoUrl") ?? "",
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Controleer de gemarkeerde velden.",
      errors: fieldErrors(parsed.error),
    };
  }

  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : undefined;

  // Nieuw geüpload omslagbeeld heeft voorrang op het ingevulde pad.
  let coverUrl = parsed.data.coverUrl ?? "";
  const coverFile = formData.get("coverFile");
  if (coverFile instanceof File && coverFile.size > 0) {
    const upload = await saveUpload(coverFile);
    if (!upload.ok) {
      return { status: "error", message: upload.error, errors: { coverFile: upload.error } };
    }
    coverUrl = upload.url;
  }

  const values = {
    slug: uniqueSlug(parsed.data.title, id),
    title: parsed.data.title,
    category: parsed.data.category,
    location: parsed.data.location ?? "",
    summary: parsed.data.summary ?? "",
    body: parsed.data.body ?? "",
    coverUrl,
    coverAlt: parsed.data.coverAlt ?? "",
    videoUrl: parsed.data.videoUrl ?? "",
    published: parsed.data.published ?? false,
    featured: parsed.data.featured ?? false,
    sortOrder: parsed.data.sortOrder ?? 0,
  };

  let projectId: number;
  if (id) {
    updateProject(id, values);
    projectId = id;
  } else {
    projectId = createProject(values);
  }

  revalidatePath("/admin/projecten");
  revalidatePath("/portfolio");
  revalidatePath("/");

  if (!id) {
    redirect(`/admin/projecten/${projectId}`);
  }
  return { status: "success", message: "Het project is opgeslagen." };
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  deleteProject(Number(formData.get("id")));
  revalidatePath("/admin/projecten");
  revalidatePath("/portfolio");
  revalidatePath("/");
  redirect("/admin/projecten");
}

export async function addProjectImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = Number(formData.get("projectId"));
  const alt = String(formData.get("alt") ?? "").slice(0, 300);
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  const file = formData.get("file");
  const url = String(formData.get("url") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    const upload = await saveUpload(file);
    if (!upload.ok) return { status: "error", message: upload.error };
    addProjectImage(projectId, upload.url, alt, sortOrder);
  } else if (url) {
    addProjectImage(projectId, url, alt, sortOrder);
  } else {
    return { status: "error", message: "Kies een bestand of vul een pad in." };
  }

  revalidatePath(`/admin/projecten/${projectId}`);
  revalidatePath("/portfolio");
  return { status: "success", message: "De afbeelding is toegevoegd." };
}

export async function updateProjectImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  updateProjectImage(
    Number(formData.get("id")),
    String(formData.get("alt") ?? "").slice(0, 300),
    Number(formData.get("sortOrder") ?? 0) || 0,
  );
  revalidatePath(`/admin/projecten/${formData.get("projectId")}`);
  revalidatePath("/portfolio");
}

export async function deleteProjectImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  deleteProjectImage(Number(formData.get("id")));
  revalidatePath(`/admin/projecten/${formData.get("projectId")}`);
  revalidatePath("/portfolio");
}

/* -------------------------------------------------------------------------- */
/* Berichten                                                                   */
/* -------------------------------------------------------------------------- */

export async function toggleMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  setMessageHandled(
    Number(formData.get("id")),
    formData.get("handled") === "true",
  );
  revalidatePath("/admin/berichten");
  revalidatePath("/admin");
}

export async function deleteMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  deleteMessage(Number(formData.get("id")));
  revalidatePath("/admin/berichten");
  revalidatePath("/admin");
}
