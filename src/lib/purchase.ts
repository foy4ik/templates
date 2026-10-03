import { siteConfig } from '../../site.config';
import { formatPrice } from './format';
import { reachGoal } from './analytics';

export type Variant = 'source' | 'turnkey' | 'wish';

export interface PurchaseTemplate {
  slug: string;
  title: string;
  priceSource?: number;
  priceTurnkey?: number;
}

export interface OrderDetail {
  template: PurchaseTemplate;
  variant: Variant;
  text: string;
  link: string;
}

export function goalFor(v: Variant) {
  return v === 'source' ? 'buy_source' : v === 'turnkey' ? 'buy_turnkey' : 'want_template';
}

function price(n: number | undefined, t: PurchaseTemplate, v: Variant): string {
  if (n === undefined) throw new Error(`Missing price for variant "${v}" of template "${t.slug}"`);
  return formatPrice(n, { nbsp: false });
}

export function buildOrderText(t: PurchaseTemplate, v: Variant): string {
  const name = `«${t.title}»`;
  if (v === 'source') return `Здравствуйте! Хочу купить исходники шаблона ${name} за ${price(t.priceSource, t, v)}`;
  if (v === 'turnkey') {
    return `Здравствуйте! Хочу заказать установку под ключ шаблона ${name} от ${price(t.priceTurnkey, t, v)}`;
  }
  return `Здравствуйте! Хочу этот шаблон: ${name}. Когда он будет готов?`;
}

export function buildTelegramLink(username: string, text: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(text)}`;
}

/** Single entry point for every purchase button. */
export function startPurchase(t: PurchaseTemplate, v: Variant): void {
  reachGoal(goalFor(v), t.slug);
  if (siteConfig.paymentEnabled as boolean) throw new Error('payment flow is not implemented');
  const text = buildOrderText(t, v);
  const link = buildTelegramLink(siteConfig.telegramUsername, text);
  const detail: OrderDetail = { template: t, variant: v, text, link };
  window.dispatchEvent(new CustomEvent('order:open', { detail }));
}
