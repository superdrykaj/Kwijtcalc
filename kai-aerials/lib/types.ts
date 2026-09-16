export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

/** Statussen die een tijdslot bezet houden. */
export const BLOCKING_STATUSES: BookingStatus[] = ["pending", "confirmed"];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Aangevraagd",
  confirmed: "Bevestigd",
  rejected: "Afgewezen",
  cancelled: "Geannuleerd",
};

export type Service = {
  id: number;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceLabel: string;
  bufferMinutes: number;
  bookable: boolean;
  introOnly: boolean;
  sortOrder: number;
  active: boolean;
};

export type Booking = {
  id: number;
  reference: string;
  serviceId: number;
  serviceName: string;
  startUtc: number;
  endUtc: number;
  status: BookingStatus;
  name: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  adminNote: string;
  createdUtc: number;
  updatedUtc: number;
};

export type WeeklyWindow = {
  id: number;
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export type DateOverride = {
  id: number;
  dateKey: string;
  kind: "block" | "open";
  startMinute: number;
  endMinute: number;
  note: string;
};

export type BookingSettings = {
  slotIntervalMinutes: number;
  defaultBufferMinutes: number;
  minLeadHours: number;
  maxAdvanceDays: number;
};

export type Project = {
  id: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  summary: string;
  body: string;
  coverUrl: string;
  coverAlt: string;
  videoUrl: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  createdUtc: number;
};

export type ProjectImage = {
  id: number;
  projectId: number;
  url: string;
  alt: string;
  sortOrder: number;
};

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdUtc: number;
};
