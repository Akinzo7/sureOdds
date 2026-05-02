import { NextResponse, NextRequest } from 'next/server';
import { createServerSupabaseClient, getApiSportsKey } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // ── Authentication: Verify Vercel Cron Secret ──────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[fetch-basketball-fixtures] CRON_SECRET not configured');
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

    // Fetch games from API-Basketball
    const apiResponse = await fetch(
      `https://v1.basketball.api-sports.io/games?date=${formattedDate}`,
      {
        method: 'GET',
        headers: { 'x-apisports-key': apiSportsKey },
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`API-Basketball responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Guard against API-level errors (e.g. quota exceeded)
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('[fetch-basketball-fixtures] API-Basketball Error:', data.errors);
      return NextResponse.json(
        { success: false, error: 'API-Basketball returned an error', details: data.errors },
        { status: 400 }
      );
    }

    const games: Array<Record<string, unknown>> = data.response;

    if (!games || games.length === 0) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        message: 'No basketball games found for today.',
      });
    }

    // Map external data to our Supabase `basketball_fixtures` table schema
    const mappedGames = games.map((item: any) => ({
      fixture_id: item.id,
      sport_type: 'basketball',
      match_date: item.date,
      home_team_id: item.teams.home.id,
      away_team_id: item.teams.away.id,
      home_team_name: item.teams.home.name,
      away_team_name: item.teams.away.name,
      status: item.status.short,
      league_name: item.league.name,
    }));

    // Upsert into Supabase (fixture_id must have a UNIQUE constraint)
    const { error: upsertError } = await supabase
      .from('basketball_fixtures')
      .upsert(mappedGames, { onConflict: 'fixture_id' });

    if (upsertError) {
      console.error('[fetch-basketball-fixtures] Upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Database upsert failed', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched and upserted daily basketball games',
      inserted: mappedGames.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[fetch-basketball-fixtures] Internal error:', message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}