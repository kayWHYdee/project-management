import { describe, expect, it } from 'vitest';
import { changePasswordRequestSchema, loginRequestSchema, passwordSchema } from './auth';

describe('loginRequestSchema', () => {
  it('lowercases and trims the email', () => {
    const parsed = loginRequestSchema.parse({ email: '  Owner@Example.COM ', password: 'x' });
    expect(parsed.email).toBe('owner@example.com');
  });

  it('rejects an invalid email or empty password', () => {
    expect(loginRequestSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
    expect(loginRequestSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('enforces the minimum length', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('longenough').success).toBe(true);
  });
});

describe('changePasswordRequestSchema', () => {
  it('requires the new password to differ from the current one', () => {
    const result = changePasswordRequestSchema.safeParse({
      currentPassword: 'samepass1',
      newPassword: 'samepass1',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid change', () => {
    const result = changePasswordRequestSchema.safeParse({
      currentPassword: 'oldpass12',
      newPassword: 'newpass12',
    });
    expect(result.success).toBe(true);
  });
});
