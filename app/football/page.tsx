import { createClient } from "@supabase/supabase-js";
import { analyzeFixture } from "@/lib/logic-engine";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function FootballDashboardServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="text-lg font-medium text-accent-red">
          Supabase Credentials Missing
        </p>
        <p className="mt-1 text-sm text-muted">
          Please check your environment variables.
        </p>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .order("match_date", { ascending: true });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="text-lg font-medium text-accent-red">
          Error loading fixtures
        </p>
        <p className="mt-1 text-sm text-muted">
          {error.message}
        </p>
      </div>
    );
  }

  // Pass through the logic engine
  const analyzedFixtures = (fixtures || []).map(analyzeFixture);

  return <DashboardClient fixtures={analyzedFixtures} />;
}
