import { createClient } from "@supabase/supabase-js";
import { analyzeBasketballFixture } from "@/lib/logic-engine";
import BasketballDashboardClient from "./BasketballDashboardClient";

export const dynamic = "force-dynamic";

export default async function BasketballPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="flex justify-center py-20 text-red-500">
        Supabase Credentials Missing. Check .env.local
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all basketball fixtures
  const { data: fixtures, error } = await supabase
    .from("basketball_fixtures")
    .select("*")
    .order("match_date", { ascending: true });

  if (error || !fixtures) {
    return <div className="p-8 text-red-500">Error loading fixtures: {error?.message}</div>;
  }

  // Pass through analyzeBasketballFixture
  const analyzedFixtures = fixtures.map(analyzeBasketballFixture);

  return <BasketballDashboardClient fixtures={analyzedFixtures} />;
}
