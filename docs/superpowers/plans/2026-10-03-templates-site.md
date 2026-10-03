# Сайт-витрина шаблонов: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Статический сайт-витрина 12 шаблонов на Astro с заказом через Telegram и заделом под ЮKassa.

**Architecture:** Astro (static) + Content Collections с zod-схемой; вся логика (адреса, цены, тексты заказа, SEO-разметка, robots, сортировка) вынесена в чистые функции в `src/lib/` и покрыта vitest; компоненты тонкие. Все кнопки покупки — `<a|button data-purchase>`, их обрабатывает один скрипт, вызывающий `startPurchase`.

**Tech Stack:** Astro, TypeScript, zod (из Astro), `@astrojs/sitemap`, vitest, обычный CSS, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-03-templates-site-design.md` (решения: `docs/decisions.md`).

## Global Constraints

- Адрес: `https://foy4ik.github.io/templates/`; `siteUrl` и `base` задаются ТОЛЬКО в `site.config.ts`.
- Telegram-username (`foy4ik`) только в `site.config.ts`, нигде не хардкодится.
- Тёмная и светлая темы по `prefers-color-scheme`, тёмная по умолчанию; токены, шрифты (Inter, JetBrains Mono), радиусы карточек 16px и кнопок 10px — из портфолио (`docs/decisions.md`). Новый стиль не придумывать.
- Только обычный CSS с переменными (без Tailwind); галерея на `<dialog>` + `scroll-snap` без библиотек.
- Цены — числа в frontmatter; форматирует только `src/lib/format.ts`. Для `soon` цены и срок на сайте не выводятся.
- Все кнопки покупки идут через `startPurchase(template, variant)`.
- Тексты шаблонов — короткие осмысленные заглушки, не lorem ipsum. Оферта и политика: заголовок + «текст будет добавлен».
- Метрика подключается только при непустом `metrikaId`. `/thanks/` с `noindex`, вне sitemap.
- `robots.txt` — endpoint, не статический файл.
- Коммиты на английском, в конце: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- После каждого этапа — остановка, инструкция проверки, ожидание «ок» заказчика.
- В установленной версии Astro (на момент плана `astro@7.3.5`) API Content Collections может отличаться от известного автору: перед Task 2 прочитать docs установленной версии (`npm view astro`, `node_modules/astro/README`, docs.astro.build) и скорректировать только импорты/сигнатуры, сохранив поведение.

## Review Focus

1. `status: ready` без демо, цены, стека или с FAQ вне 4–6 → сборка падает с названием файла и поля (Task 2).
2. `base: '/'` и `base: '/templates/'` дают корректные ссылки без двойных слэшей (Task 1).
3. Названия с кавычками «», `&`, `?` и пробелами в тексте заказа и в `t.me/?text=` кодируются корректно (Task 10).
4. Буфер обмена недоступен (http, старый браузер) → текст остаётся виден и выделяем в модалке (Task 11).
5. В категории меньше 3 других шаблонов (например, `site` или `parser`) → блок «Другие шаблоны» показывает сколько есть и не падает при нуле (Task 4).
6. У `soon` никогда не выводятся цена, срок и demo; в каталоге они стоят после готовых (Tasks 4, 6, 7).

## Структура файлов

```
site.config.ts                    # единственное место настроек
astro.config.mjs                  # читает site/base из site.config.ts, sitemap
vitest.config.ts  package.json  tsconfig.json
.github/workflows/deploy.yml
public/favicon.svg  public/og/{bot,miniapp,site,parser}.png   # PNG для Open Graph
public/placeholders/{bot,miniapp,site,parser}.svg              # обложки-заглушки
src/content.config.ts             # подключает схему
src/lib/schema.ts                 # zod-схема + правила ready/soon
src/lib/url.ts                    # url(), absoluteUrl()
src/lib/format.ts                 # formatPrice()
src/lib/templates.ts              # sortTemplates(), getRelated(), displayPrice(), CATEGORIES
src/lib/purchase.ts               # buildOrderText(), buildTelegramLink(), startPurchase()
src/lib/analytics.ts              # reachGoal()
src/lib/seo.ts                    # buildProductLd(), buildRobotsTxt(), pageTitle()
src/content/templates/*.md        # 12 шаблонов
src/assets/shots/<slug>/          # скриншоты (пока пусто)
src/styles/{tokens,base,components}.css
src/layouts/Base.astro
src/components/*.astro
src/scripts/{purchase-init,catalog-filter}.ts
src/pages/{index,catalog,custom,offer,privacy,thanks}.astro
src/pages/templates/[slug].astro
src/pages/robots.txt.ts
tests/*.test.ts
README.md
```

---

# ЭТАП 1. Каркас

### Task 1: Проект, конфиг, url/format, токены

**Files:**
- Create: `package.json`, `tsconfig.json`, `astro.config.mjs`, `vitest.config.ts`, `.gitignore`, `site.config.ts`, `src/lib/url.ts`, `src/lib/format.ts`, `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`, `src/pages/index.astro`
- Test: `tests/url.test.ts`, `tests/format.test.ts`

**Interfaces:**
- Produces: `siteConfig` (ключи: `siteUrl, base, telegramUsername, portfolioUrl, metrikaId, paymentEnabled, updateMonths`); `url(path?: string): string`; `absoluteUrl(path?: string): string`; `formatPrice(n: number, opts?: {nbsp?: boolean}): string`.

- [ ] **Step 1: Создать проект**

```bash
cd "D:/main/работа/сайт готовых шаблонов"
npm init -y
npm install astro @astrojs/sitemap
npm install -D vitest typescript
```
В `package.json` задать `"name": "templates"`, `"type": "module"`, scripts: `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"`, `"test": "vitest run"`, `"check": "astro check"`.

`.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.env`.

`tsconfig.json`: `{ "extends": "astro/tsconfigs/strict", "include": [".astro/types.d.ts", "**/*"], "exclude": ["dist"] }`.

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

- [ ] **Step 2: Написать падающие тесты**

`tests/url.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';

async function load(base: string) {
  vi.resetModules();
  vi.doMock('../site.config', () => ({
    siteConfig: { siteUrl: 'https://foy4ik.github.io/', base, telegramUsername: 'foy4ik',
      portfolioUrl: 'https://foy4ik.github.io', metrikaId: '', paymentEnabled: false, updateMonths: 3 },
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
```

`tests/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from '../src/lib/format';

describe('formatPrice', () => {
  it('groups thousands with nbsp by default', () => {
    expect(formatPrice(2990)).toBe('2\u00a0990\u00a0₽');
    expect(formatPrice(15000)).toBe('15\u00a0000\u00a0₽');
    expect(formatPrice(990)).toBe('990\u00a0₽');
  });
  it('can use plain spaces (for copied text)', () => {
    expect(formatPrice(2990, { nbsp: false })).toBe('2 990 ₽');
  });
});
```

- [ ] **Step 3: Запустить, убедиться что падают**

Run: `npx vitest run`
Expected: FAIL (modules not found).

- [ ] **Step 4: Реализация**

`site.config.ts`:
```ts
export const siteConfig = {
  siteUrl: 'https://foy4ik.github.io',
  base: '/templates/',
  telegramUsername: 'foy4ik',
  portfolioUrl: 'https://foy4ik.github.io',
  metrikaId: '',
  paymentEnabled: false,
  updateMonths: 3,
} as const;
```

`src/lib/url.ts`:
```ts
import { siteConfig } from '../../site.config';

export function url(path = ''): string {
  const base = siteConfig.base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return p ? `${base}/${p}` : `${base}/`;
}

export function absoluteUrl(path = ''): string {
  return siteConfig.siteUrl.replace(/\/+$/, '') + url(path);
}
```

`src/lib/format.ts`:
```ts
export function formatPrice(n: number, opts: { nbsp?: boolean } = {}): string {
  const sp = opts.nbsp === false ? ' ' : '\u00a0';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sp) + sp + '₽';
}
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './site.config.ts';

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.base,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/thanks/') })],
});
```
(Если Astro не импортирует `.ts` в конфиге — переименовать конфиг в `site.config.mjs` + `.d.ts` или использовать `jiti`; изменить во всех импортах единообразно.)

- [ ] **Step 5: Запустить тесты**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Токены и базовый стиль из портфолио**

Получить полный CSS: `gh api repos/foy4ik/foy4ik.github.io/contents/index.html --jq .content | base64 -d > "$TEMP/portfolio.html"` (Git Bash). Из блока `<style>` перенести в `src/styles/tokens.css` весь `:root` для светлой темы и `@media (prefers-color-scheme: dark)` для тёмной (значения в `docs/decisions.md` — сверить и взять недостающие: тени, радиусы, ширину контейнера, брейкпоинты); в `base.css` — reset, типографика, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.card`, моно-надзаголовок, контейнер. Шрифты — `<link>` Google Fonts с `display=swap` (Inter 400–800, JetBrains Mono 400/500). Ничего своего не придумывать: если в портфолио нет стиля, использовать ближайший существующий токен.

- [ ] **Step 7: Layout и главная-заглушка**

`src/layouts/Base.astro`: `<html lang="ru">`, `<head>` (charset, viewport, `<title>{title}</title>`, description, favicon, шрифты, `import '../styles/tokens.css'`, `base.css`), `<slot/>`. `src/pages/index.astro`: `<Base title="Шаблоны"><main class="container"><p class="eyebrow">// готовые шаблоны</p><h1>Готовые боты и сайты</h1></main></Base>`.
`public/favicon.svg` — простой знак в акцентном цвете `#8b6bff`.

- [ ] **Step 8: Проверить сборку**

Run: `npm run build && npm run preview` и открыть выведенный адрес с `/templates/`.
Expected: страница открывается с тёмным фоном `#09080d` и фиолетовым акцентом; тема переключается вместе с системной.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Astro project with site config, url/format helpers and design tokens

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

### Task 2: Схема данных шаблона

**Files:**
- Create: `src/lib/schema.ts`, `src/content.config.ts`, `src/content/templates/booking-bot.md` (пробный; в Task 9 заменится финальным)
- Test: `tests/schema.test.ts`

**Interfaces:**
- Produces: `buildTemplateSchema(image: ZodTypeAny): ZodEffects`; тип `TemplateData`. Поля: `title, category ('bot'|'miniapp'|'site'|'parser'), status ('ready'|'soon'), audience, short, features: string[], demo_url?, screenshots: image[] (default []), video?, price_source?, price_turnkey?, turnkey_days?, stack?, requirements?: string[], faq?: {q,a}[], featured (default false), order: number`.

- [ ] **Step 1: Падающие тесты** (`tests/schema.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { buildTemplateSchema } from '../src/lib/schema';

const schema = buildTemplateSchema(z.string());

const base = {
  title: 'Бот записи клиентов', category: 'bot', audience: 'Салоны', short: 'Запись онлайн',
  features: ['Услуги'], order: 1,
};
const faq = Array.from({ length: 4 }, (_, i) => ({ q: `Вопрос ${i}`, a: 'Ответ' }));
const ready = {
  ...base, status: 'ready', demo_url: 'https://t.me/demo_bot', price_source: 2990,
  price_turnkey: 15000, turnkey_days: 5, stack: 'Python, aiogram 3', requirements: ['Сервер'], faq,
};

describe('template schema', () => {
  it('accepts a complete ready template', () => {
    expect(schema.safeParse(ready).success).toBe(true);
  });
  it.each(['demo_url', 'price_source', 'price_turnkey', 'turnkey_days', 'stack', 'requirements', 'faq'])(
    'rejects ready without %s', (field) => {
      const { [field]: _omit, ...rest } = ready as Record<string, unknown>;
      const r = schema.safeParse(rest);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues.some((i) => i.path.includes(field))).toBe(true);
    });
  it('rejects ready with faq outside 4-6', () => {
    expect(schema.safeParse({ ...ready, faq: faq.slice(0, 3) }).success).toBe(false);
    expect(schema.safeParse({ ...ready, faq: [...faq, ...faq] }).success).toBe(false);
  });
  it('accepts soon without optional fields, with prices that are hidden', () => {
    expect(schema.safeParse({ ...base, status: 'soon' }).success).toBe(true);
    expect(schema.safeParse({ ...base, status: 'soon', price_source: 1490, price_turnkey: 7000, turnkey_days: 3 }).success).toBe(true);
  });
  it('rejects soon with demo_url', () => {
    expect(schema.safeParse({ ...base, status: 'soon', demo_url: 'https://t.me/x' }).success).toBe(false);
  });
  it('rejects unknown category and non-numeric price', () => {
    expect(schema.safeParse({ ...ready, category: 'game' }).success).toBe(false);
    expect(schema.safeParse({ ...ready, price_source: '2 990' }).success).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/schema.test.ts` → FAIL.

- [ ] **Step 3: Реализация** `src/lib/schema.ts`

```ts
import { z } from 'astro/zod';

export const CATEGORY_IDS = ['bot', 'miniapp', 'site', 'parser'] as const;

export function buildTemplateSchema(image: z.ZodTypeAny) {
  return z
    .object({
      title: z.string().min(1),
      category: z.enum(CATEGORY_IDS),
      status: z.enum(['ready', 'soon']),
      audience: z.string().min(1),
      short: z.string().min(1),
      features: z.array(z.string().min(1)).min(1),
      demo_url: z.string().url().optional(),
      screenshots: z.array(image).default([]),
      video: z.string().url().optional(),
      price_source: z.number().int().positive().optional(),
      price_turnkey: z.number().int().positive().optional(),
      turnkey_days: z.number().int().positive().optional(),
      stack: z.string().min(1).optional(),
      requirements: z.array(z.string().min(1)).min(1).optional(),
      faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
      featured: z.boolean().default(false),
      order: z.number(),
    })
    .superRefine((d, ctx) => {
      if (d.status === 'ready') {
        for (const f of ['demo_url', 'price_source', 'price_turnkey', 'turnkey_days', 'stack', 'requirements'] as const) {
          if (d[f] === undefined) ctx.addIssue({ code: 'custom', path: [f], message: `обязательно для status: ready` });
        }
        if (!d.faq || d.faq.length < 4 || d.faq.length > 6) {
          ctx.addIssue({ code: 'custom', path: ['faq'], message: 'для status: ready нужно 4–6 вопросов' });
        }
      } else if (d.demo_url !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['demo_url'], message: 'у status: soon демо быть не должно' });
      }
    });
}

export type TemplateData = z.infer<ReturnType<typeof buildTemplateSchema>>;
```

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { buildTemplateSchema } from './lib/schema';

const templates = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/templates' }),
  schema: ({ image }) => buildTemplateSchema(image()),
});

export const collections = { templates };
```
Пробный `src/content/templates/booking-bot.md` — frontmatter по тесту `ready` + тело-описание.

- [ ] **Step 4:** `npx vitest run` → PASS; `npm run build` → успешно. Проверка падения: временно удалить `demo_url` из `booking-bot.md`, `npm run build` → ошибка с именем файла и поля `demo_url`; вернуть обратно.

- [ ] **Step 5: Commit** — `Add template content schema with ready/soon validation`

### Task 3: Деплой на GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1:** Создать workflow (официальный шаблон Astro): триггер `push` в `main` + `workflow_dispatch`; permissions `contents: read, pages: write, id-token: write`; job `build`: `actions/checkout@v4`, `actions/setup-node@v4` (node 22, cache npm), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v3` (path `dist`); job `deploy`: `environment: github-pages`, `actions/deploy-pages@v4`. Перед использованием сверить актуальные мажорные версии actions на их страницах в GitHub Marketplace.
- [ ] **Step 2:** `git add -A && git commit -m "Add GitHub Pages deploy workflow" && git push`
- [ ] **Step 3:** `gh run watch` до зелёного статуса; `gh run view --log-failed` при ошибке. Открыть `https://foy4ik.github.io/templates/`.
Expected: страница открывается. Повторный push любой правки обновляет сайт.

### ⛔ Остановка: приёмка этапа 1

Показать: ссылку на сайт, статус Actions, `npm test` (зелёный), как проверить смену темы и что `main` обновляет сайт. Ждать «ок».

---

# ЭТАП 2. Каталог и страницы

### Task 4: Логика каталога

**Files:**
- Create: `src/lib/templates.ts`
- Test: `tests/templates.test.ts`

**Interfaces:**
- Consumes: `TemplateData` (Task 2), `formatPrice`.
- Produces: `CATEGORIES: {id, label}[]` (`bot→Боты`, `miniapp→Mini App`, `site→Сайты`, `parser→Парсеры`); `categoryLabel(id)`; тип `Item = { slug: string; data: TemplateData }`; `sortTemplates(items: Item[]): Item[]` (ready раньше soon, внутри по `order`); `getRelated(items, current: Item, limit = 3): Item[]` (та же категория, без текущего, порядок как в sortTemplates); `displayPrice(data): number | null` (цена источника для ready, `null` для soon).

- [ ] **Step 1: Тесты**

```ts
import { describe, it, expect } from 'vitest';
import { sortTemplates, getRelated, displayPrice, categoryLabel } from '../src/lib/templates';

const mk = (slug: string, status: 'ready' | 'soon', category: any, order: number, price?: number) =>
  ({ slug, data: { status, category, order, price_source: price } as any });

const items = [
  mk('a', 'soon', 'bot', 1, 1490), mk('b', 'ready', 'bot', 3, 2990),
  mk('c', 'ready', 'miniapp', 2, 4990), mk('d', 'soon', 'site', 2),
];

describe('catalog logic', () => {
  it('puts ready before soon, then by order', () => {
    expect(sortTemplates(items).map((i) => i.slug)).toEqual(['c', 'b', 'a', 'd']);
  });
  it('does not mutate the input', () => {
    const copy = [...items]; sortTemplates(items); expect(items).toEqual(copy);
  });
  it('returns related of same category without current, up to limit', () => {
    expect(getRelated(items, items[1]).map((i) => i.slug)).toEqual(['a']);
  });
  it('returns [] when no siblings exist', () => {
    expect(getRelated(items, items[3])).toEqual([]);
  });
  it('shows price only for ready', () => {
    expect(displayPrice(items[1].data)).toBe(2990);
    expect(displayPrice(items[0].data)).toBeNull();
  });
  it('maps category labels', () => {
    expect(categoryLabel('miniapp')).toBe('Mini App');
  });
});
```
- [ ] **Step 2:** запустить → FAIL.
- [ ] **Step 3: Реализация**

```ts
import type { TemplateData } from './schema';

export type Item = { slug: string; data: TemplateData };

export const CATEGORIES = [
  { id: 'bot', label: 'Боты' },
  { id: 'miniapp', label: 'Mini App' },
  { id: 'site', label: 'Сайты' },
  { id: 'parser', label: 'Парсеры' },
] as const;

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function sortTemplates(items: Item[]): Item[] {
  const rank = (i: Item) => (i.data.status === 'ready' ? 0 : 1);
  return [...items].sort((a, b) => rank(a) - rank(b) || a.data.order - b.data.order);
}

export function getRelated(items: Item[], current: Item, limit = 3): Item[] {
  return sortTemplates(items)
    .filter((i) => i.slug !== current.slug && i.data.category === current.data.category)
    .slice(0, limit);
}

export function displayPrice(d: TemplateData): number | null {
  return d.status === 'ready' && d.price_source !== undefined ? d.price_source : null;
}
```
- [ ] **Step 4:** тесты PASS. **Step 5:** Commit `Add catalog sorting, related and price display logic`.

### Task 5: Каркас интерфейса и UI-ядро

**Files:**
- Create: `src/components/{Header,Footer,Button,Badge,SectionTitle,TemplateCard}.astro`, `src/styles/components.css`
- Modify: `src/layouts/Base.astro` (шапка, подвал, `<slot/>`)

**Interfaces:**
- Consumes: `siteConfig`, `url()`, `formatPrice`, `displayPrice`, `categoryLabel`.
- Produces: `<Button href? variant="primary|ghost" size="sm|md" data-*>` (рендерит `<a>` при `href`, иначе `<button>`; произвольные `data-*` пробрасываются); `<Badge tone="soon|category">`; `<TemplateCard slug data cover />`.

- [ ] **Step 1:** `Header.astro`: логотип (текст, моно), ссылки «Каталог» → `url('catalog/')`, «Под ключ» → `url('custom/')`, «Портфолио» → `siteConfig.portfolioUrl`, кнопка «Написать в Telegram» → `https://t.me/${siteConfig.telegramUsername}`; на узком экране ссылки сворачиваются в `<details>`-меню без JS.
- [ ] **Step 2:** `Footer.astro`: контакты (Telegram), «Оферта» → `url('offer/')`, «Политика» → `url('privacy/')`, «Портфолио».
- [ ] **Step 3:** `TemplateCard.astro`: `<article class="card">` со ссылкой на `url('templates/'+slug+'/')`; обложка = `screenshots[0]` через `astro:assets` `<Image>` или `/placeholders/{category}.svg` (через `url()`); категория (`Badge`), название, `audience`; цена «от N ₽» только если `displayPrice() !== null`; для `soon` бейдж «Скоро» и никакой цены. Зона нажатия вся карточка.
- [ ] **Step 4:** SVG-заглушки `public/placeholders/{bot,miniapp,site,parser}.svg`: 16:10, фон `#141319`, акцентный градиент `#8b6bff → #3fe8bd`, простой пиктограмм категории и моно-подпись названия категории.
- [ ] **Step 5:** `npm run build`; визуально проверить в `npm run dev` на 375 px и 1280 px, обе темы.
- [ ] **Step 6:** Commit `Add header, footer, button, badge and template card`.

### Task 6: Каталог с фильтром

**Files:**
- Create: `src/pages/catalog.astro`, `src/components/CatalogFilter.astro`, `src/scripts/catalog-filter.ts`

- [ ] **Step 1:** `catalog.astro`: `const items = sortTemplates(await getCollection('templates'))`; сетка 1/2/3 колонки (`grid-template-columns` + media на 768/1024); каждый `TemplateCard` в `<li data-category={category}>`.
- [ ] **Step 2:** `CatalogFilter.astro`: кнопки «Все», «Боты», «Mini App», «Сайты», «Парсеры» (из `CATEGORIES`), по умолчанию скрыты атрибутом `hidden`, скрипт снимает его — без JS виден весь каталог. `catalog-filter.ts`: клик ставит `aria-pressed`, скрывает `<li>` чужой категории атрибутом `hidden`, пишет `#bot` в `location.hash`, читает хэш при загрузке; пустая категория показывает сообщение «Пока здесь пусто».
- [ ] **Step 3:** `npm run dev`: фильтр работает, порядок «готовые → Скоро» сохраняется внутри категории.
- [ ] **Step 4:** Commit `Add catalog page with category filter`.

### Task 7: Страница шаблона

**Files:**
- Create: `src/pages/templates/[slug].astro`, `src/components/{DemoBlock,Gallery,FeatureList,PurchaseCard,StackRequirements,Faq,RelatedTemplates}.astro`

**Interfaces:**
- `PurchaseCard` принимает `variant: 'source'|'turnkey'`, `data`, `slug`; кнопка — `<Button data-purchase data-slug data-title data-variant data-price-source data-price-turnkey>` (обработчик в Task 11). В `source` перечислено: код, инструкция по запуску, «обновления на {updateMonths} мес.»; в `turnkey`: установка на сервер, настройка под бизнес, правки, поддержка и «срок: {turnkey_days} дн.», цена «от».

- [ ] **Step 1:** `getStaticPaths` из коллекции; `render(entry)` для тела (описание).
- [ ] **Step 2:** `ready`: блоки по спецификации: заголовок + `Badge` категории + `audience` + статус «Готов»; `DemoBlock` (кнопка «Попробовать демо» → `demo_url`, `target="_blank" rel="noopener"`; ссылка на видео, если есть); `Gallery`; описание из Markdown; `FeatureList`; два `PurchaseCard`; `StackRequirements`; `Faq` (`<details>`); `RelatedTemplates` (`getRelated`, 0–3 карточки, при 0 блок не выводится).
- [ ] **Step 3:** `soon`: заголовок + бейдж «Скоро», описание, «Планируемые функции» (`features`), кнопка «Хочу этот шаблон» (`data-variant="wish"`), `RelatedTemplates`. Никаких цен, срока, демо, `PurchaseCard`.
- [ ] **Step 4:** `Gallery.astro`: миниатюры-кнопки открывают `<dialog>`; внутри горизонтальный контейнер `overflow-x:auto; scroll-snap-type:x mandatory`, каждый кадр `scroll-snap-align:center; flex:0 0 100%`; закрытие по кнопке, Esc и клику на подложку; фокус возвращается на миниатюру. Если скриншотов нет — одна заглушка категории без открытия.
- [ ] **Step 5:** Проверка в `npm run dev` страниц `ready` и `soon` в обеих темах на 375 и 1280 px.
- [ ] **Step 6:** Commit `Add template page with demo, gallery, purchase cards and FAQ`.

### Task 8: Главная и «Индивидуальная разработка»

**Files:**
- Create: `src/components/{Hero,HowItWorks,CustomCta}.astro`, `src/pages/custom.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1:** `Hero`: надзаголовок `// готовые шаблоны`, H1 «Готовые боты и сайты: запустите за вечер или закажите установку под ключ», кнопки «Смотреть каталог» (primary) и «Написать в Telegram» (ghost).
- [ ] **Step 2:** `index.astro`: `Hero`; сетка `featured` шаблонов (`sortTemplates(...).filter(featured).slice(0, 6)`; на старте `featured: true` у шести первых по `order`); `HowItWorks` (3 шага: «Выберите шаблон», «Попробуйте демо», «Запустите сами или закажите под ключ»); `CustomCta` со ссылкой на портфолио и `/custom/`.
- [ ] **Step 3:** `custom.astro`: «Не нашли подходящий шаблон?», 2–3 предложения (индивидуальная разработка ботов, мини-апп, сайтов, парсеров), ссылка на портфолио, кнопка «Написать в Telegram».
- [ ] **Step 4:** Commit `Add home and custom development pages`.

### Task 9: 12 шаблонов-заглушек и список для подготовки

**Files:**
- Create/Replace: `src/content/templates/*.md` (12 файлов), `docs/to-prepare.md`

- [ ] **Step 1:** Файлы по таблице «Каталог на старте» (имена: `booking-bot`, `quiz-leads-bot`, `shop-miniapp`, `channel-access-bot`, `autopost-bot`, `support-bot`, `ai-consultant-bot`, `booking-miniapp`, `cafe-menu-miniapp`, `master-landing`, `portfolio-site`, `avito-parser`). `order` 1–12 по таблице; `featured: true` у первых шести.
  - Цены и `turnkey_days` — из таблицы и `docs/decisions.md` (у всех 12 во frontmatter; у `soon` на сайте не выводятся).
  - У `ready` (первые три): `demo_url: https://example.com/demo/<slug>` (ЗАГЛУШКА), `stack` и `requirements` осмысленные, `faq` из 4 вопросов («Нужно ли уметь программировать», «Можно ли доработать», «Что если не получится запустить», «Как получить обновления»), тело — 2–3 абзаца описания.
  - У `soon`: `features` — планируемые функции из колонки «Что внутри», тело — 1–2 предложения.
  - Тексты короткие и осмысленные по колонкам «Для кого» и «Что внутри», без lorem ipsum.
- [ ] **Step 2:** `npm run build` — все 12 проходят схему.
- [ ] **Step 3:** `docs/to-prepare.md`: таблица для каждого `ready` шаблона — реальная `demo_url` (бот/мини-апп/превью), 3–5 скриншотов в `src/assets/shots/<slug>/` (рекомендуемый размер 1280×800 для сайтов и 750×1334 для ботов), необязательное видео; общий список: 4 PNG для Open Graph 1200×630 в `public/og/`, тексты оферты и политики, финальные цены и тексты шаблонов, купить домен. Также перечислить все места, где сейчас заглушки (`example.com/demo/*`, обложки-заглушки).
- [ ] **Step 4:** Commit `Add 12 placeholder templates and preparation checklist`; `git push`; дождаться деплоя.

### ⛔ Остановка: приёмка этапа 2

Показать: ссылку на сайт, как проверить главную, каталог (фильтр, порядок), страницы `ready` и `soon` (у «Скоро» нет цен и демо), `docs/to-prepare.md`. Ждать «ок».

---

# ЭТАП 3. Заказ

### Task 10: Логика покупки и аналитики

**Files:**
- Create: `src/lib/purchase.ts`, `src/lib/analytics.ts`
- Test: `tests/purchase.test.ts`, `tests/analytics.test.ts`

**Interfaces:**
- Produces:
  - `type Variant = 'source' | 'turnkey' | 'wish'`
  - `interface PurchaseTemplate { slug: string; title: string; priceSource?: number; priceTurnkey?: number }`
  - `buildOrderText(t: PurchaseTemplate, v: Variant): string`
  - `buildTelegramLink(username: string, text: string): string`
  - `goalFor(v: Variant): 'buy_source' | 'buy_turnkey' | 'want_template'`
  - `reachGoal(goal: string, slug: string, id?: string): void`
  - `startPurchase(t: PurchaseTemplate, v: Variant): void` — шлёт цель, при `paymentEnabled === false` диспатчит `window` событие `order:open` с `detail: { template, variant, text, link }`; при `true` кидает `Error('payment flow is not implemented')`.

- [ ] **Step 1: Тесты** `tests/purchase.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { buildOrderText, buildTelegramLink, goalFor } from '../src/lib/purchase';

const t = { slug: 'booking-bot', title: 'Бот записи клиентов', priceSource: 2990, priceTurnkey: 15000 };

describe('order text', () => {
  it('source', () => {
    expect(buildOrderText(t, 'source'))
      .toBe('Здравствуйте! Хочу купить исходники шаблона «Бот записи клиентов» за 2 990 ₽');
  });
  it('turnkey uses "от"', () => {
    expect(buildOrderText(t, 'turnkey'))
      .toBe('Здравствуйте! Хочу заказать установку под ключ шаблона «Бот записи клиентов» от 15 000 ₽');
  });
  it('wish has no price', () => {
    expect(buildOrderText({ slug: 'x', title: 'Парсер Авито с уведомлениями' }, 'wish'))
      .toBe('Здравствуйте! Хочу этот шаблон: «Парсер Авито с уведомлениями». Когда он будет готов?');
  });
  it('uses plain spaces in price', () => {
    expect(buildOrderText(t, 'source')).not.toContain('\u00a0');
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
```
`tests/analytics.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reachGoal } from '../src/lib/analytics';

beforeEach(() => { vi.unstubAllGlobals(); });

describe('reachGoal', () => {
  it('does nothing without counter id', () => {
    const ym = vi.fn(); vi.stubGlobal('window', { ym });
    reachGoal('buy_source', 'booking-bot', '');
    expect(ym).not.toHaveBeenCalled();
  });
  it('does not throw when ym is missing', () => {
    vi.stubGlobal('window', {});
    expect(() => reachGoal('buy_source', 'booking-bot', '12345')).not.toThrow();
  });
  it('sends goal with template name', () => {
    const ym = vi.fn(); vi.stubGlobal('window', { ym });
    reachGoal('buy_source', 'booking-bot', '12345');
    expect(ym).toHaveBeenCalledWith(12345, 'reachGoal', 'buy_source', { template: 'booking-bot' });
  });
});
```
- [ ] **Step 2:** запустить → FAIL.
- [ ] **Step 3: Реализация**

`src/lib/analytics.ts`:
```ts
import { siteConfig } from '../../site.config';

export function reachGoal(goal: string, slug: string, id: string = siteConfig.metrikaId): void {
  if (!id) return;
  const ym = (globalThis as any).window?.ym;
  if (typeof ym !== 'function') return;
  ym(Number(id), 'reachGoal', goal, { template: slug });
}
```
`src/lib/purchase.ts`:
```ts
import { siteConfig } from '../../site.config';
import { formatPrice } from './format';
import { reachGoal } from './analytics';

export type Variant = 'source' | 'turnkey' | 'wish';
export interface PurchaseTemplate { slug: string; title: string; priceSource?: number; priceTurnkey?: number }

export function goalFor(v: Variant) {
  return v === 'source' ? 'buy_source' : v === 'turnkey' ? 'buy_turnkey' : 'want_template';
}

export function buildOrderText(t: PurchaseTemplate, v: Variant): string {
  const name = `«${t.title}»`;
  if (v === 'source') return `Здравствуйте! Хочу купить исходники шаблона ${name} за ${formatPrice(t.priceSource!, { nbsp: false })}`;
  if (v === 'turnkey') return `Здравствуйте! Хочу заказать установку под ключ шаблона ${name} от ${formatPrice(t.priceTurnkey!, { nbsp: false })}`;
  return `Здравствуйте! Хочу этот шаблон: ${name}. Когда он будет готов?`;
}

export function buildTelegramLink(username: string, text: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(text)}`;
}

export function startPurchase(t: PurchaseTemplate, v: Variant): void {
  reachGoal(goalFor(v), t.slug);
  if (siteConfig.paymentEnabled) throw new Error('payment flow is not implemented');
  const text = buildOrderText(t, v);
  const link = buildTelegramLink(siteConfig.telegramUsername, text);
  window.dispatchEvent(new CustomEvent('order:open', { detail: { template: t, variant: v, text, link } }));
}
```
- [ ] **Step 4:** тесты PASS. **Step 5:** Commit `Add purchase and analytics logic`.

### Task 11: Модалка заказа и подключение кнопок

**Files:**
- Create: `src/components/OrderModal.astro`, `src/scripts/purchase-init.ts`
- Modify: `src/layouts/Base.astro` (подключить `OrderModal`, скрипт, Метрику), `PurchaseCard.astro`, страница `soon`

**Interfaces:**
- Consumes: `startPurchase`, событие `order:open`.
- Кнопки: `data-purchase`, `data-slug`, `data-title`, `data-variant`, `data-price-source`, `data-price-turnkey`.

- [ ] **Step 1:** `purchase-init.ts`: делегированный `click` на `[data-purchase]`: собирает `PurchaseTemplate` из `dataset`, вызывает `startPurchase`. Слушает `order:open`: заполняет модалку (название, вариант, цена, `<textarea readonly>` с текстом), ставит `href` кнопки «Написать в Telegram» = `link`, вызывает `dialog.showModal()`.
- [ ] **Step 2:** `OrderModal.astro`: один `<dialog>`; кнопка «Написать в Telegram» — это `<a target="_blank" rel="noopener">` (не `window.open`, чтобы iOS не блокировал), на `click` выполняется `copyText(text)` без `preventDefault`: `navigator.clipboard.writeText` в `try/catch`, при ошибке — `textarea.select(); document.execCommand('copy')` в `try/catch`. Под кнопкой подсказка «Текст заказа скопирован — вставьте его в чат»; если копирование не удалось, подсказка меняется на «Скопируйте текст выше и вставьте его в чат»; текстовое поле всегда видно и выделяется по клику. Закрытие: кнопка, Esc, клик по подложке.
- [ ] **Step 3:** Метрика в `Base.astro`: `{siteConfig.metrikaId && <script is:inline set:html={...стандартный сниппет Метрики...}/>}` и `<noscript>`-пиксель; при пустом id — ничего не выводится. Сниппет взять из документации Яндекс Метрики.
- [ ] **Step 4:** Проверка: `npm run dev` — клик по «Купить исходники» открывает модалку с правильным текстом, текст копируется (вставить в любое поле), ссылка ведёт на `t.me/foy4ik?text=...`; «Хочу этот шаблон» на `soon`-странице работает; в консоли нет ошибок. Временно задать `metrikaId: '123'` и убедиться, что скрипт появляется, затем вернуть пустое.
- [ ] **Step 5:** Commit `Add order modal, purchase wiring and Metrika snippet`; `git push`.

### Task 12: Чек-лист ручной проверки

**Files:**
- Create: `docs/manual-checklist-stage3.md`

- [ ] Содержимое: для Safari iOS, Chrome Android, Telegram Desktop (на задеплоенном сайте): 1) открыть страницу `ready`-шаблона, нажать «Купить исходники»; 2) убедиться, что в окне верный текст и цена; 3) нажать «Написать в Telegram»; 4) открывается чат с @foy4ik; 5) текст подставлен в поле ввода (если нет — вставить из буфера, подсказка должна быть видна); 6) то же для «Заказать под ключ» и «Хочу этот шаблон» на `soon`-странице; 7) при закрытом буфере/режиме инкогнито подсказка меняется на «Скопируйте текст выше…». Таблица результатов: устройство × сценарий, поле для заметок.
- [ ] Commit `Add stage 3 manual test checklist`.

### ⛔ Остановка: приёмка этапа 3

Показать: ссылку, `docs/manual-checklist-stage3.md`, результаты автотестов. Ждать результатов ручной проверки и «ок».

---

# ЭТАП 4. SEO и юридические страницы

### Task 13: SEO-логика

**Files:**
- Create: `src/lib/seo.ts`, `src/components/Seo.astro`, `src/pages/robots.txt.ts`, `public/og/{bot,miniapp,site,parser}.png`
- Modify: `src/layouts/Base.astro` (пропсы `title, description, image?, noindex?, ld?`), `src/pages/templates/[slug].astro`
- Test: `tests/seo.test.ts`

**Interfaces:**
- Produces: `pageTitle(t: {title:string; category: string}): string` («Telegram-бот записи клиентов — готовый шаблон и установка под ключ» по категории: `bot`→«Telegram-бот», `miniapp`→«Telegram Mini App», `site`→«Сайт», `parser`→«Парсер»; при `title`, уже содержащем эти слова, префикс не дублируется — проверить на 12 названиях); `buildProductLd(opts): object | null` (`null` для `soon`); `buildRobotsTxt(siteUrl: string, base: string): string`.

- [ ] **Step 1: Тесты**

```ts
import { describe, it, expect } from 'vitest';
import { buildProductLd, buildRobotsTxt } from '../src/lib/seo';

describe('robots', () => {
  it('builds with subpath base', () => {
    expect(buildRobotsTxt('https://foy4ik.github.io', '/templates/'))
      .toBe('User-agent: *\nAllow: /\n\nSitemap: https://foy4ik.github.io/templates/sitemap-index.xml\n');
  });
  it('builds with root base', () => {
    expect(buildRobotsTxt('https://example.ru/', '/'))
      .toContain('Sitemap: https://example.ru/sitemap-index.xml');
  });
});

describe('product ld', () => {
  const opts = { name: 'Бот', description: 'Описание', image: 'https://x/og.png', url: 'https://x/t/', priceSource: 2990, priceTurnkey: 15000 };
  it('has two offers with RUB prices for ready', () => {
    const ld: any = buildProductLd({ ...opts, status: 'ready' });
    expect(ld['@type']).toBe('Product');
    expect(ld.offers).toHaveLength(2);
    expect(ld.offers.map((o: any) => o.price)).toEqual(['2990', '15000']);
    expect(ld.offers.every((o: any) => o.priceCurrency === 'RUB')).toBe(true);
  });
  it('is null for soon', () => {
    expect(buildProductLd({ ...opts, status: 'soon' })).toBeNull();
  });
});
```
- [ ] **Step 2:** → FAIL. **Step 3: Реализация**

```ts
export function buildRobotsTxt(siteUrl: string, base: string): string {
  const origin = siteUrl.replace(/\/+$/, '');
  const path = ('/' + base.replace(/^\/+|\/+$/g, '') + '/').replace(/\/\/+/g, '/');
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}${path}sitemap-index.xml\n`;
}

export function buildProductLd(o: {
  status: 'ready' | 'soon'; name: string; description: string; image: string; url: string;
  priceSource?: number; priceTurnkey?: number;
}) {
  if (o.status !== 'ready' || o.priceSource === undefined || o.priceTurnkey === undefined) return null;
  const offer = (name: string, price: number) => ({
    '@type': 'Offer', name, price: String(price), priceCurrency: 'RUB',
    availability: 'https://schema.org/InStock', url: o.url,
  });
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: o.name, description: o.description, image: o.image,
    offers: [offer('Исходники', o.priceSource), offer('Установка под ключ', o.priceTurnkey)],
  };
}
```
`pageTitle` реализовать по правилу выше с тестом на дублирование префикса.

`src/pages/robots.txt.ts`:
```ts
import type { APIRoute } from 'astro';
import { siteConfig } from '../../site.config';
import { buildRobotsTxt } from '../lib/seo';

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(siteConfig.siteUrl, siteConfig.base), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```
- [ ] **Step 4:** `Seo.astro` выводит `<title>`, `description`, `canonical` (`absoluteUrl`), Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:image` как абсолютный URL на `/og/<category>.png` или первый скриншот, `og:locale ru_RU`), Twitter card, `<meta name="robots" content="noindex">` при `noindex`, `<script type="application/ld+json" set:html={JSON.stringify(ld)}>` при непустом `ld`. Страница шаблона передаёт `pageTitle`, `short`/описание и `buildProductLd`.
- [ ] **Step 5:** PNG 1200×630 для 4 категорий (фон `#09080d`, акцентный градиент, название категории моно-шрифтом) сгенерировать скриптом (`sharp` как devDependency или Node canvas) и положить в `public/og/`; Вместе с готовыми PNG скрипт остаётся в `scripts/make-og.mjs`.
- [ ] **Step 6:** `npm test`, `npm run build`; проверить `dist/sitemap-index.xml` (все страницы с `/templates/`, без `/thanks/`), `dist/robots.txt`, JSON-LD в `dist/templates/booking-bot/index.html` (есть) и `dist/templates/avito-parser/index.html` (нет).
- [ ] **Step 7:** Commit `Add SEO tags, Product structured data, robots endpoint and sitemap`.

### Task 14: Оферта, политика, «Спасибо»

**Files:**
- Create: `src/pages/{offer,privacy,thanks}.astro`

- [ ] **Step 1:** `offer.astro`: H1 «Публичная оферта», абзац «Текст будет добавлен». `privacy.astro`: H1 «Политика конфиденциальности», та же пометка. Тексты НЕ сочинять.
- [ ] **Step 2:** `thanks.astro`: H1 «Спасибо за покупку», текст про получение файлов (коротко: «Файлы и инструкция придут в Telegram в течение нескольких часов. Если что-то не пришло — напишите мне»), кнопка в Telegram, ссылка в каталог; `noindex` через `Base`.
- [ ] **Step 3:** `npm run build`; в `dist/thanks/index.html` есть `noindex`, в sitemap страницы нет.
- [ ] **Step 4:** Commit `Add offer, privacy and thank-you pages`; `git push`; дождаться деплоя.
- [ ] **Step 5:** Подготовить для заказчика: (а) строка для `robots.txt` портфолио: `Sitemap: https://foy4ik.github.io/templates/sitemap-index.xml`; (б) напоминание отправить `https://foy4ik.github.io/templates/sitemap-index.xml` в Яндекс Вебмастер (и в Search Console); (в) как проверить превью: отправить ссылку страницы шаблона себе в Telegram (если превью не обновилось — через @WebpageBot).

### ⛔ Остановка: приёмка этапа 4

Показать: ссылку, `sitemap-index.xml`, `robots.txt`, строку для портфолио, как проверить превью в Telegram. Ждать «ок».

---

# ЭТАП 5. Проверка

### Task 15: Адаптив, Lighthouse, README

**Files:**
- Create: `README.md`
- Modify: по результатам проверки

- [ ] **Step 1: Адаптив.** В браузерной панели проверить главную, каталог, страницу `ready`, страницу `soon`, `/custom/`, модалку и галерею на 375, 768 и 1280 px, в обеих темах; нет горизонтального скролла, зоны нажатия кнопок покупки не меньше 44 px, колонки карточек 1/2/3.
- [ ] **Step 2: Lighthouse.** На собранном `npm run preview` запустить `npx lighthouse http://localhost:4321/templates/ --preset=perf --form-factor=mobile --only-categories=performance,accessibility,seo,best-practices` для `/`, `/catalog/`, `/templates/booking-bot/`, `/templates/avito-parser/`. Цель: Performance ≥ 90 и Accessibility ≥ 90 на мобильном. Типичные правки: размеры и `loading="lazy"` у изображений, контраст `--text-dim`, `aria-label` у иконок-кнопок, `font-display: swap`, `<link rel=preconnect>` для Google Fonts. Повторять, пока не достигнуто; итоговые цифры записать в сообщение этапа.
- [ ] **Step 3: README.** Разделы: что это; запуск (`npm install`, `npm run dev`, `npm test`, `npm run build`); `site.config.ts` — таблица ключей; **как добавить шаблон** (создать `src/content/templates/<slug>.md`, пример frontmatter для `soon` и `ready`, положить скриншоты в `src/assets/shots/<slug>/` и указать пути, `git push`); как перевести «Скоро» в «Готов» (сменить `status`, добавить `demo_url`, `stack`, `requirements`, `faq` из 4–6 вопросов); как переехать на домен (изменить `siteUrl` и `base`, добавить `public/CNAME`, обновить DNS и настройки Pages); как подключить Метрику (`metrikaId`); как включить оплату позже (`paymentEnabled` и ветка в `startPurchase`); открытые вопросы на этап оплаты из ТЗ.
- [ ] **Step 4:** `npm test && npm run build`, `git add -A`, commit `Add README and fix responsive and Lighthouse issues`, `git push`, дождаться деплоя.

### ⛔ Остановка: финальная приёмка

Показать: итоговые баллы Lighthouse, чек-лист адаптива, README, `docs/to-prepare.md`. Ждать «ок».
