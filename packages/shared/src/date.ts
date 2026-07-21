import { z } from 'zod';

/**
 * Calendar dates (Prisma `@db.Date`: sentOn, startDate, spentOn) are represented
 * end-to-end as a `YYYY-MM-DD` string, never a `Date` object with a timezone.
 * This is deliberate: a Date at UTC-midnight shifts by a day when rendered in a
 * non-UTC zone, which would silently move an entry's "sent on" date. A plain
 * ISO date string cannot drift.
 */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [yearPart, monthPart, dayPart] = value.split('-');
  if (!yearPart || !monthPart || !dayPart) return false;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Round-trip through UTC to reject impossible dates like 2026-02-30.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export const isoDateSchema = z
  .string()
  .refine(isRealCalendarDate, { message: 'Must be a valid YYYY-MM-DD date' })
  .transform((v) => v as IsoDate);

export function assertIsoDate(value: string): IsoDate {
  const parsed = isoDateSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return parsed.data;
}

/**
 * Format a `Date` as a calendar date in a specific IANA time zone.
 * `en-CA` yields `YYYY-MM-DD`, so this reads the wall-clock date in that zone
 * without any UTC offset surprises.
 */
export function formatIsoDate(date: Date, timeZone: string): IsoDate {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return assertIsoDate(formatted);
}

/** Today's calendar date in the given time zone (defaults to Asia/Kolkata). */
export function todayIsoDate(timeZone = 'Asia/Kolkata'): IsoDate {
  return formatIsoDate(new Date(), timeZone);
}

/**
 * Convert an ISO date string into a JS `Date` at UTC midnight, for handing to
 * Prisma `@db.Date` columns. Prisma stores only the date part; anchoring at UTC
 * midnight keeps that date stable regardless of the server's local zone.
 */
export function isoDateToUtcDate(value: string): Date {
  const iso = assertIsoDate(value);
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Inverse of {@link isoDateToUtcDate}: read a Prisma date back as `YYYY-MM-DD`. */
export function utcDateToIsoDate(date: Date): IsoDate {
  return formatIsoDate(date, 'UTC');
}
