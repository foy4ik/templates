export function initCatalogFilter(): void {
  const bar = document.getElementById('catalog-filter');
  const empty = document.getElementById('catalog-empty');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-category]'));
  if (!bar || items.length === 0) return;
  const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button[data-filter]'));
  const known = new Set(buttons.map((b) => b.dataset.filter));

  function apply(filter: string): void {
    let visible = 0;
    for (const li of items) {
      const show = filter === 'all' || li.dataset.category === filter;
      li.hidden = !show;
      if (show) visible++;
    }
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
    if (empty) empty.hidden = visible > 0;
  }

  bar.hidden = false;
  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (!btn) return;
    const f = btn.dataset.filter!;
    apply(f);
    history.replaceState(null, '', f === 'all' ? location.pathname + location.search : `#${f}`);
  });

  const fromHash = location.hash.slice(1);
  apply(known.has(fromHash) ? fromHash : 'all');
}
