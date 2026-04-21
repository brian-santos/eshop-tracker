import { getCachedRates, setCachedRates } from "./storage";

const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

/**
 * Fetch USD exchange rates. Cached in Redis for 24h to respect the free tier.
 * Returns null if the fetch fails — callers should handle missing USD display gracefully.
 */
export async function getRates(): Promise<Record<string, number> | null> {
  const cached = await getCachedRates();
  if (cached && Date.now() - cached.fetchedAt < 22 * 60 * 60 * 1000) {
    return cached.rates;
  }
  try {
    const res = await fetch(RATES_ENDPOINT, { cache: "no-store" });
    if (!res.ok) return cached?.rates ?? null;
    const data = (await res.json()) as { result: string; rates: Record<string, number> };
    if (data.result !== "success") return cached?.rates ?? null;
    await setCachedRates({
      base: "USD",
      fetchedAt: Date.now(),
      rates: data.rates,
    });
    return data.rates;
  } catch {
    return cached?.rates ?? null;
  }
}

/**
 * Convert an amount in `fromCurrency` to USD.
 * Returns null if rates are unavailable or currency is missing.
 */
export async function toUSD(
  amount: number,
  fromCurrency: string,
): Promise<number | null> {
  if (fromCurrency === "USD") return amount;
  const rates = await getRates();
  if (!rates) return null;
  const rate = rates[fromCurrency];
  if (!rate || rate <= 0) return null;
  // rates are "1 USD = X {fromCurrency}", so USD = amount / rate.
  return amount / rate;
}
