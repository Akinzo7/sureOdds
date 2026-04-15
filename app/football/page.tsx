import { createClient } from "@supabase/supabase-js";
import { analyzeFixtureWithRealData, AnalyzedFixture } from "@/lib/logic-engine";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function FootballDashboardServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const apiSportsKey = process.env.API_SPORTS_KEY!;

  if (!supabaseUrl || !supabaseKey) return <div className="py-20 text-center text-red-500">Credentials Missing</div>;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .gte("match_date", today.toISOString());

  if (error || !fixtures) return <div>Error loading fixtures</div>;

  // 1. DEFINE ELITE LEAGUES (Where ML stats are most accurate)
  const topLeagues = [
    "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", 
    "UEFA Champions League", "UEFA Europa League", "Eredivisie", "Primeira Liga"
  ];

  // 2. SORT fixtures: Top leagues first, then by date
  const sortedFixtures = fixtures.sort((a, b) => {
    const aIsTop = topLeagues.includes(a.league_name) ? -1 : 1;
    const bIsTop = topLeagues.includes(b.league_name) ? -1 : 1;
    if (aIsTop !== bIsTop) return aIsTop - bIsTop;
    return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
  });

  // 3. ONLY process the top 20 most reliable matches of the day to save your limit
  const matchesToAnalyze = sortedFixtures.slice(0, 20);

  const rawResults = await Promise.all(
    matchesToAnalyze.map((match) => analyzeFixtureWithRealData(match, apiSportsKey))
  );

  const genuineFixtures = rawResults.filter((match): match is AnalyzedFixture => match !== null);

  return <DashboardClient fixtures={genuineFixtures} />;
}