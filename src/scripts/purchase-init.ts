import { startPurchase, type OrderDetail, type Variant } from '../lib/purchase';
import { copyText } from '../lib/clipboard';
import { formatPrice } from '../lib/format';

const VARIANT_LABEL: Record<Variant, string> = {
  source: 'Исходники',
  turnkey: 'Под ключ',
  wish: 'Хочу этот шаблон',
};

const dialog = document.getElementById('order-dialog') as HTMLDialogElement | null;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function num(v: string | undefined): number | undefined {
  return v ? Number(v) : undefined;
}

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-purchase]');
  if (!btn) return;
  e.preventDefault();
  const d = btn.dataset;
  try {
    startPurchase(
      { slug: d.slug!, title: d.title!, priceSource: num(d.priceSource), priceTurnkey: num(d.priceTurnkey) },
      d.variant as Variant,
    );
  } catch (err) {
    console.error(err);
  }
});

window.addEventListener('order:open', (e) => {
  if (!dialog) return;
  const { template, variant, text, link } = (e as CustomEvent<OrderDetail>).detail;
  $('order-title').textContent = template.title;
  $('order-variant').textContent = VARIANT_LABEL[variant];
  const priceRow = $('order-price-row');
  if (variant === 'wish') {
    priceRow.hidden = true;
  } else {
    priceRow.hidden = false;
    $('order-price').textContent =
      variant === 'source'
        ? formatPrice(template.priceSource!)
        : `от ${formatPrice(template.priceTurnkey!)}`;
  }
  ($('order-text') as unknown as HTMLTextAreaElement).value = text;
  ($('order-tg') as HTMLAnchorElement).href = link;
  $('order-hint').textContent = 'Нажмите кнопку: текст заказа скопируется, и откроется чат со мной.';
  dialog.showModal();
});

// The link is a plain <a target="_blank">, so mobile browsers do not block it as a popup.
// Copying runs alongside the navigation; the hint reports the result.
$('order-tg')?.addEventListener('click', () => {
  const text = ($('order-text') as unknown as HTMLTextAreaElement).value;
  void copyText(text).then((ok) => {
    $('order-hint').textContent = ok
      ? 'Текст заказа скопирован — вставьте его в чат.'
      : 'Скопируйте текст заказа выше и вставьте его в чат.';
  });
});

$('order-text')?.addEventListener('focus', (e) => (e.target as HTMLTextAreaElement).select());
$('order-text')?.addEventListener('click', (e) => (e.target as HTMLTextAreaElement).select());

dialog?.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t === dialog || t.closest('[data-order-close]')) dialog.close();
});
