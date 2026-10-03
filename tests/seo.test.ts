import { describe, it, expect } from 'vitest';
import { buildRobotsTxt, robotsMeta } from '../src/lib/seo';

describe('robots.txt', () => {
  it('disallows everything while indexing is off', () => {
    expect(buildRobotsTxt('https://foy4ik.github.io', '/templates/', false)).toBe('User-agent: *\nDisallow: /\n');
  });
  it('builds with subpath base when indexing is on', () => {
    expect(buildRobotsTxt('https://foy4ik.github.io', '/templates/', true)).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://foy4ik.github.io/templates/sitemap-index.xml\n',
    );
  });
  it('builds with root base when indexing is on', () => {
    expect(buildRobotsTxt('https://example.ru/', '/', true)).toContain(
      'Sitemap: https://example.ru/sitemap-index.xml',
    );
  });
});

describe('robotsMeta', () => {
  it('is noindex, nofollow on every page while indexing is off', () => {
    expect(robotsMeta(false)).toBe('noindex, nofollow');
    expect(robotsMeta(false, true)).toBe('noindex, nofollow');
  });
  it('is absent when indexing is on and the page is normal', () => {
    expect(robotsMeta(true)).toBeNull();
  });
  it('is noindex for a page that opts out when indexing is on', () => {
    expect(robotsMeta(true, true)).toBe('noindex');
  });
});
