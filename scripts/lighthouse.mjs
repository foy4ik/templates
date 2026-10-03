// Mobile Lighthouse on key pages: npm run lighthouse
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { siteConfig } from '../site.config.ts';

const PORT = 4332;
const origin = `http://127.0.0.1:${PORT}`;
const base = siteConfig.base.replace(/\/+$/, '');
const pages = ['', 'catalog/', 'templates/booking-bot/', 'templates/avito-parser/', 'custom/'];

if (spawnSync('npm', ['run', 'build'], { stdio: 'ignore', shell: true }).status !== 0) throw new Error('build failed');
const server = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore', shell: true });
const stop = () => spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true, stdio: 'ignore' });
process.on('exit', stop);

for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${origin}${base}/`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
mkdirSync('screenshots/lighthouse', { recursive: true });
const browser = await chromium.launch({ args: ['--remote-debugging-port=9333'] });
const rows = [];
try {
  for (const p of pages) {
    const result = await lighthouse(`${origin}${base}/${p}`, {
      port: 9333, output: 'json', logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const j = result.lhr;
    writeFileSync(`screenshots/lighthouse/${p.replace(/[^a-z0-9]+/g, '_') || 'home'}.json`, JSON.stringify(j));
    const s = (k) => Math.round(j.categories[k].score * 100);
    const failed = Object.values(j.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable').map((a) => a.id);
    rows.push(`${('/' + p).padEnd(28)} perf ${s('performance')}  a11y ${s('accessibility')}  bp ${s('best-practices')}  seo ${s('seo')}  | ${failed.join(', ')}`);
  }
} finally {
  await browser.close();
  stop();
  console.log(rows.join('\n'));
}
