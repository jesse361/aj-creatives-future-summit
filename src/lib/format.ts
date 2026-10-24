export function formatMoney(priceMinor: number, currency: string) {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(priceMinor / 100);
  } catch {
    return `${code} ${(priceMinor / 100).toFixed(2)}`;
  }
}

export function toMinorUnits(major: number) {
  return Math.round(major * 100);
}

export function padCountdown(value: number, size = 2) {
  return String(Math.max(0, value)).padStart(size, "0");
}
