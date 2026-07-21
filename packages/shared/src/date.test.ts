import { describe, expect, it } from 'vitest';
import {
  assertIsoDate,
  formatIsoDate,
  isoDateSchema,
  isoDateToUtcDate,
  utcDateToIsoDate,
} from './date';

describe('isoDateSchema', () => {
  it('accepts valid calendar dates', () => {
    expect(isoDateSchema.parse('2026-07-21')).toBe('2026-07-21');
  });

  it('rejects malformed or impossible dates', () => {
    expect(isoDateSchema.safeParse('2026-13-01').success).toBe(false);
    expect(isoDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(isoDateSchema.safeParse('21-07-2026').success).toBe(false);
    expect(isoDateSchema.safeParse('2026-7-1').success).toBe(false);
  });
});

describe('timezone stability', () => {
  it('does not shift a date when round-tripping through Prisma-style UTC dates', () => {
    const iso = assertIsoDate('2026-07-21');
    const utc = isoDateToUtcDate(iso);
    expect(utc.toISOString()).toBe('2026-07-21T00:00:00.000Z');
    expect(utcDateToIsoDate(utc)).toBe('2026-07-21');
  });

  it('reads the wall-clock date in Asia/Kolkata correctly near UTC midnight', () => {
    // 2026-07-21 20:30 UTC is 2026-07-22 02:00 IST -> calendar date must be the 22nd.
    const instant = new Date('2026-07-21T20:30:00.000Z');
    expect(formatIsoDate(instant, 'Asia/Kolkata')).toBe('2026-07-22');
    expect(formatIsoDate(instant, 'UTC')).toBe('2026-07-21');
  });
});
