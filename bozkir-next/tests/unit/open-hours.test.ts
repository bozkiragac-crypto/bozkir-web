import { describe, it, expect } from 'vitest';
import {
  isOpenAt,
  normalizeWeeklyHours,
  weekdayAndMinutes,
  type WeeklyHours,
} from '@/lib/open-hours';

const schedule: WeeklyHours = [
  null, // Pazar
  { open: '08:00', close: '18:00' }, // Pzt
  { open: '08:00', close: '18:00' }, // Sal
  { open: '08:00', close: '18:00' }, // Çar
  { open: '08:00', close: '18:00' }, // Per
  { open: '08:00', close: '18:00' }, // Cum
  { open: '08:00', close: '14:00' }, // Cmt
];

const TZ = 'Europe/Istanbul';

describe('normalizeWeeklyHours', () => {
  it('7 güne indirger, geçersizleri null yapar', () => {
    const out = normalizeWeeklyHours([
      { open: '08:00', close: '18:00' },
      { open: '25:00', close: '18:00' },
      null,
      'x',
    ]);
    expect(out).toHaveLength(7);
    expect(out[0]).toEqual({ open: '08:00', close: '18:00' });
    expect(out[1]).toBeNull();
    expect(out[6]).toBeNull();
  });
});

describe('weekdayAndMinutes', () => {
  it('tz yerel gün/saat verir', () => {
    // 2026-06-01 09:30 İstanbul (UTC+3) → Pazartesi 570 dk
    const { weekday, minutes } = weekdayAndMinutes(new Date('2026-06-01T06:30:00Z'), TZ);
    expect(weekday).toBe(1);
    expect(minutes).toBe(9 * 60 + 30);
  });
});

describe('isOpenAt', () => {
  it('mesai içinde açık', () => {
    expect(isOpenAt(schedule, new Date('2026-06-01T09:00:00Z'), TZ)).toBe(true); // Pzt 12:00
  });
  it('mesai dışında kapalı', () => {
    expect(isOpenAt(schedule, new Date('2026-06-01T16:00:00Z'), TZ)).toBe(false); // Pzt 19:00
  });
  it('pazar kapalı', () => {
    expect(isOpenAt(schedule, new Date('2026-06-07T09:00:00Z'), TZ)).toBe(false); // Pazar 12:00
  });
  it('cumartesi 14:00 sonrası kapalı', () => {
    expect(isOpenAt(schedule, new Date('2026-06-06T12:00:00Z'), TZ)).toBe(false); // Cmt 15:00
  });
});
