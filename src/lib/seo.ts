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

const TITLE_SUFFIX = ' — готовый шаблон и установка под ключ';

export function pageTitle(t: { title: string; category: string }): string {
  let head = t.title;
  if (t.category === 'bot') {
    head = t.title.startsWith('Бот') ? 'Telegram-б' + t.title.slice(1) : `Telegram-бот: ${t.title}`;
  } else if (t.category === 'miniapp' && t.title.startsWith('Мини-апп')) {
    head = 'Telegram мини-апп' + t.title.slice('Мини-апп'.length);
  }
  return head + TITLE_SUFFIX;
}

export function buildProductLd(o: {
  status: 'ready' | 'soon';
  name: string;
  description: string;
  image: string;
  url: string;
  priceSource?: number;
  priceTurnkey?: number;
}) {
  if (o.status !== 'ready' || o.priceSource === undefined || o.priceTurnkey === undefined) return null;
  const offer = (name: string, price: number) => ({
    '@type': 'Offer',
    name,
    price: String(price),
    priceCurrency: 'RUB',
    availability: 'https://schema.org/InStock',
    url: o.url,
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: o.name,
    description: o.description,
    image: o.image,
    offers: [offer('Исходники', o.priceSource), offer('Установка под ключ', o.priceTurnkey)],
  };
}
