import type { NintendoPriceResponse, RegionCode } from "./types";
import { REGIONS } from "./regions";

const NINTENDO_PRICE_ENDPOINT = "https://api.ec.nintendo.com/v1/price";

/**
 * Fetch current prices for a set of NSUIDs in a given region.
 * Nintendo's API accepts up to 50 ids per request.
 */
export async function fetchPrices(
  region: RegionCode,
  nsuids: string[],
): Promise<NintendoPriceResponse> {
  if (nsuids.length === 0) {
    return { personalized: false, country: region, prices: [] };
  }
  const r = REGIONS[region];
  if (!r) throw new Error(`Unknown region: ${region}`);

  const url = new URL(NINTENDO_PRICE_ENDPOINT);
  url.searchParams.set("country", region);
  url.searchParams.set("lang", r.lang);
  url.searchParams.set("ids", nsuids.slice(0, 50).join(","));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "eshop-tracker/1.0 (+https://github.com)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Nintendo API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as NintendoPriceResponse;
}

/**
 * Extract the effective current price from a Nintendo price entry.
 * Returns null if game is unreleased / not for sale in this region.
 */
export function extractPrice(
  priceEntry: NintendoPriceResponse["prices"][number],
): {
  currentPrice: number | null;
  regularPrice: number | null;
  onSale: boolean;
  saleEnds: string | null;
  currency: string | null;
} {
  const regular = priceEntry.regular_price?.raw_value
    ? parseFloat(priceEntry.regular_price.raw_value)
    : null;
  const discount = priceEntry.discount_price?.raw_value
    ? parseFloat(priceEntry.discount_price.raw_value)
    : null;
  const onSale = discount !== null && (regular === null || discount < regular);
  return {
    currentPrice: onSale ? discount : regular,
    regularPrice: regular,
    onSale,
    saleEnds: onSale ? priceEntry.discount_price?.end_datetime ?? null : null,
    currency:
      priceEntry.regular_price?.currency ??
      priceEntry.discount_price?.currency ??
      null,
  };
}

/**
 * Search EU Nintendo catalog. This is a best-effort helper that returns
 * EU-region NSUIDs. For other regions, the user typically pastes an NSUID
 * from eshop-prices.com or similar.
 */
export async function searchEU(query: string): Promise<
  Array<{ title: string; nsuid: string; image: string | null }>
> {
  const url = new URL("https://searching.nintendo-europe.com/en/select");
  url.searchParams.set("q", query);
  url.searchParams.set(
    "fq",
    'type:GAME_WRAPPER AND (system_names_txt:"Nintendo Switch" OR system_names_txt:"Nintendo Switch 2")',
  );
  url.searchParams.set("rows", "10");
  url.searchParams.set("wt", "json");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      response?: {
        docs?: Array<{
          title?: string;
          nsuid_txt?: string[];
          image_url?: string;
          image_url_sq_s?: string;
        }>;
      };
    };
    const docs = data.response?.docs ?? [];
    return docs
      .filter((d) => d.nsuid_txt?.[0] && d.title)
      .map((d) => ({
        title: d.title!,
        nsuid: d.nsuid_txt![0]!,
        image: d.image_url_sq_s ?? d.image_url ?? null,
      }));
  } catch {
    return [];
  }
}

/**
 * Parse an NSUID out of a Nintendo eShop URL or return null if none found.
 * Handles formats like:
 *  - https://ec.nintendo.com/US/en/titles/70010000XXXXXX
 *  - https://store-jp.nintendo.com/list/software/70010000XXXXXX.html
 */
export function extractNsuidFromUrl(input: string): string | null {
  const trimmed = input.trim();
  // NSUIDs are 14 digits starting with 7.
  const match = trimmed.match(/\b(7\d{13})\b/);
  return match ? match[1] : null;
}
