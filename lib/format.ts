const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return usd.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    const compact = (value / 1000).toFixed(1).replace(/\.0$/, "");
    return `$${compact}k`;
  }
  return usd.format(value);
}

/** "+4.2%" / "−1.3%" — signed, one decimal. Near-zero reads as "±0.0". */
export function formatDelta(value: number, suffix = "%"): string {
  const rounded = Number(value.toFixed(1));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return `${sign}${Math.abs(rounded).toFixed(1)}${suffix}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00`));
}
