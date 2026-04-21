"use client";

import { useState } from "react";
import type { RegionCode } from "@/lib/types";
import { REGIONS, formatPrice } from "@/lib/regions";

interface Match {
  nsuid: string;
  region: RegionCode;
  currentPrice: number | null;
  regularPrice: number | null;
  onSale: boolean;
  currency: string | null;
}

interface Props {
  onSubmit: (input: {
    title: string;
    nsuid: string;
    region: RegionCode;
    threshold: number;
  }) => Promise<void>;
}

export default function AddGameForm({ onSubmit }: Props) {
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionCode | "">("");
  const [threshold, setThreshold] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<"query" | "pick">("query");

  const nsuid = matches[0]?.nsuid ?? "";
  const selectedMatch = matches.find((m) => m.region === selectedRegion);

  async function handleLookup(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/lookup?q=${encodeURIComponent(query.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMatches(data.matches ?? []);
      setStep("pick");
      // Default selected region: the one with the lowest USD-ish price, bias toward user-familiar regions
      const preferred = (["US", "HK", "JP", "GB", "AU"] as RegionCode[])
        .find((r) => data.matches.some((m: Match) => m.region === r));
      setSelectedRegion(preferred ?? data.matches[0]?.region ?? "");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!selectedRegion || !selectedMatch || !title.trim()) return;
    const parsed = parseFloat(threshold);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErr("Threshold must be a positive number");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({
        title: title.trim(),
        nsuid,
        region: selectedRegion,
        threshold: parsed,
      });
      // Reset
      setQuery("");
      setTitle("");
      setMatches([]);
      setSelectedRegion("");
      setThreshold("");
      setStep("query");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "query") {
    return (
      <form onSubmit={handleLookup} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-400">
            eShop URL or NSUID
          </span>
          <input
            type="text"
            inputMode="url"
            placeholder="https://www.nintendo.com/… or 70010000001130"
            value={query}
            onChange={(e: { target: { value: string } }) => setQuery(e.target.value)}
            className="input"
            required
          />
          <span className="mt-1.5 block text-[11px] text-ink-500">
            Tip: find the URL on eshop-prices.com, dekudeals.com, or Nintendo's
            store page for the game.
          </span>
        </label>

        {err && (
          <div className="rounded-md border border-flame/30 bg-flame/5 p-2.5 text-sm text-flame">
            {err}
          </div>
        )}

        <button type="submit" disabled={busy || !query.trim()} className="btn-primary w-full">
          {busy ? "Checking…" : "Find game"}
        </button>
      </form>
    );
  }

  // Pick step
  return (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="rounded-md border border-ink-700 bg-ink-900/40 p-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
          found in {matches.length} region{matches.length === 1 ? "" : "s"} · nsuid{" "}
          <span className="text-ink-300">{nsuid}</span>
        </div>
        <div className="mt-2 max-h-48 overflow-y-auto">
          {matches
            .slice()
            .sort((a, b) => REGIONS[a.region].name.localeCompare(REGIONS[b.region].name))
            .map((m) => {
              const meta = REGIONS[m.region];
              return (
                <label
                  key={m.region}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-sm hover:bg-ink-800/50 ${
                    selectedRegion === m.region ? "bg-ink-800/70" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="region"
                      value={m.region}
                      checked={selectedRegion === m.region}
                      onChange={() => setSelectedRegion(m.region)}
                      className="accent-flame"
                    />
                    <span>{meta.flag}</span>
                    <span className="text-ink-200">{meta.name}</span>
                    {m.onSale && <span className="sale-pill">sale</span>}
                  </span>
                  <span className="font-mono text-ink-100">
                    {formatPrice(m.currentPrice, m.currency ?? meta.currency)}
                  </span>
                </label>
              );
            })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-400">
          Game title (for your watchlist)
        </span>
        <input
          type="text"
          placeholder="e.g. Hollow Knight"
          value={title}
          onChange={(e: { target: { value: string } }) => setTitle(e.target.value)}
          className="input"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-400">
          Alert threshold ({selectedMatch?.currency ?? REGIONS[selectedRegion || "US"]?.currency ?? "USD"})
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder={selectedMatch?.currentPrice ? String(Math.round(selectedMatch.currentPrice * 0.7 * 100) / 100) : ""}
          value={threshold}
          onChange={(e: { target: { value: string } }) => setThreshold(e.target.value)}
          className="input"
          required
        />
        {selectedMatch?.currentPrice != null && (
          <span className="mt-1.5 block text-[11px] text-ink-500">
            Current price: {formatPrice(selectedMatch.currentPrice, selectedMatch.currency ?? "")}. You'll be alerted when it hits or drops below your threshold.
          </span>
        )}
      </label>

      {err && (
        <div className="rounded-md border border-flame/30 bg-flame/5 p-2.5 text-sm text-flame">
          {err}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setStep("query");
            setMatches([]);
            setErr(null);
          }}
          className="btn-ghost"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={busy || !selectedRegion || !title.trim() || !threshold}
          className="btn-primary flex-1"
        >
          {busy ? "Saving…" : "Add to watchlist"}
        </button>
      </div>
    </form>
  );
}
