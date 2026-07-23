import { describe, expect, it } from 'vitest';
import { summariseAnalysisRows } from './analysis';

describe('summariseAnalysisRows', () => {
  it('sums quantity + value and counts distinct projects', () => {
    const summary = summariseAnalysisRows([
      { projectId: 'p1', quantity: '2.000', amount: '100.00' },
      { projectId: 'p1', quantity: '3.000', amount: '150.00' },
      { projectId: 'p2', quantity: '1.000', amount: null },
    ]);
    expect(summary.totalQuantity).toBe('6.000');
    expect(summary.projectCount).toBe(2);
    expect(summary.totalValue).toBe('250.00'); // null amount excluded
  });

  it('is all-zero for no rows', () => {
    expect(summariseAnalysisRows([])).toEqual({
      totalQuantity: '0.000',
      projectCount: 0,
      totalValue: '0.00',
    });
  });
});
