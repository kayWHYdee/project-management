import { describe, expect, it } from 'vitest';
import { createUserRequestSchema, updateUserRequestSchema } from './user';

describe('createUserRequestSchema', () => {
  it('accepts a valid new user and normalises the email', () => {
    const parsed = createUserRequestSchema.parse({
      name: '  Asha  ',
      email: 'ASHA@Example.com',
      password: 'secret12',
      role: 'EDITOR',
    });
    expect(parsed.name).toBe('Asha');
    expect(parsed.email).toBe('asha@example.com');
  });

  it('rejects a short password or unknown role', () => {
    expect(
      createUserRequestSchema.safeParse({
        name: 'A',
        email: 'a@b.com',
        password: 'short',
        role: 'EDITOR',
      }).success,
    ).toBe(false);
    expect(
      createUserRequestSchema.safeParse({
        name: 'A',
        email: 'a@b.com',
        password: 'longenough',
        role: 'SUPERUSER',
      }).success,
    ).toBe(false);
  });
});

describe('updateUserRequestSchema', () => {
  it('requires at least one field', () => {
    expect(updateUserRequestSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a single-field update', () => {
    expect(updateUserRequestSchema.safeParse({ isActive: false }).success).toBe(true);
    expect(updateUserRequestSchema.safeParse({ role: 'VIEWER' }).success).toBe(true);
  });
});
