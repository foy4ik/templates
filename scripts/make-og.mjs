// Generates Open Graph covers (1200x630) into public/og/. Run: npm run og
// Layout: big title, smaller subtitle under it, the category picture below.
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const items = [
  ['default', 'Боты и сайты', 'готовые шаблоны · установка под ключ', 'bot'],
  ['bot', 'Telegram-боты', 'готовые шаблоны', 'bot'],
  ['miniapp', 'Telegram Mini App', 'готовые шаблоны', 'miniapp'],
  ['site', 'Сайты и лендинги', 'готовые шаблоны', 'site'],
  ['parser', 'Парсеры', 'готовые шаблоны', 'parser'],
];

const font = (file) => readFileSync(new URL(`./fonts/${file}`, import.meta.url)).toString('base64');
const face = (weight, subset, range) =>
  `@font-face{font-family:'Inter';font-weight:${weight};src:url(data:font/woff2;base64,${font(`inter-${subset}-${weight}-normal.woff2`)}) format('woff2');unicode-range:${range}}`;
const fontCss = [500, 800]
  .flatMap((w) => [face(w, 'cyrillic', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'), face(w, 'latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')])
  .join('');

const titleSize = (t) => (t.length <= 13 ? 132 : t.length <= 16 ? 116 : 100);

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, title, sub, icon] of items) {
  const svg = readFileSync(`public/placeholders/${icon}.svg`, 'utf8').replace(/<text[\s\S]*?<\/text>/, '');
  const html = `<!doctype html><meta charset="utf-8"><style>${fontCss}
    *{box-sizing:border-box}
    body{margin:0;width:1200px;height:630px;background:#09080d;color:#eeecf5;font-family:'Inter',sans-serif;position:relative;overflow:hidden}
    .bg{position:absolute;inset:0;background:radial-gradient(900px circle at 90% 10%,rgba(139,107,255,.35),transparent 60%),radial-gradient(700px circle at 5% 100%,rgba(63,232,189,.18),transparent 60%)}
    .col{position:absolute;left:80px;top:60px;right:80px}
    h1{margin:0;font-size:${titleSize(title)}px;line-height:1.05;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
    .sub{margin-top:14px;font-size:46px;font-weight:500;color:#98939f}
    .art{margin-top:34px;width:384px;height:240px;border-radius:24px;overflow:hidden;border:1px solid #28262f}
    .art svg{width:100%;height:100%;display:block}
  </style><div class="bg"></div><div class="col"><h1>${title}</h1><div class="sub">${sub}</div><div class="art">${svg}</div></div>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/og/${name}.png` });
}
await browser.close();
console.log('og images written to public/og');
