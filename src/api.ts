import { API_BASE } from "./config";

export type Lead = { name: string; company: string; email: string; phone: string };
export type Slot = { start: string; end: string };
export type Availability = { demo: boolean; timezone: string; slots: Slot[] };
export type Booked = { demo: boolean; start: string; meetLink: string | null; emailSent: boolean };
export type Emailed = { demo: boolean; emailSent: boolean };

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, init);
  } catch {
    throw new ApiError("We couldn’t reach the scheduling service. Please try again in a moment.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong. Please try again.", res.status);
  return data as T;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const getAvailability = (date: string, signal?: AbortSignal) => request<Availability>(`/availability?date=${encodeURIComponent(date)}`, { signal });

export const bookCall = (lead: Lead, start: string) => post<Booked>("/book", { ...lead, start });

export const requestEmail = (lead: Lead) => post<Emailed>("/email-only", lead);
