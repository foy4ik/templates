export function formatPrice(n: number, opts: { nbsp?: boolean } = {}): string {
  const sp = opts.nbsp === false ? ' ' : '\u00a0';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sp) + sp + '₽';
}
