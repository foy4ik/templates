import { describe, it, expect } from 'vitest';
import { sortTemplates, getRelated, displayPrice, categoryLabel } from '../src/lib/templates';

const mk = (slug: string, status: 'ready' | 'soon', category: string, order: number, price?: number) =>
  ({ slug, data: { status, category, order, price_source: price } as any });

const items = [
  mk('a', 'soon', 'bot', 1, 1490),
  mk('b', 'ready', 'bot', 3, 2990),
  mk('c', 'ready', 'miniapp', 2, 4990),
  mk('d', 'soon', 'site', 2),
];

describe('catalog logic', () => {
  it('puts ready before soon, then by order', () => {
    expect(sortTemplates(items).map((i) => i.slug)).toEqual(['c', 'b', 'a', 'd']);
  });
  it('does not mutate the input', () => {
    const copy = [...items];
    sortTemplates(items);
    expect(items).toEqual(copy);
  });
  it('returns related of same category without current, up to limit', () => {
    expect(getRelated(items, items[1]).map((i) => i.slug)).toEqual(['a']);
  });
  it('returns [] when no siblings exist', () => {
    expect(getRelated(items, items[3])).toEqual([]);
  });
  it('shows price only for ready', () => {
    expect(displayPrice(items[1].data)).toBe(2990);
    expect(displayPrice(items[0].data)).toBeNull();
  });
  it('maps category labels', () => {
    expect(categoryLabel('miniapp')).toBe('Mini App');
  });
});
