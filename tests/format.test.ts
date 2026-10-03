import { describe, it, expect } from 'vitest';
import { formatPrice } from '../src/lib/format';

describe('formatPrice', () => {
  it('groups thousands with nbsp by default', () => {
    expect(formatPrice(2990)).toBe('2\u00a0990\u00a0₽');
    expect(formatPrice(15000)).toBe('15\u00a0000\u00a0₽');
    expect(formatPrice(990)).toBe('990\u00a0₽');
  });
  it('can use plain spaces (for copied text)', () => {
    expect(formatPrice(2990, { nbsp: false })).toBe('2 990 ₽');
  });
});
