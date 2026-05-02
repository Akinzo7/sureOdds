// ============================================================
// app/basketball/page.tsx — Server Component
// ============================================================
import { createServerSupabaseClient, getApiSportsKey } from '@/lib/supabase-server';
import {
  analyzeBasketballFixtureWithRealData,
  processWithConcurrency,
  AnalyzedBasketballFixture,
} from '@/lib/logic-engine';
import BasketballDashboardClient from './BasketballDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Basketball Analytics — SureOdds',
  description:
    'AI-powered basketball predictions for moneyline, point spread, and total points markets.',
};

export default async function BasketballPage() {
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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: fixtures, error } = await supabase
    .from('basketball_fixtures')
    .select('*')
    .gte('match_date', today.toISOString())
    .order('match_date', { ascending: true });

  if (error) {
    console.error('[basketball/page] Supabase query error:', error);
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
        <p className="text-lg font-medium text-foreground">No games today</p>
        <p className="mt-1 text-sm text-muted">
          Check back later — basketball fixtures are loaded automatically each night.
        </p>
      </div>
    );
  }

  // Process a safe amount of matches to protect your 100/day free API limit
  const matchesToAnalyze = fixtures.slice(0, 20);

  // Analyze with concurrency control (3 at a time, 300ms delay between batches)
  let genuineFixtures: AnalyzedBasketballFixture[];
  try {
    const rawResults = await processWithConcurrency(
      matchesToAnalyze,
      (match) => analyzeBasketballFixtureWithRealData(match, apiSportsKey),
      3,
      300
    );
    genuineFixtures = rawResults.filter(
      (match): match is AnalyzedBasketballFixture => match !== null
    );
  } catch (error) {
    console.error('[basketball/page] Analysis failed:', error);
    genuineFixtures = [];
  }

  if (genuineFixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">
          Predictions unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          The prediction API did not return data for today&apos;s games.
          This usually means the daily API quota has been reached — try again tomorrow.
        </p>
      </div>
    );
  }

  return <BasketballDashboardClient fixtures={genuineFixtures} />;
}