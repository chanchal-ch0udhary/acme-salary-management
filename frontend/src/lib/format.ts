const cache = new Map<string, Intl.NumberFormat>();

function formatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', options);
    cache.set(key, f);
  }
  return f;
}

/** 1234567 INR -> "₹1,234,567" (whole units; salaries are never fractional). */
export const formatMoney = (amount: number, currency: string): string =>
  formatter(`m:${currency}`, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const formatUsd = (amount: number): string => formatMoney(amount, 'USD');

/** 1_250_000 -> "$1.25M", 85_000 -> "$85K". For tight spaces such as KPI cards and chart axes. */
export const formatUsdCompact = (amount: number): string =>
  // minimumFractionDigits is explicit: the default differs between Node/ICU versions ("$85K" vs "$85.00K").
  formatter('compact-usd', { style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

export const formatNumber = (n: number): string => formatter('n', {}).format(n);

export const formatPct = (n: number, digits = 1): string => `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;

export function formatDate(iso: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Percentage change between two salaries; null when there is no previous value. */
export const salaryDeltaPct = (oldValue: number | null, newValue: number): number | null =>
  oldValue ? ((newValue - oldValue) / oldValue) * 100 : null;

export const todayIso = (): string => new Date().toISOString().slice(0, 10);
