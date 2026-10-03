// Responsive sanity check on every page at 375/768/1280: npm run check:layout
// Fails on horizontal overflow, purchase/CTA buttons smaller than 44px, or console errors.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { siteConfig } from '../site.config.ts';

const PORT = 4334;
const origin = `http://127.0.0.1:${PORT}`;
const base = siteConfig.base.replace(/\/+$/, '');
if (spawnSync('npm', ['run', 'build'], { stdio: 'ignore', shell: true }).status !== 0) throw new Error('build failed');
const server = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore', shell: true });
const stop = () => spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true, stdio: 'ignore' });
process.on('exit', stop);
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${origin}${base}/`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const paths = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
paths.push(`${base}/thanks/`);
const problems = [];
let checked = 0;
try {
  const browser = await chromium.launch();
  for (const width of [375, 768, 1280]) {
    const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && errors.push(m.text()));
    for (const p of paths) {
      await page.goto(`${origin}${p}`, { waitUntil: 'networkidle' });
      const r = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        small: [...document.querySelectorAll('.btn:not(.btn-sm)')]
          .filter((b) => b.offsetParent !== null && b.getBoundingClientRect().height < 44)
          .map((b) => b.textContent.trim()),
      }));
      if (r.overflow > 0) problems.push(`${width}px ${p}: horizontal overflow ${r.overflow}px`);
      if (r.small.length) problems.push(`${width}px ${p}: buttons under 44px: ${r.small.join(', ')}`);
      checked++;
    }
    if (errors.length) problems.push(`${width}px: console errors: ${[...new Set(errors)].join(' | ')}`);
  }
  await browser.close();
} finally {
  stop();
}
console.log(`${checked} page views checked`);
console.log(problems.length ? problems.join('\n') : 'no layout problems');
process.exitCode = problems.length ? 1 : 0;
