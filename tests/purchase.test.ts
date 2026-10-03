import { describe, it, expect } from 'vitest';
import { buildOrderText, buildTelegramLink, goalFor } from '../src/lib/purchase';

const t = { slug: 'booking-bot', title: 'Бот записи клиентов', priceSource: 2990, priceTurnkey: 15000 };

describe('order text', () => {
  it('source', () => {
    expect(buildOrderText(t, 'source')).toBe(
      'Здравствуйте! Хочу купить исходники шаблона «Бот записи клиентов» за 2 990 ₽',
    );
  });
  it('turnkey uses "от"', () => {
    expect(buildOrderText(t, 'turnkey')).toBe(
      'Здравствуйте! Хочу заказать установку под ключ шаблона «Бот записи клиентов» от 15 000 ₽',
    );
  });
  it('wish has no price', () => {
    expect(buildOrderText({ slug: 'x', title: 'Парсер Авито с уведомлениями' }, 'wish')).toBe(
      'Здравствуйте! Хочу этот шаблон: «Парсер Авито с уведомлениями». Когда он будет готов?',
    );
  });
  it('uses plain spaces in price', () => {
    expect(buildOrderText(t, 'source')).not.toContain('\u00a0');
  });
  it('throws a clear error when the price for the variant is missing', () => {
    expect(() => buildOrderText({ slug: 'x', title: 'X' }, 'source')).toThrow(/price/i);
  });
});

describe('telegram link', () => {
  it('encodes special characters', () => {
    const text = 'Шаблон «A&B?» 100 ₽ #1';
    const link = buildTelegramLink('foy4ik', text);
    expect(link.startsWith('https://t.me/foy4ik?text=')).toBe(true);
    expect(new URL(link).searchParams.get('text')).toBe(text);
  });
});

describe('goals', () => {
  it('maps variants', () => {
    expect(goalFor('source')).toBe('buy_source');
    expect(goalFor('turnkey')).toBe('buy_turnkey');
    expect(goalFor('wish')).toBe('want_template');
  });
});
