/**
 * The item autocomplete matcher — the most-used interaction in the app.
 *
 * Rules (see the brief):
 * - Tokenise the query and each item name on whitespace, lowercase both.
 * - An item matches if EVERY query token is a prefix of AT LEAST ONE token in
 *   the item name. Order-independent.
 * - Ranking, best first:
 *     1. exact full-name match
 *     2. full name starts with the whole query string
 *     3. all query tokens prefix-match name tokens (the general case)
 *     4. fallback: the query appears as a substring anywhere in the name
 *   Within a tier, sort by sortOrder then name.
 * - Inactive items are excluded.
 *
 * Deliberately hand-written: no regex built from user input, no fuzzy library.
 */

export interface MatchableItem {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const MATCH_TIER = { EXACT: 0, PREFIX: 1, ALL_TOKENS: 2, SUBSTRING: 3, NONE: 4 } as const;

function tokenise(value: string): string[] {
  return value.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function everyQueryTokenPrefixesAName(
  queryTokens: readonly string[],
  nameTokens: readonly string[],
): boolean {
  return queryTokens.every((queryToken) =>
    nameTokens.some((nameToken) => nameToken.startsWith(queryToken)),
  );
}

function tierFor(normalisedQuery: string, queryTokens: readonly string[], name: string): number {
  const normalisedName = name.toLowerCase().trim();
  if (normalisedName === normalisedQuery) return MATCH_TIER.EXACT;
  if (normalisedName.startsWith(normalisedQuery)) return MATCH_TIER.PREFIX;
  if (everyQueryTokenPrefixesAName(queryTokens, tokenise(name))) return MATCH_TIER.ALL_TOKENS;
  if (normalisedName.includes(normalisedQuery)) return MATCH_TIER.SUBSTRING;
  return MATCH_TIER.NONE;
}

function bySortOrderThenName(a: MatchableItem, b: MatchableItem): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name);
}

/**
 * Filters `items` to those matching `query` and returns them ranked best-first.
 * An empty query returns all active items in catalog order.
 */
export function matchItems<T extends MatchableItem>(query: string, items: readonly T[]): T[] {
  const active = items.filter((item) => item.isActive);
  const normalisedQuery = query.toLowerCase().trim();
  if (normalisedQuery === '') {
    return [...active].sort(bySortOrderThenName);
  }

  const queryTokens = tokenise(query);
  const ranked: Array<{ item: T; tier: number }> = [];
  for (const item of active) {
    const tier = tierFor(normalisedQuery, queryTokens, item.name);
    if (tier !== MATCH_TIER.NONE) {
      ranked.push({ item, tier });
    }
  }

  ranked.sort((a, b) =>
    a.tier !== b.tier ? a.tier - b.tier : bySortOrderThenName(a.item, b.item),
  );
  return ranked.map((entry) => entry.item);
}
