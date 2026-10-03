import { describe, it, expect, vi } from 'vitest';
import { copyText } from '../src/lib/clipboard';

describe('copyText', () => {
  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const legacy = vi.fn();
    expect(await copyText('hi', { writeText, legacy })).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
    expect(legacy).not.toHaveBeenCalled();
  });
  it('falls back to the legacy copy when the API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const legacy = vi.fn().mockReturnValue(true);
    expect(await copyText('hi', { writeText, legacy })).toBe(true);
    expect(legacy).toHaveBeenCalledWith('hi');
  });
  it('falls back when the API is missing', async () => {
    const legacy = vi.fn().mockReturnValue(true);
    expect(await copyText('hi', { writeText: undefined, legacy })).toBe(true);
  });
  it('returns false when nothing works, without throwing', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const legacy = vi.fn().mockImplementation(() => {
      throw new Error('nope');
    });
    expect(await copyText('hi', { writeText, legacy })).toBe(false);
  });
});
