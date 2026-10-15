export interface LatLng {
  lat: number;
  lng: number;
}

function isFiniteCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

/**
 * Koordinat metnini çözümler: ondalık (`36.250556,36.181472` / boşluklu) **veya**
 * DMS (`36°15'02.0"N 36°10'53.3"E`, `° ' "` ya da boşluklu, N/S/E/W) kabul eder.
 * Geçersiz girdide `null` döner.
 */
export function parseCoords(input: string | null | undefined): LatLng | null {
  const s = (input ?? '').trim();
  if (!s) return null;

  // DMS: her parça "derece [dakika [saniye]] yön".
  const dms =
    /(\d+(?:[.,]\d+)?)\s*(?:°|d|\s)\s*(?:(\d+(?:[.,]\d+)?)\s*(?:['′]\s*)?)?(?:(\d+(?:[.,]\d+)?)\s*(?:["″]\s*)?)?([NSEW])/gi;
  const parts: { value: number; dir: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = dms.exec(s))) {
    const deg = parseFloat(m[1]!.replace(',', '.'));
    const min = m[2] ? parseFloat(m[2]!.replace(',', '.')) : 0;
    const sec = m[3] ? parseFloat(m[3]!.replace(',', '.')) : 0;
    let value = deg + min / 60 + sec / 3600;
    const dir = (m[4] ?? '').toUpperCase();
    if (dir === 'S' || dir === 'W') value = -value;
    parts.push({ value, dir });
  }
  if (parts.length >= 2) {
    const latPart = parts.find((p) => p.dir === 'N' || p.dir === 'S') ?? parts[0]!;
    const lngPart = parts.find((p) => p.dir === 'E' || p.dir === 'W') ?? parts[1]!;
    if (isFiniteCoord(latPart.value, lngPart.value)) {
      return { lat: latPart.value, lng: lngPart.value };
    }
  }

  // Ondalık: "lat,lng" veya "lat lng".
  const nums = s.match(/-?\d+(?:\.\d+)?/g);
  if (nums && nums.length >= 2) {
    const lat = parseFloat(nums[0]!);
    const lng = parseFloat(nums[1]!);
    if (isFiniteCoord(lat, lng)) return { lat, lng };
  }

  return null;
}

/** `{lat,lng}` → en fazla 6 ondalık, gereksiz sıfırlar atılmış `"lat,lng"`. */
export function formatLatLng({ lat, lng }: LatLng): string {
  const round = (n: number) => String(Number(n.toFixed(6)));
  return `${round(lat)},${round(lng)}`;
}
