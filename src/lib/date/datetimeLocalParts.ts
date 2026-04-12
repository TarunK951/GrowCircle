/** Helpers for `YYYY-MM-DDTHH:mm` strings used with `<input type="date">` + `<input type="time">`. */

export function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYYYYMMDDLocal(): string {
  return formatDateYYYYMMDD(new Date());
}

export function nowHHMMLocal(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

/**
 * Default when empty: one hour from now (rounded to next hour slot for simpler UX).
 */
export function defaultScheduleParts(): { date: string; time: string } {
  const t = new Date();
  t.setHours(t.getHours() + 1, 0, 0, 0);
  return {
    date: formatDateYYYYMMDD(t),
    time: `${String(t.getHours()).padStart(2, "0")}:00`,
  };
}

export function splitDateTimeLocal(value: string): { date: string; time: string } {
  if (!value || !value.includes("T")) {
    return defaultScheduleParts();
  }
  const [date, rest] = value.trim().split("T");
  const time = (rest ?? "12:00").slice(0, 5);
  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayYYYYMMDDLocal(),
    time: /^\d{2}:\d{2}$/.test(time) ? time : "12:00",
  };
}

export function joinDateTimeLocal(date: string, time: string): string {
  if (!date) return "";
  const t = time && time.length >= 4 ? time.slice(0, 5) : "12:00";
  return `${date}T${t}`;
}

export function isFutureDateTimeLocal(isoLocal: string): boolean {
  const t = new Date(isoLocal);
  return !Number.isNaN(t.getTime()) && t.getTime() > Date.now();
}
