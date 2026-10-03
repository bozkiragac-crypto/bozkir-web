import { describe, it, expect } from 'vitest';
import { APP_TIME_ZONE, formatDateTime, formatDayKey, formatRelative, startOfLocalDay } from '@/lib/datetime';

describe('datetime', () => {
  it('saat dilimi Europe/Istanbul', () => {
    expect(APP_TIME_ZONE).toBe('Europe/Istanbul');
  });

  it('UTC anı Türkiye saatine çevirir (3 saat ekler)', () => {
    // 2026-10-02T10:07:00Z → 13:07 TR
    expect(formatDateTime(new Date('2026-10-02T10:07:00Z'))).toBe('2.10.2026 13:07');
  });

  it('gece yarısını UTC ile karıştırmaz', () => {
    // 2026-10-02T23:30:00Z → 03.10 02:30 (TR'de 3 Ekim)
    expect(formatDateTime(new Date('2026-10-02T23:30:00Z'))).toBe('3.10.2026 02:30');
    // 2026-10-01T22:30:00Z → 02.10 01:30 (TR'de 2 Ekim, UTC'de 1 Ekim)
    expect(formatDateTime(new Date('2026-10-01T22:30:00Z'))).toBe('2.10.2026 01:30');
  });

  it('ISO string kabul eder', () => {
    expect(formatDateTime('2026-10-02T10:07:00Z')).toBe('2.10.2026 13:07');
  });

  it('geçersiz veya boş değerde tire döner', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
    expect(formatDateTime('gecersiz')).toBe('—');
  });

  it('gün anahtarı yerel güne göre', () => {
    // UTC'de 1 Ekim, TR'de 2 Ekim
    expect(formatDayKey(new Date('2026-10-01T22:30:00Z'))).toBe('2026-10-02');
    expect(formatDayKey(new Date('2026-10-02T10:07:00Z'))).toBe('2026-10-02');
  });

  it('gün başlangıcı yerel gece yarısının doğru UTC anına çevrilir', () => {
    // TR 02.10 00:00 = 01.10 21:00Z (İstanbul UTC+3).
    expect(startOfLocalDay(new Date('2026-10-02T15:00:00Z')).toISOString()).toBe('2026-10-01T21:00:00.000Z');
    // UTC 01.10 00:30 -> TR 01.10 03:30 -> yerel gün başı 30.09 21:00Z.
    expect(startOfLocalDay(new Date('2026-10-01T00:30:00Z')).toISOString()).toBe('2026-09-30T21:00:00.000Z');
    expect(formatDayKey(startOfLocalDay(new Date('2026-10-02T15:00:00Z')))).toBe('2026-10-02');
  });

  it('göreli zaman', () => {
    const now = new Date('2026-10-02T12:00:00Z');
    expect(formatRelative(new Date('2026-10-02T11:59:30Z'), now)).toBe('az önce');
    expect(formatRelative(new Date('2026-10-02T11:30:00Z'), now)).toBe('30 dk önce');
    expect(formatRelative(new Date('2026-10-02T07:00:00Z'), now)).toBe('5 sa önce');
    expect(formatRelative(new Date('2026-09-30T12:00:00Z'), now)).toBe('2 gün önce');
  });
});