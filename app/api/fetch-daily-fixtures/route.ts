import { NextResponse, NextRequest } from 'next/server';
import { createServerSupabaseClient, getApiSportsKey } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // ── Authentication: Verify Vercel Cron Secret ──────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[fetch-daily-fixtures] CRON_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: CRON_SECRET not set' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── Environment ────────────────────────────────────────────────────
    const supabase = createServerSupabaseClient();
    const apiSportsKey = getApiSportsKey();

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    // Fetch fixtures from API-Sports
    const apiResponse = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${formattedDate}`,
      {
        method: 'GET',
        headers: { 'x-apisports-key': apiSportsKey },
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`API-Sports responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Guard against API-level errors (e.g. quota exceeded)
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('[fetch-daily-fixtures] API-Sports Error:', data.errors);
      return NextResponse.json(
        { success: false, error: 'API-Sports returned an error', details: data.errors },
        { status: 400 }
      );
    }

    const fixtures: Array<Record<string, unknown>> = data.response;

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        message: 'No fixtures found for today',
      });
    }

    // Map external data to our Supabase `fixtures` table schema
    const mappedFixtures = fixtures.map((item: any) => ({
      fixture_id: item.fixture.id,
      sport_type: 'soccer',
      match_date: item.fixture.date,
      home_team_id: item.teams.home.id,
      away_team_id: item.teams.away.id,
      home_team_name: item.teams.home.name,
      away_team_name: item.teams.away.name,
      status: item.fixture.status.short,
      league_name: item.league.name,
    }));

    // Upsert into Supabase (fixture_id must have a UNIQUE constraint)
    const { error: upsertError } = await supabase
      .from('fixtures')
      .upsert(mappedFixtures, { onConflict: 'fixture_id' });

    if (upsertError) {
      console.error('[fetch-daily-fixtures] Upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Database upsert failed', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched and upserted daily fixtures',
      inserted: mappedFixtures.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[fetch-daily-fixtures] Internal error:', message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}
