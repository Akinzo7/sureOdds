import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Determine the environment variables dynamically since different Next.js setups
    // use different prefixes (e.g., NEXT_PUBLIC_SUPABASE_URL vs SUPABASE_URL)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const apiSportsKey = process.env.API_SPORTS_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    if (!apiSportsKey) {
      return NextResponse.json(
        { success: false, error: 'API_SPORTS_KEY is missing from environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in YYYY-MM-DD format
   const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    // Fetch fixtures from API-Sports
    const apiResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${formattedDate}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiSportsKey,
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`API-Sports responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Depending on API limits, the API could return an error object instead of responses. Let's guard against that.
    if (data.errors && Object.keys(data.errors).length > 0) {
       console.error('API-Sports Error:', data.errors);
       return NextResponse.json(
        { success: false, error: 'API-Sports returned an error', details: data.errors },
        { status: 400 }
       );
    }

    const fixtures: any[] = data.response;

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, message: 'No fixtures found for today (or no response parsed)' });
    }

    // Map the external data to match the Supabase `fixtures` table schema
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

    // Perform an upsert into Supabase based on `fixture_id`
    // Ensure `onConflict` refers to the UNIQUE constraint column declared in our schema previously.
    const { error: upsertError } = await supabase
      .from('fixtures')
      .upsert(mappedFixtures, { onConflict: 'fixture_id' });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to insert/upsert data into database', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched and upserted daily fixtures',
      inserted: mappedFixtures.length,
    });

  } catch (error: any) {
    console.error('Internal Server Error in fetching fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
