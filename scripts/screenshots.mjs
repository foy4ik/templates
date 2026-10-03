// Self-check screenshots: npm run screenshots -> screenshots/*.png
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';
import { siteConfig } from '../site.config.ts';

const PORT = 4329;
const origin = `http://127.0.0.1:${PORT}`;
const base = siteConfig.base.replace(/\/+$/, '');
const pages = [
  ['home', ''],
  ['catalog', 'catalog/'],
  ['booking-bot', 'templates/booking-bot/'],
  ['avito-parser', 'templates/avito-parser/'],
];
const widths = [375, 768, 1280];
const schemes = ['dark', 'light'];

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

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

rmSync('screenshots', { recursive: true, force: true });
mkdirSync('screenshots', { recursive: true });

try {
  await waitForServer();
  const browser = await chromium.launch();
  for (const scheme of schemes) {
    for (const width of widths) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
      const page = await ctx.newPage();
      for (const [name, path] of pages) {
        await page.goto(`${origin}${base}/${path}`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: `screenshots/${name}-${width}-${scheme}.png`, fullPage: true });
      }
      if (width === 375) {
        await page.goto(`${origin}${base}/`, { waitUntil: 'networkidle' });
        await page.click('.menu > summary');
        await page.waitForTimeout(350);
        await page.screenshot({ path: `screenshots/menu-open-${width}-${scheme}.png` });
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log('screenshots saved to ./screenshots');
} finally {
  stop();
}
