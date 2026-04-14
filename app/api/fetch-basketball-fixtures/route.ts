import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const apiSportsKey = process.env.API_SPORTS_KEY!;

    if (!supabaseUrl || !supabaseKey || !apiSportsKey) {
      return NextResponse.json(
        { success: false, error: 'Missing environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    // Fetch games from API-Basketball
    const apiResponse = await fetch(`https://v1.basketball.api-sports.io/games?date=${formattedDate}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiSportsKey,
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`API-Basketball responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
       console.error('API-Basketball Error:', data.errors);
       return NextResponse.json(
        { success: false, error: 'API-Basketball returned an error', details: data.errors },
        { status: 400 }
       );
    }

    const games: any[] = data.response;

    if (!games || games.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, message: 'No basketball games found for today.' });
    }

    // Map the external data to match the Supabase `basketball_fixtures` table schema
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

    // Perform an upsert into Supabase based on `fixture_id`
    const { error: upsertError } = await supabase
      .from('basketball_fixtures')
      .upsert(mappedGames, { onConflict: 'fixture_id' });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to insert/upsert data into database', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched and upserted daily basketball games',
      inserted: mappedGames.length,
    });

  } catch (error: any) {
    console.error('Internal Server Error in fetching basketball games:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}