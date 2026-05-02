export interface AnalyzedFixture {
  league_name: string;
  fixture_id: number;
  sport_type: string;
  match_date: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  status: string;
  over1_5_probability: number;
  under1_5_probability: number;
  over2_5_probability: number;
  under2_5_probability: number;
  over3_5_probability: number;
  under3_5_probability: number;
  btts_probability: number;
  home_win_probability: number;
  away_win_probability: number;
  // Real odds fields
  home_win_odds: number;
  away_win_odds: number;
  over_1_5_odds: number;
  over_2_5_odds: number;
  btts_yes_odds: number;
}

// Poisson distribution: P(goals > k | expected = lambda)
function poissonOver(lambda: number, k: number): number {
  if (lambda <= 0) return 0;
  let cumulative = 0;
  let term = Math.exp(-lambda);
  for (let i = 0; i <= k; i++) {
    cumulative += term;
    term *= lambda / (i + 1);
  }
  return Math.round((1 - cumulative) * 100);
}

// BTTS: P(home > 0) * P(away > 0) = (1 - e^-λh) * (1 - e^-λa)
function bttsProb(homeLambda: number, awayLambda: number): number {
  return Math.round(
    (1 - Math.exp(-homeLambda)) * (1 - Math.exp(-awayLambda)) * 100
  );
}

export async function analyzeFixtureWithRealData(
  fixture: any,
  apiKey: string
): Promise<AnalyzedFixture | null> {
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/predictions?fixture=${fixture.fixture_id}`,
      {
        method: 'GET',
        headers: { 'x-apisports-key': apiKey },
        next: { revalidate: 86400 },
      }
    );

    const data = await response.json();

    // Guard against quota errors or empty responses
    if (data.errors && Object.keys(data.errors).length > 0) return null;
    
    const prediction = data.response?.[0]?.predictions;
    if (!prediction?.percent) return null;

    // --- Win probabilities (these ARE in the API correctly) ---
    const homeWin = parseInt(prediction.percent.home?.replace('%', '') ?? '0') || 0;
    const awayWin = parseInt(prediction.percent.away?.replace('%', '') ?? '0') || 0;

    // --- Goal-based markets: use predicted goals from API ---
    // prediction.goals.home and .away are the model's expected goals
    const homeLambda = parseFloat(prediction.goals?.home ?? '1.2') || 1.2;
    const awayLambda = parseFloat(prediction.goals?.away ?? '0.9') || 0.9;

    const ov15 = poissonOver(homeLambda + awayLambda, 1);
    const ov25 = poissonOver(homeLambda + awayLambda, 2);
    const ov35 = poissonOver(homeLambda + awayLambda, 3);
    const btts = bttsProb(homeLambda, awayLambda);

    return {
      ...fixture,
      league_name: fixture.league_name || 'Unknown League',
      home_win_probability: homeWin,
      away_win_probability: awayWin,
      btts_probability: btts,
      over1_5_probability: ov15,
      under1_5_probability: 100 - ov15,
      over2_5_probability: ov25,
      under2_5_probability: 100 - ov25,
      over3_5_probability: ov35,
      under3_5_probability: 100 - ov35,
      // Odds not available from /predictions — set 0 means EV calc is skipped
      home_win_odds: 0,
      away_win_odds: 0,
      over_1_5_odds: 0,
      over_2_5_odds: 0,
      btts_yes_odds: 0,
    };
  } catch (error) {
    console.error(`Failed to fetch predictions for fixture ${fixture.fixture_id}:`, error);
    return null;
  }
}