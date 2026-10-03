export function buildRobotsTxt(siteUrl: string, base: string, indexing: boolean): string {
  if (!indexing) return 'User-agent: *\nDisallow: /\n';
  const origin = siteUrl.replace(/\/+$/, '');
  const path = ('/' + base.replace(/^\/+|\/+$/g, '') + '/').replace(/\/\/+/g, '/');
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}${path}sitemap-index.xml\n`;
}

/** Value of <meta name="robots">, or null when the tag is not needed. */
export function robotsMeta(indexing: boolean, pageNoindex = false): string | null {
  if (!indexing) return 'noindex, nofollow';
  return pageNoindex ? 'noindex' : null;
}
