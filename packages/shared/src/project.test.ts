import { describe, expect, it } from 'vitest';
import { createProjectRequestSchema, updateProjectRequestSchema } from './project';

describe('createProjectRequestSchema', () => {
  it('accepts a minimal project', () => {
    const parsed = createProjectRequestSchema.parse({ clientId: 'c1', name: 'Riverside Pool' });
    expect(parsed.clientId).toBe('c1');
  });

  it('accepts a 2-decimal budget and a valid start date', () => {
    const parsed = createProjectRequestSchema.parse({
      clientId: 'c1',
      name: 'P',
      budgetValue: '250000.00',
      startDate: '2026-07-22',
    });
    expect(parsed.budgetValue).toBe('250000.00');
    expect(parsed.startDate).toBe('2026-07-22');
  });

  it('rejects a budget with more than 2 decimals and an impossible date', () => {
    expect(
      createProjectRequestSchema.safeParse({ clientId: 'c1', name: 'P', budgetValue: '100.999' })
        .success,
    ).toBe(false);
    expect(
      createProjectRequestSchema.safeParse({ clientId: 'c1', name: 'P', startDate: '2026-02-30' })
        .success,
    ).toBe(false);
  });
});

describe('updateProjectRequestSchema', () => {
  it('requires a version', () => {
    expect(updateProjectRequestSchema.safeParse({ status: 'CLOSED' }).success).toBe(false);
  });

  it('requires at least one field beyond version', () => {
    expect(updateProjectRequestSchema.safeParse({ version: 1 }).success).toBe(false);
    expect(updateProjectRequestSchema.safeParse({ version: 1, status: 'CLOSED' }).success).toBe(
      true,
    );
  });
});
