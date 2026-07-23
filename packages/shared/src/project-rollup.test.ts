import { describe, expect, it } from 'vitest';
import {
  buildFinancials,
  buildItemRollups,
  entryRollupKey,
  type RollupEntryInput,
} from './project-rollup';

describe('entryRollupKey', () => {
  it('uses the itemId, or custom:<name> for custom-named spares', () => {
    expect(entryRollupKey({ itemId: 'i1', customName: null })).toBe('i1');
    expect(entryRollupKey({ itemId: null, customName: 'Odd spare' })).toBe('custom:Odd spare');
    expect(entryRollupKey({ itemId: null, customName: null })).toBe('custom:');
  });
});

describe('buildItemRollups', () => {
  it('groups entries by key and sums quantity + value with no float drift', () => {
    const entries: RollupEntryInput[] = [
      { key: 'i1', name: 'Membrane', category: 'MEDIA', quantity: '3.000', amount: '451.50' },
      { key: 'i1', name: 'Membrane', category: 'MEDIA', quantity: '2.000', amount: '301.00' },
      { key: 'i2', name: 'Pump', category: 'MECHANICAL', quantity: '1.000', amount: '9999.99' },
    ];
    const rollups = buildItemRollups(entries);

    expect(rollups).toHaveLength(2);
    const membrane = rollups.find((r) => r.key === 'i1');
    expect(membrane?.totalQuantity).toBe('5.000');
    expect(membrane?.totalAmount).toBe('752.50');
    expect(membrane?.entryCount).toBe(2);
  });

  it('sorts by name and treats a null amount as zero', () => {
    const rollups = buildItemRollups([
      { key: 'i2', name: 'Zed', category: null, quantity: '1.000', amount: null },
      { key: 'i1', name: 'Alpha', category: null, quantity: '2.000', amount: '10.00' },
    ]);
    expect(rollups.map((r) => r.name)).toEqual(['Alpha', 'Zed']);
    expect(rollups.find((r) => r.key === 'i2')?.totalAmount).toBe('0.00');
  });
});

describe('buildFinancials', () => {
  it('computes spent, remaining and cumulative payments against a budget', () => {
    const financials = buildFinancials({
      budget: '100000.00',
      entryAmounts: ['5000.00', '2500.50'],
      expenseAmounts: ['1200.00'],
      paymentAmounts: ['30000.00', '20000.00'],
    });
    expect(financials.materialsAmount).toBe('7500.50');
    expect(financials.expensesAmount).toBe('1200.00');
    expect(financials.totalSpent).toBe('8700.50');
    expect(financials.remaining).toBe('91299.50');
    expect(financials.paymentsReceived).toBe('50000.00');
  });

  it('leaves remaining null when there is no budget and can go negative', () => {
    expect(
      buildFinancials({ budget: null, entryAmounts: [], expenseAmounts: [], paymentAmounts: [] })
        .remaining,
    ).toBe(null);
    expect(
      buildFinancials({
        budget: '100.00',
        entryAmounts: ['150.00'],
        expenseAmounts: [],
        paymentAmounts: [],
      }).remaining,
    ).toBe('-50.00');
  });
});
