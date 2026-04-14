import { createClient } from "@supabase/supabase-js";
import { analyzeFixture, analyzeFixtureWithRealData } from "@/lib/logic-engine";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function FootballDashboardServer() {
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

  // Get midnight today to filter out old games
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch the raw fixtures from your database (Today and Future ONLY)
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .gte("match_date", today.toISOString()) // <-- NEW LINE HERE
    .order("match_date", { ascending: true });

  if (error || !fixtures) {
    return <div className="p-8 text-red-500">Error loading fixtures: {error?.message}</div>;
  }

  // 2. THE HYBRID STRATEGY
  const topMatchesToAnalyzeDeeply = fixtures.slice(0, 3);
  const remainingMatches = fixtures.slice(3);

  // 3. Run the top 3 matches through the REAL API-Sports Prediction Engine
  const realAnalyzedFixtures = await Promise.all(
    topMatchesToAnalyzeDeeply.map((match) => analyzeFixtureWithRealData(match, apiSportsKey))
  );

  // 4. Run the remaining matches through the seeded mock engine
  const mockAnalyzedFixtures = remainingMatches.map(analyzeFixture);

  // 5. Combine them back together
  const fullyAnalyzedFixtures = [...realAnalyzedFixtures, ...mockAnalyzedFixtures];

  // 6. Pass the combined, intelligent data to your beautiful UI
  return <DashboardClient fixtures={fullyAnalyzedFixtures} />;
}