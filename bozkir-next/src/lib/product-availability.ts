export const AVAILABILITY_STATUSES = ['in_stock', 'on_order', 'check_availability'] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export function parseAvailabilityStatus(value: unknown): AvailabilityStatus | undefined {
  const v = String(value ?? '').trim();
  if (!v) return undefined;
  return (AVAILABILITY_STATUSES as readonly string[]).includes(v)
    ? (v as AvailabilityStatus)
    : undefined;
}
