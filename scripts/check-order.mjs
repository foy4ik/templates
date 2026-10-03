// End-to-end check of the order flow against the built site: npm run check:order
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { siteConfig } from '../site.config.ts';

const PORT = 4330;
const origin = `http://127.0.0.1:${PORT}`;
const base = siteConfig.base.replace(/\/+$/, '');

const build = spawnSync('npm', ['run', 'build'], { stdio: 'ignore', shell: true });
if (build.status !== 0) throw new Error('build failed');
const server = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore', shell: true });
const stop = () => spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true, stdio: 'ignore' });
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${origin}${base}/`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start');
}

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`ok   ${name}`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  }
};

try {
  await waitForServer();
  const browser = await chromium.launch();
  const tg = siteConfig.telegramUsername;

  // 1) normal flow with working clipboard
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}${base}/templates/booking-bot/`, { waitUntil: 'networkidle' });

  await check('source button opens modal with order text', async () => {
    await page.click('[data-variant="source"]');
    assert.equal(await page.locator('#order-dialog').evaluate((d) => d.open), true);
    assert.equal(await page.textContent('#order-title'), 'Бот записи клиентов');
    assert.equal(await page.textContent('#order-variant'), 'Исходники');
    assert.match((await page.textContent('#order-price')).replace(/\s/g, ' '), /2 990 ₽/);
    assert.equal(
      await page.inputValue('#order-text'),
      'Здравствуйте! Хочу купить исходники шаблона «Бот записи клиентов» за 2 990 ₽',
    );
  });

  await check('telegram link carries encoded text', async () => {
    const href = await page.getAttribute('#order-tg', 'href');
    const u = new URL(href);
    assert.equal(u.origin + u.pathname, `https://t.me/${tg}`);
    assert.equal(u.searchParams.get('text'), await page.inputValue('#order-text'));
  });

  await check('click copies text to clipboard and shows hint', async () => {
    const popup = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await page.click('#order-tg');
    const p = await popup;
    if (p) await p.close().catch(() => {});
    await page.waitForFunction(() => document.getElementById('order-hint').textContent.includes('скопирован'));
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.inputValue('#order-text'));
  });

  await check('Esc closes the modal', async () => {
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#order-dialog').evaluate((d) => d.open), false);
  });

  await check('turnkey button shows "от" price', async () => {
    await page.click('[data-variant="turnkey"]');
    assert.equal(await page.textContent('#order-variant'), 'Под ключ');
    assert.match((await page.textContent('#order-price')).replace(/\s/g, ' '), /^от 15 000 ₽$/);
    assert.match(await page.inputValue('#order-text'), /от 15 000 ₽$/);
    await page.click('[data-order-close]');
  });

  await ctx.close();

  // 2) "soon" page: wish button, no price row
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  page2.on('pageerror', (e) => errors.push(e.message));
  await page2.goto(`${origin}${base}/templates/avito-parser/`, { waitUntil: 'networkidle' });
  await check('wish button on a "soon" template has no price', async () => {
    await page2.click('[data-variant="wish"]');
    assert.equal(await page2.locator('#order-price-row').isHidden(), true);
    assert.equal(
      await page2.inputValue('#order-text'),
      'Здравствуйте! Хочу этот шаблон: «Парсер Авито с уведомлениями». Когда он будет готов?',
    );
  });
  await ctx2.close();

  // 3) clipboard unavailable: text stays visible, hint tells to copy manually
  const ctx3 = await browser.newContext();
  const page3 = await ctx3.newPage();
  await page3.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
    document.execCommand = () => false;
  });
  await page3.goto(`${origin}${base}/templates/booking-bot/`, { waitUntil: 'networkidle' });
  await check('without clipboard the text stays visible and hint asks to copy manually', async () => {
    await page3.click('[data-variant="source"]');
    page3.context().on('page', (p) => p.close().catch(() => {}));
    await page3.click('#order-tg');
    await page3.waitForFunction(() => document.getElementById('order-hint').textContent.includes('Скопируйте'));
    assert.equal(await page3.locator('#order-text').isVisible(), true);
  });
  await ctx3.close();

  await check('no page errors', async () => assert.deepEqual(errors, []));
  await browser.close();
} finally {
  stop();
  console.log(results.join('\n'));
}
