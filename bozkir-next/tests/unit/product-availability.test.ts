import { describe, expect, it } from 'vitest';
import { parseAvailabilityStatus, AVAILABILITY_STATUSES } from '@/lib/product-availability';

describe('product availability', () => {
  it('accepts known statuses', () => {
    for (const s of AVAILABILITY_STATUSES) {
      expect(parseAvailabilityStatus(s)).toBe(s);
    }
  });

  it('returns undefined for empty/unknown', () => {
    expect(parseAvailabilityStatus('')).toBeUndefined();
    expect(parseAvailabilityStatus('   ')).toBeUndefined();
    expect(parseAvailabilityStatus(null)).toBeUndefined();
    expect(parseAvailabilityStatus(undefined)).toBeUndefined();
    expect(parseAvailabilityStatus('unknown')).toBeUndefined();
  });

  it('trims input', () => {
    expect(parseAvailabilityStatus(' in_stock ')).toBe('in_stock');
  });
});
