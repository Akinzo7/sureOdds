// ============================================================
// app/football/page.tsx — Server Component
// ============================================================
import { createServerSupabaseClient, getApiSportsKey } from '@/lib/supabase-server';
import {
  analyzeFixtureWithRealData,
  processWithConcurrency,
  AnalyzedFixture,
} from '@/lib/logic-engine';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Football Analytics — SureOdds',
  description:
    'AI-powered football match predictions across Over/Under, BTTS, and Straight Win markets.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default async function FootballDashboardServer() {
  let supabase;
  let apiSportsKey: string;

  try {
    supabase = createServerSupabaseClient();
    apiSportsKey = getApiSportsKey();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-accent-red">Configuration Error</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
    );
  }

  // Get today's fixtures from DB
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: fixtures, error } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today.toISOString());

  if (error) {
    console.error('[football/page] Supabase query error:', error);
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-accent-red">Error loading fixtures</p>
        <p className="mt-1 text-sm text-muted">{error.message}</p>
      </div>
    );
  }

  if (!fixtures || fixtures.length === 0) {
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
      lower.includes('uefa champions league') ||
      lower.includes('uefa europa league') ||
      lower.includes('uefa conference league') ||
      lower === 'premier league' ||
      lower === 'la liga' ||
      lower === 'serie a' ||
      lower === 'bundesliga' ||
      lower === 'ligue 1' ||
      lower.includes('eredivisie')
    );
  };

  const sortedFixtures = [...fixtures].sort((a, b) => {
    const aTop = isTopLeague(a.league_name) ? -1 : 1;
    const bTop = isTopLeague(b.league_name) ? -1 : 1;
    if (aTop !== bTop) return aTop - bTop;
    return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
  });

  // Take top 20 fixtures to stay within free-tier API limits
  const topFixtures = sortedFixtures.slice(0, 20);

  // ── Analyze with concurrency control (3 at a time, 300ms delay) ────
  let genuineFixtures: AnalyzedFixture[];
  try {
    const results = await processWithConcurrency(
      topFixtures,
      (match) => analyzeFixtureWithRealData(match, apiSportsKey),
      3,
      300
    );
    genuineFixtures = results.filter((r): r is AnalyzedFixture => r !== null);
  } catch (error) {
    console.error('[football/page] Analysis failed:', error);
    genuineFixtures = [];
  }

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