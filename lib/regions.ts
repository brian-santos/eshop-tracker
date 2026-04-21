import type { Continent, Region, RegionCode } from "./types";

// Full list of regions where Nintendo's price API reliably returns data.
// If Nintendo adds a new storefront or you want a country not here,
// add it below — the price API accepts any valid ISO alpha-2 country code.
export const REGIONS: Record<RegionCode, Region> = {
  // ─── Americas ────────────────────────────────────────────────
  US: { code: "US", name: "United States",   currency: "USD", lang: "en", flag: "🇺🇸", continent: "Americas" },
  CA: { code: "CA", name: "Canada",          currency: "CAD", lang: "en", flag: "🇨🇦", continent: "Americas" },
  MX: { code: "MX", name: "Mexico",          currency: "MXN", lang: "es", flag: "🇲🇽", continent: "Americas" },
  AR: { code: "AR", name: "Argentina",       currency: "ARS", lang: "es", flag: "🇦🇷", continent: "Americas" },
  BR: { code: "BR", name: "Brazil",          currency: "BRL", lang: "pt", flag: "🇧🇷", continent: "Americas" },
  CL: { code: "CL", name: "Chile",           currency: "CLP", lang: "es", flag: "🇨🇱", continent: "Americas" },
  CO: { code: "CO", name: "Colombia",        currency: "COP", lang: "es", flag: "🇨🇴", continent: "Americas" },
  PE: { code: "PE", name: "Peru",            currency: "PEN", lang: "es", flag: "🇵🇪", continent: "Americas" },

  // ─── Western / Central Europe ────────────────────────────────
  GB: { code: "GB", name: "United Kingdom",  currency: "GBP", lang: "en", flag: "🇬🇧", continent: "Europe" },
  IE: { code: "IE", name: "Ireland",         currency: "EUR", lang: "en", flag: "🇮🇪", continent: "Europe" },
  DE: { code: "DE", name: "Germany",         currency: "EUR", lang: "de", flag: "🇩🇪", continent: "Europe" },
  AT: { code: "AT", name: "Austria",         currency: "EUR", lang: "de", flag: "🇦🇹", continent: "Europe" },
  CH: { code: "CH", name: "Switzerland",     currency: "CHF", lang: "de", flag: "🇨🇭", continent: "Europe" },
  BE: { code: "BE", name: "Belgium",         currency: "EUR", lang: "fr", flag: "🇧🇪", continent: "Europe" },
  NL: { code: "NL", name: "Netherlands",     currency: "EUR", lang: "nl", flag: "🇳🇱", continent: "Europe" },
  LU: { code: "LU", name: "Luxembourg",      currency: "EUR", lang: "fr", flag: "🇱🇺", continent: "Europe" },
  FR: { code: "FR", name: "France",          currency: "EUR", lang: "fr", flag: "🇫🇷", continent: "Europe" },
  IT: { code: "IT", name: "Italy",           currency: "EUR", lang: "it", flag: "🇮🇹", continent: "Europe" },
  ES: { code: "ES", name: "Spain",           currency: "EUR", lang: "es", flag: "🇪🇸", continent: "Europe" },
  PT: { code: "PT", name: "Portugal",        currency: "EUR", lang: "pt", flag: "🇵🇹", continent: "Europe" },

  // ─── Nordics ─────────────────────────────────────────────────
  NO: { code: "NO", name: "Norway",          currency: "NOK", lang: "en", flag: "🇳🇴", continent: "Nordics" },
  SE: { code: "SE", name: "Sweden",          currency: "SEK", lang: "en", flag: "🇸🇪", continent: "Nordics" },
  FI: { code: "FI", name: "Finland",         currency: "EUR", lang: "en", flag: "🇫🇮", continent: "Nordics" },
  DK: { code: "DK", name: "Denmark",         currency: "DKK", lang: "en", flag: "🇩🇰", continent: "Nordics" },

  // ─── Central / Eastern Europe ────────────────────────────────
  PL: { code: "PL", name: "Poland",          currency: "PLN", lang: "en", flag: "🇵🇱", continent: "Europe" },
  CZ: { code: "CZ", name: "Czech Republic",  currency: "CZK", lang: "en", flag: "🇨🇿", continent: "Europe" },
  HU: { code: "HU", name: "Hungary",         currency: "HUF", lang: "en", flag: "🇭🇺", continent: "Europe" },
  SK: { code: "SK", name: "Slovakia",        currency: "EUR", lang: "en", flag: "🇸🇰", continent: "Europe" },
  HR: { code: "HR", name: "Croatia",         currency: "EUR", lang: "en", flag: "🇭🇷", continent: "Europe" },
  SI: { code: "SI", name: "Slovenia",        currency: "EUR", lang: "en", flag: "🇸🇮", continent: "Europe" },
  RS: { code: "RS", name: "Serbia",          currency: "RSD", lang: "en", flag: "🇷🇸", continent: "Europe" },
  GR: { code: "GR", name: "Greece",          currency: "EUR", lang: "en", flag: "🇬🇷", continent: "Europe" },
  BG: { code: "BG", name: "Bulgaria",        currency: "BGN", lang: "en", flag: "🇧🇬", continent: "Europe" },
  RO: { code: "RO", name: "Romania",         currency: "RON", lang: "en", flag: "🇷🇴", continent: "Europe" },
  EE: { code: "EE", name: "Estonia",         currency: "EUR", lang: "en", flag: "🇪🇪", continent: "Europe" },
  LV: { code: "LV", name: "Latvia",          currency: "EUR", lang: "en", flag: "🇱🇻", continent: "Europe" },
  LT: { code: "LT", name: "Lithuania",       currency: "EUR", lang: "en", flag: "🇱🇹", continent: "Europe" },
  CY: { code: "CY", name: "Cyprus",          currency: "EUR", lang: "en", flag: "🇨🇾", continent: "Europe" },
  MT: { code: "MT", name: "Malta",           currency: "EUR", lang: "en", flag: "🇲🇹", continent: "Europe" },

  // ─── Asia & Pacific ─────────────────────────────────────────
  JP: { code: "JP", name: "Japan",           currency: "JPY", lang: "ja", flag: "🇯🇵", continent: "Asia & Pacific" },
  HK: { code: "HK", name: "Hong Kong",       currency: "HKD", lang: "en", flag: "🇭🇰", continent: "Asia & Pacific" },
  AU: { code: "AU", name: "Australia",       currency: "AUD", lang: "en", flag: "🇦🇺", continent: "Asia & Pacific" },
  NZ: { code: "NZ", name: "New Zealand",     currency: "NZD", lang: "en", flag: "🇳🇿", continent: "Asia & Pacific" },

  // ─── Africa ─────────────────────────────────────────────────
  ZA: { code: "ZA", name: "South Africa",    currency: "ZAR", lang: "en", flag: "🇿🇦", continent: "Africa" },
};

export const REGION_LIST: Region[] = Object.values(REGIONS);

// Grouped by continent for UI dropdowns.
export const REGIONS_BY_CONTINENT: Array<{ continent: Continent; regions: Region[] }> = (() => {
  const groups: Record<Continent, Region[]> = {
    Americas: [],
    Europe: [],
    Nordics: [],
    "Asia & Pacific": [],
    Africa: [],
  };
  for (const r of REGION_LIST) groups[r.continent].push(r);
  for (const list of Object.values(groups)) list.sort((a, b) => a.name.localeCompare(b.name));
  const order: Continent[] = ["Americas", "Europe", "Nordics", "Asia & Pacific", "Africa"];
  return order.map((continent) => ({ continent, regions: groups[continent] }));
})();

export function getRegion(code: string): Region | undefined {
  return REGIONS[code as RegionCode];
}

// Format a price in the region's native currency with correct locale.
export function formatPrice(amount: number | null | undefined, currency: string): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  const zeroDecimal = new Set(["JPY", "KRW", "CLP", "COP", "HUF", "ISK"]);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: zeroDecimal.has(currency) ? 0 : 2,
      maximumFractionDigits: zeroDecimal.has(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
