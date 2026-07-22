import { z } from 'zod';

/**
 * Money is represented everywhere as a decimal *string*, never a JS number.
 * Prisma serialises `Decimal` columns to JSON strings; keeping the wire format
 * a validated string means a value can never silently lose precision by passing
 * through a float. All arithmetic is done on scaled BigInts.
 */
export type MoneyString = string & { readonly __brand: 'MoneyString' };
export type QuantityString = string & { readonly __brand: 'QuantityString' };

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Build a Zod schema for a fixed-precision decimal string.
 *
 * @param maxIntegerDigits total integer digits allowed (matches Prisma precision - scale)
 * @param scale maximum fractional digits allowed (matches Prisma scale)
 */
export function decimalStringSchema(maxIntegerDigits: number, scale: number) {
  return z
    .string()
    .trim()
    .refine((v) => DECIMAL_PATTERN.test(v), { message: 'Must be a decimal number' })
    .refine(
      (v) => {
        const [, fraction] = v.replace('-', '').split('.');
        return (fraction?.length ?? 0) <= scale;
      },
      { message: `At most ${scale} decimal place(s) allowed` },
    )
    .refine(
      (v) => {
        const integer = v.replace('-', '').split('.')[0] ?? '';
        return integer.replace(/^0+(?=\d)/, '').length <= maxIntegerDigits;
      },
      { message: `At most ${maxIntegerDigits} digit(s) before the decimal point` },
    );
}

/** Decimal(14, 2) — used for all money fields. */
export const moneySchema = decimalStringSchema(12, 2).transform((v) => v as MoneyString);

/** Decimal(12, 3) — used for entry quantities. */
export const quantitySchema = decimalStringSchema(9, 3).transform((v) => v as QuantityString);

function parseToScaled(value: string, scale: number): bigint {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid decimal string: ${value}`);
  }
  const [, sign, integer, fractionRaw = ''] = match;
  if (fractionRaw.length > scale) {
    throw new Error(`Too many decimal places in ${value} for scale ${scale}`);
  }
  const fraction = fractionRaw.padEnd(scale, '0');
  const magnitude = BigInt(`${integer}${fraction}`);
  return sign === '-' ? -magnitude : magnitude;
}

function roundScaled(value: bigint, fromScale: number, toScale: number): bigint {
  if (toScale >= fromScale) {
    return value * 10n ** BigInt(toScale - fromScale);
  }
  const divisor = 10n ** BigInt(fromScale - toScale);
  const half = divisor / 2n;
  return value >= 0n ? (value + half) / divisor : -((-value + half) / divisor);
}

function formatScaled(value: bigint, scale: number): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(scale + 1, '0');
  const integer = digits.slice(0, digits.length - scale);
  const fraction = scale > 0 ? `.${digits.slice(digits.length - scale)}` : '';
  return `${negative ? '-' : ''}${integer}${fraction}`;
}

/** Sum a list of money strings with no floating-point error. */
export function sumMoney(values: readonly string[]): MoneyString {
  const total = values.reduce((acc, v) => acc + parseToScaled(v, 2), 0n);
  return formatScaled(total, 2) as MoneyString;
}

/** Sum a list of quantity strings (3 decimals) with no floating-point error. */
export function sumQuantity(values: readonly string[]): QuantityString {
  const total = values.reduce((acc, v) => acc + parseToScaled(v, 3), 0n);
  return formatScaled(total, 3) as QuantityString;
}

/** Subtract b from a (money, 2 decimals). Used for budget remaining. */
export function subtractMoney(a: string, b: string): MoneyString {
  return formatScaled(parseToScaled(a, 2) - parseToScaled(b, 2), 2) as MoneyString;
}

/**
 * Amount = quantity * rate, rounded half-up to 2 decimal places.
 * Quantity carries 3 decimals and rate 2, so the product is exact at 5 decimals
 * before rounding.
 */
export function computeAmount(quantity: string, rate: string): MoneyString {
  const product = parseToScaled(quantity, 3) * parseToScaled(rate, 2);
  return formatScaled(roundScaled(product, 5, 2), 2) as MoneyString;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a money string for display as INR (en-IN). Display only. */
export function formatInr(value: string): string {
  return inrFormatter.format(Number(parseToScaled(value, 2)) / 100);
}
