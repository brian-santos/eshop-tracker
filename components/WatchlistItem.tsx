"use client";

import type { WatchItem } from "@/lib/types";
import { REGIONS, formatPrice } from "@/lib/regions";

interface Props {
  item: WatchItem;
  onDelete: (id: string) => void;
}

export default function WatchlistItem({ item, onDelete }: Props) {
  const region = REGIONS[item.region];
  const currency = item.currency ?? region.currency;
  const atOrBelow =
    item.currentPrice != null && item.currentPrice <= item.threshold;
  const thresholdDelta =
    item.currentPrice != null
      ? ((item.currentPrice - item.threshold) / item.threshold) * 100
      : null;

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        atOrBelow
          ? "border-flame/50 bg-flame/[0.03]"
          : "border-ink-800 bg-ink-900/30 hover:border-ink-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-medium leading-tight text-ink-100">
              {item.title}
            </h3>
            {item.onSale && <span className="sale-pill">on sale</span>}
            {atOrBelow && <span className="alert-pill">🎯 at target</span>}
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-ink-400">
            <span>
              {region.flag} {region.name}
            </span>
            <span className="text-ink-600">·</span>
            <span>target {formatPrice(item.threshold, currency)}</span>
            {item.saleEnds && (
              <>
                <span className="text-ink-600">·</span>
                <span className="text-acid/80">
                  sale ends {formatDate(item.saleEnds)}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          aria-label="Remove"
          className="shrink-0 rounded p-1.5 text-ink-500 hover:bg-ink-800 hover:text-flame"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <div
          className={`font-mono text-3xl tracking-tight ${
            atOrBelow ? "text-flame" : "text-ink-100"
          }`}
        >
          {formatPrice(item.currentPrice, currency)}
        </div>
        {item.regularPrice != null &&
          item.currentPrice != null &&
          item.regularPrice > item.currentPrice && (
            <div className="font-mono text-sm text-ink-500 line-through">
              {formatPrice(item.regularPrice, currency)}
            </div>
          )}
        {item.usdEquivalent != null && currency !== "USD" && (
          <div className="ml-auto font-mono text-sm text-ink-400">
            ≈ {formatPrice(item.usdEquivalent, "USD")}
          </div>
        )}
      </div>

      {thresholdDelta != null && item.currentPrice != null && !atOrBelow && (
        <div className="mt-2 font-mono text-[11px] text-ink-500">
          {thresholdDelta > 0 ? "+" : ""}
          {thresholdDelta.toFixed(0)}% vs target
        </div>
      )}
    </article>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}
