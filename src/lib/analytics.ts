import { siteConfig } from '../../site.config';

export function reachGoal(goal: string, slug: string, id: string = siteConfig.metrikaId): void {
  if (!id) return;
  const ym = (globalThis as { window?: { ym?: unknown } }).window?.ym;
  if (typeof ym !== 'function') return;
  ym(Number(id), 'reachGoal', goal, { template: slug });
}
