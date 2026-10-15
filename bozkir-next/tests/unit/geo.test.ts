import { describe, it, expect } from 'vitest';
import { parseCoords, formatLatLng } from '@/lib/geo';

describe('parseCoords', () => {
  it('ondalık "lat,lng" ve boşluklu biçimleri çözer', () => {
    expect(parseCoords('36.250556,36.181472')).toEqual({ lat: 36.250556, lng: 36.181472 });
    expect(parseCoords('36.25 36.18')).toEqual({ lat: 36.25, lng: 36.18 });
  });

  it('DMS (derece/dakika/saniye + yön) çözer', () => {
    const depot = parseCoords(`36°15'02.0"N 36°10'53.3"E`)!;
    expect(depot.lat).toBeCloseTo(36.250556, 5);
    expect(depot.lng).toBeCloseTo(36.181472, 5);

    const office = parseCoords(`36°14'19.1"N 36°10'36.5"E`)!;
    expect(office.lat).toBeCloseTo(36.238639, 5);
    expect(office.lng).toBeCloseTo(36.176806, 5);
  });

  it('S/W yönleri negatife çevirir', () => {
    const r = parseCoords(`33°52'S 151°12'W`)!;
    expect(r.lat).toBeLessThan(0);
    expect(r.lng).toBeLessThan(0);
  });

  it('geçersiz girdide null döner', () => {
    expect(parseCoords('abc')).toBeNull();
    expect(parseCoords('')).toBeNull();
    expect(parseCoords(null)).toBeNull();
    expect(parseCoords('999,999')).toBeNull();
  });
});

describe('formatLatLng', () => {
  it('en fazla 6 ondalığa yuvarlar', () => {
    expect(formatLatLng({ lat: 36.250556, lng: 36.181472 })).toBe('36.250556,36.181472');
    expect(formatLatLng({ lat: 36.25, lng: 36.18 })).toBe('36.25,36.18');
  });
});
