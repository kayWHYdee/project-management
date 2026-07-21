import { describe, expect, it } from 'vitest';
import { computeAmount, formatInr, moneySchema, quantitySchema, sumMoney } from './money';

describe('computeAmount', () => {
  it('multiplies quantity by rate with 2dp half-up rounding', () => {
    expect(computeAmount('3', '150.50')).toBe('451.50');
    expect(computeAmount('2.5', '100')).toBe('250.00');
    expect(computeAmount('1.111', '3')).toBe('3.33');
    expect(computeAmount('1.333', '3')).toBe('4.00'); // 3.999 rounds half-up
  });

  it('rounds half up at the boundary', () => {
    // 0.005 * 1 = 0.005 -> 0.01
    expect(computeAmount('0.005', '1')).toBe('0.01');
    // 1.005 * 1 = 1.005 -> 1.01
    expect(computeAmount('1.005', '1')).toBe('1.01');
  });

  it('handles large in-range values without float error', () => {
    expect(computeAmount('1000.000', '999999.99')).toBe('999999990.00');
  });
});

describe('sumMoney', () => {
  it('sums without floating-point drift', () => {
    expect(sumMoney(['0.10', '0.20'])).toBe('0.30');
    expect(sumMoney(['999999999.99', '0.01'])).toBe('1000000000.00');
    expect(sumMoney([])).toBe('0.00');
  });
});

describe('moneySchema / quantitySchema', () => {
  it('accepts valid decimals', () => {
    expect(moneySchema.parse('1234.56')).toBe('1234.56');
    expect(quantitySchema.parse('1.234')).toBe('1.234');
  });

  it('rejects too many decimal places', () => {
    expect(moneySchema.safeParse('1.234').success).toBe(false);
    expect(quantitySchema.safeParse('1.2345').success).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(moneySchema.safeParse('abc').success).toBe(false);
    expect(moneySchema.safeParse('').success).toBe(false);
  });
});

describe('formatInr', () => {
  it('formats en-IN with grouping', () => {
    // Non-breaking space between symbol and number in some ICU builds; assert digits.
    expect(formatInr('100000.5')).toContain('1,00,000.50');
  });
});
