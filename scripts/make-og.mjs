// Generates Open Graph covers (1200x630) into public/og/. Run: npm run og
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const items = [
  ['default', 'Готовые боты и сайты', 'шаблоны · установка под ключ', 'bot'],
  ['bot', 'Telegram-боты', 'готовые шаблоны', 'bot'],
  ['miniapp', 'Telegram Mini App', 'готовые шаблоны', 'miniapp'],
  ['site', 'Сайты и лендинги', 'готовые шаблоны', 'site'],
  ['parser', 'Парсеры', 'готовые шаблоны', 'parser'],
];

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, title, sub, icon] of items) {
  const svg = readFileSync(`public/placeholders/${icon}.svg`, 'utf8').replace(/<text[\s\S]*?<\/text>/, '');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;width:1200px;height:630px;background:#09080d;color:#eeecf5;font-family:Inter,system-ui,sans-serif;position:relative;overflow:hidden}
    .bg{position:absolute;inset:0;background:radial-gradient(900px circle at 85% 20%,rgba(139,107,255,.35),transparent 60%),radial-gradient(700px circle at 10% 100%,rgba(63,232,189,.18),transparent 60%)}
    .art{position:absolute;right:70px;top:120px;width:420px;height:262px;border-radius:24px;overflow:hidden;border:1px solid #28262f}
    .art svg{width:100%;height:100%}
    .eyebrow{position:absolute;left:80px;top:90px;font:500 22px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;color:#8b6bff;text-transform:uppercase}
    h1{position:absolute;left:80px;top:150px;width:600px;margin:0;font-size:68px;line-height:1.08;font-weight:800;letter-spacing:-.02em}
    .sub{position:absolute;left:80px;bottom:80px;font:500 24px 'JetBrains Mono',ui-monospace,monospace;color:#98939f}
  </style><div class="bg"></div><div class="eyebrow">// foy4ik</div><h1>${title}</h1><div class="art">${svg}</div><div class="sub">${sub}</div>`;
  await page.setContent(html);
  await page.screenshot({ path: `public/og/${name}.png` });
}
await browser.close();
console.log('og images written to public/og');
