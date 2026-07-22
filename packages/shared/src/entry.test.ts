import { describe, expect, it } from 'vitest';
import { createEntryRequestSchema } from './entry';

const base = { systemId: 's1', quantity: '3', sentOn: '2026-07-22' };

describe('createEntryRequestSchema — exactly one of item / customName', () => {
  it('accepts an item reference', () => {
    expect(createEntryRequestSchema.safeParse({ ...base, itemId: 'i1' }).success).toBe(true);
  });

  it('accepts a custom name', () => {
    expect(createEntryRequestSchema.safeParse({ ...base, customName: 'Odd spare' }).success).toBe(
      true,
    );
  });

  it('rejects both together', () => {
    expect(
      createEntryRequestSchema.safeParse({ ...base, itemId: 'i1', customName: 'x' }).success,
    ).toBe(false);
  });

  it('rejects neither', () => {
    expect(createEntryRequestSchema.safeParse({ ...base }).success).toBe(false);
  });

  it('rejects a quantity with too many decimals', () => {
    expect(
      createEntryRequestSchema.safeParse({ ...base, itemId: 'i1', quantity: '1.2345' }).success,
    ).toBe(false);
  });
});
