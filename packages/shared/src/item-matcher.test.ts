import { describe, expect, it } from 'vitest';
import { matchItems, type MatchableItem } from './item-matcher';

interface TestItem extends MatchableItem {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const item = (name: string, sortOrder: number, isActive = true): TestItem => ({
  name,
  sortOrder,
  isActive,
});

// Names + sort orders mirror a slice of the seed catalog.
const CATALOG: TestItem[] = [
  item('Pump', 60),
  item('Sewage Pump', 70),
  item('Filter', 90),
  item('Pool Pump', 160),
  item('Trolley Pump', 210),
  item('Pump Spares', 230),
  item('Open Well Pump', 260),
  item('Vertical Pump', 280),
];

const names = (query: string, items: TestItem[] = CATALOG) =>
  matchItems(query, items).map((i) => i.name);

describe('matchItems — brief examples', () => {
  it('`pump` matches the whole pump family', () => {
    expect(new Set(names('pump'))).toEqual(
      new Set([
        'Pump',
        'Sewage Pump',
        'Pool Pump',
        'Trolley Pump',
        'Open Well Pump',
        'Vertical Pump',
        'Pump Spares',
      ]),
    );
  });

  it('`pump open well` matches only Open Well Pump (order-independent)', () => {
    expect(names('pump open well')).toEqual(['Open Well Pump']);
  });

  it('`well pu` matches Open Well Pump', () => {
    expect(names('well pu')).toEqual(['Open Well Pump']);
  });

  it('is case-insensitive: `PUMP` equals `pump`', () => {
    expect(names('PUMP')).toEqual(names('pump'));
  });
});

describe('matchItems — ranking', () => {
  it('orders exact > startsWith > all-tokens, then by sortOrder', () => {
    // Pump (exact) → Pump Spares (name startsWith "pump") → the rest by sortOrder.
    expect(names('pump')).toEqual([
      'Pump',
      'Pump Spares',
      'Sewage Pump',
      'Pool Pump',
      'Trolley Pump',
      'Open Well Pump',
      'Vertical Pump',
    ]);
  });

  it('falls back to a substring match when no token is a prefix', () => {
    // No token starts with "ell", but "Open Well Pump" contains it.
    expect(names('ell')).toEqual(['Open Well Pump']);
  });
});

describe('matchItems — filtering', () => {
  it('excludes inactive items even when they would match', () => {
    const withInactive = [...CATALOG, item('Pumphouse', 5, false)];
    expect(names('pump', withInactive)).not.toContain('Pumphouse');
  });

  it('returns all active items in catalog order for an empty query', () => {
    expect(names('   ')).toEqual([
      'Pump',
      'Sewage Pump',
      'Filter',
      'Pool Pump',
      'Trolley Pump',
      'Pump Spares',
      'Open Well Pump',
      'Vertical Pump',
    ]);
  });

  it('returns nothing when there is no match', () => {
    expect(names('xyz')).toEqual([]);
  });
});
