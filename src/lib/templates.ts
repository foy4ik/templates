import type { TemplateData } from './schema';

export type ItemData = Pick<TemplateData, 'status' | 'category' | 'order' | 'price_source'>;
export type Item = { slug: string; data: ItemData };

export const CATEGORIES = [
  { id: 'bot', label: 'Боты' },
  { id: 'miniapp', label: 'Mini App' },
  { id: 'site', label: 'Сайты' },
  { id: 'parser', label: 'Парсеры' },
] as const;

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function sortTemplates<T extends Item>(items: T[]): T[] {
  const rank = (i: T) => (i.data.status === 'ready' ? 0 : 1);
  return [...items].sort((a, b) => rank(a) - rank(b) || a.data.order - b.data.order);
}

export function getRelated<T extends Item>(items: T[], current: T, limit = 3): T[] {
  return sortTemplates(items)
    .filter((i) => i.slug !== current.slug && i.data.category === current.data.category)
    .slice(0, limit);
}

export function displayPrice(d: ItemData): number | null {
  return d.status === 'ready' && d.price_source !== undefined ? d.price_source : null;
}
