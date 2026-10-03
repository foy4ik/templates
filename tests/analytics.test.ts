import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reachGoal } from '../src/lib/analytics';

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('reachGoal', () => {
  it('does nothing without counter id', () => {
    const ym = vi.fn();
    vi.stubGlobal('window', { ym });
    reachGoal('buy_source', 'booking-bot', '');
    expect(ym).not.toHaveBeenCalled();
  });
  it('does not throw when ym is missing', () => {
    vi.stubGlobal('window', {});
    expect(() => reachGoal('buy_source', 'booking-bot', '12345')).not.toThrow();
  });
  it('sends goal with template name', () => {
    const ym = vi.fn();
    vi.stubGlobal('window', { ym });
    reachGoal('buy_source', 'booking-bot', '12345');
    expect(ym).toHaveBeenCalledWith(12345, 'reachGoal', 'buy_source', { template: 'booking-bot' });
  });
});
