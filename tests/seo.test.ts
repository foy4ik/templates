import { describe, it, expect } from 'vitest';
import { buildRobotsTxt, robotsMeta, pageTitle, buildProductLd } from '../src/lib/seo';

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

describe('pageTitle', () => {
  const sfx = ' — готовый шаблон и установка под ключ';
  it('matches the example from the brief', () => {
    expect(pageTitle({ title: 'Бот записи клиентов', category: 'bot' })).toBe('Telegram-бот записи клиентов' + sfx);
  });
  it.each([
    ['Бот-квиз для сбора заявок', 'bot', 'Telegram-бот-квиз для сбора заявок'],
    ['ИИ-консультант по базе знаний', 'bot', 'Telegram-бот: ИИ-консультант по базе знаний'],
    ['Мини-апп магазин', 'miniapp', 'Telegram мини-апп магазин'],
    ['Лендинг мастера или эксперта', 'site', 'Лендинг мастера или эксперта'],
    ['Парсер Авито с уведомлениями', 'parser', 'Парсер Авито с уведомлениями'],
  ])('builds for %s', (title, category, head) => {
    expect(pageTitle({ title, category })).toBe(head + sfx);
  });
});

describe('product ld', () => {
  const opts = {
    name: 'Бот', description: 'Описание', image: 'https://x/og.png', url: 'https://x/t/',
    priceSource: 2990, priceTurnkey: 15000,
  };
  it('has two offers with RUB prices for ready', () => {
    const ld: any = buildProductLd({ ...opts, status: 'ready' });
    expect(ld['@type']).toBe('Product');
    expect(ld.offers).toHaveLength(2);
    expect(ld.offers.map((o: any) => o.price)).toEqual(['2990', '15000']);
    expect(ld.offers.every((o: any) => o.priceCurrency === 'RUB')).toBe(true);
  });
  it('is null for soon, even when prices are present', () => {
    expect(buildProductLd({ ...opts, status: 'soon' })).toBeNull();
  });
  it('is null for ready without prices', () => {
    expect(buildProductLd({ ...opts, status: 'ready', priceSource: undefined })).toBeNull();
  });
});
