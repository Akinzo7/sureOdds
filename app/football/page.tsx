// ============================================================
// app/football/page.tsx  —  FULL REPLACEMENT
// ============================================================
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { analyzeFixtureWithRealData, AnalyzedFixture } from "@/lib/logic-engine";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Cached analysis function — defined at MODULE LEVEL (outside the component).
//
// Why this matters:
//   Without this cache, every single page visit fires up to 20 API-Sports
//   requests. The free tier gives only 100 requests/day total, so 5 visitors
//   exhaust the quota and everyone else sees an empty dashboard.
//
//   unstable_cache stores the result server-side for 86400s (24 hours).
//   The cache key includes the fixture IDs + today's date, so it
//   automatically refreshes each day when new fixtures are loaded.
//
// The API key is read from process.env INSIDE the cached function —
// NOT passed as an argument — so it never appears in the cache key.
// ─────────────────────────────────────────────────────────────────────────────
const getCachedAnalyzedFixtures = unstable_cache(
  async (fixtureIds: number[]): Promise<AnalyzedFixture[]> => {
    // We need the raw fixture objects, but unstable_cache only gets what we
    // pass as args. We re-fetch from Supabase inside the cache using the IDs.
    // This keeps the cache key small (just IDs) and avoids passing secrets.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const apiSportsKey = process.env.API_SPORTS_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: fixtures } = await supabase
      .from("fixtures")
      .select("*")
      .in("fixture_id", fixtureIds);

    if (!fixtures?.length) return [];

    const results = await Promise.all(
      fixtures.map((match) => analyzeFixtureWithRealData(match, apiSportsKey))
    );

    return results.filter((r): r is AnalyzedFixture => r !== null);
  },
  // Cache key prefix — Next.js appends the serialized args automatically
  ["analyzed-football-fixtures"],
  {
    revalidate: 86400, // 24 hours
    tags: ["football-fixtures"],
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default async function FootballDashboardServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="py-20 text-center text-red-500">Credentials Missing</div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get today's fixtures from DB
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .gte("match_date", today.toISOString());

  if (error || !fixtures) {
    return <div className="py-20 text-center text-red-500">Error loading fixtures</div>;
  }

  if (fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">No fixtures today</p>
        <p className="mt-1 text-sm text-muted">
          Check back later — fixtures are loaded automatically each night.
        </p>
      </div>
    );
  }

  // ── Prioritise elite leagues ───────────────────────────
  const isTopLeague = (leagueName: string) => {
    if (!leagueName) return false;
    const lower = leagueName.toLowerCase();
    return (
      lower.includes("uefa champions league") ||
      lower.includes("uefa europa league") ||
      lower.includes("uefa conference league") ||
      lower === "premier league" ||        // exact match avoids "X Premier League"
      lower === "la liga" ||
      lower === "serie a" ||
      lower === "bundesliga" ||
      lower === "ligue 1" ||
      lower.includes("eredivisie")
    );
  };

  const sortedFixtures = [...fixtures].sort((a, b) => {
    const aTop = isTopLeague(a.league_name) ? -1 : 1;
    const bTop = isTopLeague(b.league_name) ? -1 : 1;
    if (aTop !== bTop) return aTop - bTop;
    return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
  });

  // Take top 20 fixture IDs to use as the cache key
  const topFixtureIds = sortedFixtures
    .slice(0, 20)
    .map((f) => f.fixture_id as number);

  // This call is cached — only hits the API once per day per set of fixture IDs
  const genuineFixtures = await getCachedAnalyzedFixtures(topFixtureIds);

  if (genuineFixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">
          Predictions unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          The prediction API did not return data for today&apos;s fixtures.
          This usually means the daily API quota has been reached — try again
          tomorrow.
        </p>
      </div>
    );
  }

  return <DashboardClient fixtures={genuineFixtures} />;
}