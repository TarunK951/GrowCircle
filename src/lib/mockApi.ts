import type { Booking, City, MeetEvent, User } from "@/lib/types";
import citiesData from "@/data/cities.json";
import eventsData from "@/data/events.json";
import usersSeed from "@/data/users.seed.json";

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

export async function listCities(): Promise<City[]> {
  await delay();
  return citiesData as City[];
}

export async function listEvents(filters?: {
  cityId?: string;
  category?: string;
}): Promise<MeetEvent[]> {
  await delay();
  let list = [...(eventsData as MeetEvent[])];
  if (filters?.cityId) list = list.filter((e) => e.cityId === filters.cityId);
  if (filters?.category && filters.category !== "all")
    list = list.filter((e) => e.category === filters.category);
  return list;
}

export async function getEvent(id: string): Promise<MeetEvent | null> {
  await delay(180);
  const e = (eventsData as MeetEvent[]).find((x) => x.id === id);
  return e ?? null;
}

export async function getUser(id: string): Promise<User | null> {
  await delay(120);
  const u = (usersSeed as User[]).find((x) => x.id === id);
  return u ?? null;
}

export async function loginMock(email: string, password: string): Promise<User> {
  void password;
  await delay(400);
  const seed = usersSeed as User[];
  const found = seed.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (found) return { ...found };
  return {
    id: "u_demo",
    name: email.split("@")[0] || "Explorer",
    email,
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop",
    cityId: "sf",
    interests: [],
    verified: false,
  };
}

export async function signupMock(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  await delay(450);
  return {
    id: "u_" + Math.random().toString(36).slice(2, 10),
    name: input.name,
    email: input.email,
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop",
    cityId: "sf",
    interests: [],
    verified: false,
  };
}

export async function sendContactForm(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: true }> {
  void data;
  await delay(500);
  return { ok: true };
}

export async function forgotPasswordMock(email: string): Promise<{ ok: true }> {
  void email;
  await delay(400);
  return { ok: true };
}

export function makeBookingRecord(
  userId: string,
  eventId: string,
): Booking {
  return {
    id: "b_" + Math.random().toString(36).slice(2, 12),
    userId,
    eventId,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
}
