import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('quotes every field and escapes quotes + commas', () => {
    const csv = toCsv(
      ['Project', 'Amount'],
      [
        ['Riverside "Pool"', '1,000.00'],
        ['Plain', '50.00'],
      ],
    );
    expect(csv).toBe('"Project","Amount"\r\n"Riverside ""Pool""","1,000.00"\r\n"Plain","50.00"');
  });

  it('handles an empty row set (headers only)', () => {
    expect(toCsv(['A', 'B'], [])).toBe('"A","B"');
  });
});
