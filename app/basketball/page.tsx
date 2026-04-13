import { createClient } from "@supabase/supabase-js";
import { analyzeBasketballFixture, analyzeBasketballFixtureWithRealData } from "@/lib/logic-engine";
import BasketballDashboardClient from "./BasketballDashboardClient";

export const dynamic = "force-dynamic";

export default async function BasketballPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const apiSportsKey = process.env.API_SPORTS_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="flex justify-center py-20 text-red-500">
        Supabase Credentials Missing. Check .env.local
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch raw basketball games from Supabase
  const { data: fixtures, error } = await supabase
    .from("basketball_fixtures")
    .select("*")
    .order("match_date", { ascending: true });

  if (error || !fixtures) {
    return <div className="p-8 text-red-500">Error loading fixtures: {error?.message}</div>;
  }

  // 2. THE HYBRID STRATEGY: Grab top 3 matches for the real API
  const topMatches = fixtures.slice(0, 3);
  const remainingMatches = fixtures.slice(3);

  // 3. Process top 3 matches through the REAL Vegas Odds Engine
  const realAnalyzedFixtures = await Promise.all(
    topMatches.map((match) => analyzeBasketballFixtureWithRealData(match, apiSportsKey))
  );

  // 4. Process the remaining matches through the fallback mock engine
  const mockAnalyzedFixtures = remainingMatches.map(analyzeBasketballFixture);

  // 5. Combine and send to the client UI
  const fullyAnalyzedFixtures = [...realAnalyzedFixtures, ...mockAnalyzedFixtures];

  return <BasketballDashboardClient fixtures={fullyAnalyzedFixtures} />;
}