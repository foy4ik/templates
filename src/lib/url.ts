import { siteConfig } from '../../site.config';

export function url(path = ''): string {
  const base = siteConfig.base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return p ? `${base}/${p}` : `${base}/`;
}

export function absoluteUrl(path = ''): string {
  return siteConfig.siteUrl.replace(/\/+$/, '') + url(path);
}
