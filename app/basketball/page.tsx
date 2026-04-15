import { createClient } from "@supabase/supabase-js";
import { analyzeBasketballFixtureWithRealData, AnalyzedBasketballFixture } from "@/lib/logic-engine";
import BasketballDashboardClient from "./BasketballDashboardClient";

export const dynamic = "force-dynamic";

export default async function BasketballPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const apiSportsKey = process.env.API_SPORTS_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return <div className="py-20 text-center text-red-500">Credentials Missing</div>;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: fixtures, error } = await supabase
    .from("basketball_fixtures")
    .select("*")
    .gte("match_date", today.toISOString())
    .order("match_date", { ascending: true });

  if (error || !fixtures) return <div>Error loading fixtures</div>;

  // Process a safe amount of matches to protect your 100/day free API limit
  const matchesToAnalyze = fixtures.slice(0, 20);

  // ONLY USE THE REAL VEGAS API
  const rawResults = await Promise.all(
    matchesToAnalyze.map((match) => analyzeBasketballFixtureWithRealData(match, apiSportsKey))
  );

  // FILTER OUT ANY MATCHES THAT DIDN'T GET REAL DATA
  const genuineFixtures = rawResults.filter((match): match is AnalyzedBasketballFixture => match !== null);

  return <BasketballDashboardClient fixtures={genuineFixtures} />;
}