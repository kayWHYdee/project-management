import { describe, expect, it } from 'vitest';
import { createClientRequestSchema, updateClientRequestSchema } from './client';

describe('createClientRequestSchema', () => {
  it('requires a name and blanks empty optional fields to undefined', () => {
    const parsed = createClientRequestSchema.parse({
      name: 'Acme Resorts',
      contact: '',
      phone: '',
    });
    expect(parsed.name).toBe('Acme Resorts');
    expect(parsed.contact).toBeUndefined();
    expect(parsed.phone).toBeUndefined();
  });

  it('rejects an empty name', () => {
    expect(createClientRequestSchema.safeParse({ name: '   ' }).success).toBe(false);
  });
});

describe('updateClientRequestSchema', () => {
  it('requires at least one field', () => {
    expect(updateClientRequestSchema.safeParse({}).success).toBe(false);
    expect(updateClientRequestSchema.safeParse({ name: 'New name' }).success).toBe(true);
  });
});
