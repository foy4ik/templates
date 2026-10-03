import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { buildTemplateSchema } from '../src/lib/schema';

const schema = buildTemplateSchema(z.string());

const base = {
  title: 'Бот записи клиентов',
  category: 'bot',
  audience: 'Салоны',
  short: 'Запись онлайн',
  features: ['Услуги'],
  order: 1,
};
const faq = Array.from({ length: 4 }, (_, i) => ({ q: `Вопрос ${i}`, a: 'Ответ' }));
const ready = {
  ...base,
  status: 'ready',
  demo_url: 'https://t.me/demo_bot',
  price_source: 2990,
  price_turnkey: 15000,
  turnkey_days: 5,
  stack: 'Python, aiogram 3',
  requirements: ['Сервер'],
  faq,
};

describe('template schema', () => {
  it('accepts a complete ready template', () => {
    expect(schema.safeParse(ready).success).toBe(true);
  });
  it.each(['demo_url', 'price_source', 'price_turnkey', 'turnkey_days', 'stack', 'requirements', 'faq'])(
    'rejects ready without %s',
    (field) => {
      const { [field]: _omit, ...rest } = ready as Record<string, unknown>;
      const r = schema.safeParse(rest);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues.some((i) => i.path.includes(field))).toBe(true);
    },
  );
  it('rejects ready with faq outside 4-6', () => {
    expect(schema.safeParse({ ...ready, faq: faq.slice(0, 3) }).success).toBe(false);
    expect(schema.safeParse({ ...ready, faq: [...faq, ...faq] }).success).toBe(false);
  });
  it('accepts soon without optional fields, and with hidden prices', () => {
    expect(schema.safeParse({ ...base, status: 'soon' }).success).toBe(true);
    expect(
      schema.safeParse({ ...base, status: 'soon', price_source: 1490, price_turnkey: 7000, turnkey_days: 3 }).success,
    ).toBe(true);
  });
  it('rejects soon with demo_url', () => {
    expect(schema.safeParse({ ...base, status: 'soon', demo_url: 'https://t.me/x' }).success).toBe(false);
  });
  it('rejects unknown category and non-numeric price', () => {
    expect(schema.safeParse({ ...ready, category: 'game' }).success).toBe(false);
    expect(schema.safeParse({ ...ready, price_source: '2 990' }).success).toBe(false);
  });
});
