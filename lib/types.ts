// Core domain types for the eShop tracker.

export type RegionCode =
  // Americas
  | "US" | "CA" | "MX" | "AR" | "BR" | "CL" | "CO" | "PE"
  // Western / Central Europe
  | "GB" | "IE" | "DE" | "AT" | "CH" | "BE" | "NL" | "LU"
  | "FR" | "IT" | "ES" | "PT"
  // Nordics
  | "NO" | "SE" | "FI" | "DK"
  // Central / Eastern Europe
  | "PL" | "CZ" | "HU" | "SK" | "HR" | "SI" | "RS"
  | "GR" | "BG" | "RO" | "EE" | "LV" | "LT" | "CY" | "MT"
  // Asia / Pacific
  | "JP" | "HK" | "AU" | "NZ"
  // Africa
  | "ZA";

export type Continent =
  | "Americas"
  | "Europe"
  | "Nordics"
  | "Asia & Pacific"
  | "Africa";

export interface Region {
  code: RegionCode;
  name: string;
  currency: string;   // ISO 4217 currency code
  lang: string;       // language code for Nintendo API
  flag: string;       // emoji
  continent: Continent;
}

export interface WatchItem {
  id: string;                 // internal uuid
  title: string;              // user-provided game title
  nsuid: string;              // 14-digit Nintendo NSUID
  region: RegionCode;
  threshold: number;          // in native currency (major units, e.g. 5.99)
  createdAt: number;          // ms since epoch
  // runtime-populated fields (returned by API but not stored)
  currentPrice?: number | null;
  regularPrice?: number | null;
  onSale?: boolean;
  saleEnds?: string | null;
  currency?: string;
  usdEquivalent?: number | null;
  lastChecked?: number;
}

export interface NintendoPriceResponse {
  personalized: boolean;
  country: string;
  prices: Array<{
    title_id: number;
    sales_status: "onsale" | "not_found" | "sales_termination" | "unreleased" | string;
    regular_price?: { amount: string; currency: string; raw_value: string };
    discount_price?: {
      amount: string;
      currency: string;
      raw_value: string;
      start_datetime: string;
      end_datetime: string;
    };
  }>;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: number;
}
