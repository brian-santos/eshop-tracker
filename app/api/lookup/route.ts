import { NextRequest, NextResponse } from "next/server";
import { extractNsuidFromUrl, fetchPrices, extractPrice } from "@/lib/nintendo";
import { getRegion, REGION_LIST } from "@/lib/regions";
import type { RegionCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/lookup?q=...&region=XX
 *
 * `q` can be any of:
 *   - a bare 14-digit NSUID
 *   - any Nintendo eShop URL containing the NSUID
 *   - raw text containing the NSUID anywhere
 *
 * If `region` is provided, we verify the NSUID exists in that region.
 * If `region` is omitted, we probe ALL configured regions in parallel and
 * return every region where the NSUID is currently listed — so the UI can
 * show the user cross-region pricing at a glance.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const regionParam = req.nextUrl.searchParams.get("region")?.toUpperCase();
  const nsuid = extractNsuidFromUrl(q);
  if (!nsuid) {
    return NextResponse.json(
      { error: "Could not find a 14-digit NSUID in the input" },
      { status: 400 },
    );
  }

  const probeRegions: RegionCode[] =
    regionParam && getRegion(regionParam)
      ? [regionParam as RegionCode]
      : REGION_LIST.map((r) => r.code);

  const results = await Promise.all(
    probeRegions.map(async (region) => {
      try {
        const res = await fetchPrices(region, [nsuid]);
        const p = res.prices[0];
        if (!p || p.sales_status === "not_found") return null;
        const ext = extractPrice(p);
        if (ext.currentPrice == null) return null;
        return { nsuid, region, ...ext };
      } catch {
        return null;
      }
    }),
  );

  const found = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (found.length === 0) {
    return NextResponse.json(
      {
        error: `NSUID ${nsuid} not found in any supported region`,
        nsuid,
      },
      { status: 404 },
    );
  }
  return NextResponse.json({ nsuid, matches: found });
}
