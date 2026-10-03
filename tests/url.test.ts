import { describe, it, expect, vi } from 'vitest';

async function load(base: string) {
  vi.resetModules();
  vi.doMock('../site.config', () => ({
    siteConfig: {
      siteUrl: 'https://foy4ik.github.io/',
      base,
      telegramUsername: 'foy4ik',
      portfolioUrl: 'https://foy4ik.github.io',
      metrikaId: '',
      paymentEnabled: false,
      updateMonths: 3,
    },
  }));
  return import('../src/lib/url');
}

describe('url', () => {
  it('works with subpath base', async () => {
    const { url, absoluteUrl } = await load('/templates/');
    expect(url()).toBe('/templates/');
    expect(url('catalog/')).toBe('/templates/catalog/');
    expect(url('/catalog/')).toBe('/templates/catalog/');
    expect(absoluteUrl('catalog/')).toBe('https://foy4ik.github.io/templates/catalog/');
  });
  it('works with root base (own domain)', async () => {
    const { url, absoluteUrl } = await load('/');
    expect(url()).toBe('/');
    expect(url('catalog/')).toBe('/catalog/');
    expect(absoluteUrl()).toBe('https://foy4ik.github.io/');
  });
});
