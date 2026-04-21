"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WatchItem, RegionCode } from "@/lib/types";
import { REGIONS } from "@/lib/regions";
import AddGameForm from "@/components/AddGameForm";
import WatchlistItem from "@/components/WatchlistItem";
import NotificationToggle from "@/components/NotificationToggle";

export default function Home() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(
    async (input: {
      title: string;
      nsuid: string;
      region: RegionCode;
      threshold: number;
    }) => {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      await load();
    },
    [load],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/watchlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await load();
    },
    [load],
  );

  const stats = useMemo(() => {
    const onSale = items.filter((i) => i.onSale).length;
    const belowThreshold = items.filter(
      (i) => i.currentPrice != null && i.currentPrice <= i.threshold,
    ).length;
    return { total: items.length, onSale, belowThreshold };
  }, [items]);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-[env(safe-area-inset-top)]">
      <Header stats={stats} />

      <div className="rule my-6" />

      <NotificationToggle />

      <div className="rule my-6" />

      <section aria-label="Add game">
        <SectionHeading label="01 — add a game" />
        <AddGameForm onSubmit={handleAdd} />
      </section>

      <div className="rule my-8" />

      <section aria-label="Watchlist">
        <div className="flex items-baseline justify-between mb-4">
          <SectionHeading label={`02 — watchlist (${items.length})`} />
          <button
            onClick={load}
            className="font-mono text-[11px] uppercase tracking-wider text-ink-400 hover:text-ink-100"
          >
            {loading ? "refreshing…" : "refresh ↻"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-flame/30 bg-flame/5 p-3 text-sm text-flame">
            Error loading: {error}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-md border border-dashed border-ink-700 p-8 text-center text-ink-400 font-mono text-sm">
            No games yet. Add one above to start watching.
          </div>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <WatchlistItem item={item} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}

function Header({ stats }: { stats: { total: number; onSale: number; belowThreshold: number } }) {
  return (
    <header className="pt-10">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-400">
        <span className="inline-block h-2 w-2 rounded-full bg-flame animate-pulse" />
        eshop price watch
      </div>
      <h1 className="mt-3 font-display text-5xl font-medium leading-[0.95] tracking-tight text-ink-100">
        catch the <span className="italic text-flame">drop</span>.
      </h1>
      <p className="mt-3 max-w-md text-ink-300">
        Watch Nintendo eShop prices across every region. Get pushed the moment a
        game crosses your threshold.
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-3 font-mono text-sm">
        <Stat label="watching" value={stats.total} />
        <Stat label="on sale" value={stats.onSale} accent="acid" />
        <Stat label="at target" value={stats.belowThreshold} accent="flame" />
      </dl>
    </header>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "acid" | "flame";
}) {
  const color =
    accent === "flame"
      ? "text-flame"
      : accent === "acid"
        ? "text-acid"
        : "text-ink-100";
  return (
    <div className="rounded-md border border-ink-700 bg-ink-900/40 px-3 py-2.5">
      <dt className="text-[10px] uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className={`mt-0.5 text-2xl font-medium ${color}`}>{value}</dd>
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">
      {label}
    </h2>
  );
}

function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-start gap-2 border-t border-ink-800 pt-6 font-mono text-[11px] text-ink-500">
      <div>
        Prices from{" "}
        <a href="https://api.ec.nintendo.com" className="underline hover:text-ink-300">
          api.ec.nintendo.com
        </a>
        . Rates from{" "}
        <a href="https://open.er-api.com" className="underline hover:text-ink-300">
          open.er-api.com
        </a>
        .
      </div>
      <div>
        Supports {Object.keys(REGIONS).length} regions · checks run hourly.
      </div>
    </footer>
  );
}
