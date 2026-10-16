export interface OpenDay {
  open: string;
  close: string;
}

/** Haftalık açılış saatleri: 0=Pazar … 6=Cumartesi. `null` = kapalı. */
export type WeeklyHours = (OpenDay | null)[];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(value: string): number {
  const [h = '0', m = '0'] = value.split(':');
  return Number(h) * 60 + Number(m);
}

/** Girdiyi 7 günlük geçerli bir çizelgeye indirger (geçersiz günler `null`). */
export function normalizeWeeklyHours(input: unknown): WeeklyHours {
  const arr = Array.isArray(input) ? input : [];
  const out: WeeklyHours = [];
  for (let i = 0; i < 7; i++) {
    const d = arr[i] as { open?: unknown; close?: unknown } | null | undefined;
    if (
      d &&
      typeof d.open === 'string' &&
      typeof d.close === 'string' &&
      HHMM.test(d.open) &&
      HHMM.test(d.close)
    ) {
      out.push({ open: d.open, close: d.close });
    } else {
      out.push(null);
    }
  }
  return out;
}

/** Verilen andaki yerel (tz) haftanın günü + gün-içi dakika. */
export function weekdayAndMinutes(
  at: Date,
  timeZone: string,
): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wd: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = wd[get('weekday')] ?? 0;
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // bazı motorlar gece yarısını 24 döndürür
  const minutes = hour * 60 + Number(get('minute'));
  return { weekday, minutes };
}

/** Şu an (verilen tz'de) açık mı? */
export function isOpenAt(schedule: WeeklyHours, at: Date, timeZone: string): boolean {
  const { weekday, minutes } = weekdayAndMinutes(at, timeZone);
  const day = schedule[weekday];
  if (!day) return false;
  return minutes >= toMinutes(day.open) && minutes < toMinutes(day.close);
}
