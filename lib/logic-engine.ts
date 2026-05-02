// ============================================================
// lib/logic-engine.ts — Football + Basketball Analysis Engine
// ============================================================

// ─── Football Types ─────────────────────────────────────────
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
  // Positive EV fields (used by DashboardClient)
  isPositiveEV?: boolean;
  evMargin?: number;
  /** True when the API didn't return goal predictions and fallback lambdas were used */
  isFallbackPrediction?: boolean;
}

// ─── Basketball Types ───────────────────────────────────────
export interface AnalyzedBasketballFixture {
  fixture_id: number;
  sport_type: string;
  match_date: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  status: string;
  league_name: string;
  home_win_probability: number;
  away_win_probability: number;
  home_spread: number;
  projected_total_points: number;
  /** True when the API didn't return predictions and fallback values were used */
  isFallbackPrediction?: boolean;
}

// ─── Math Utilities ─────────────────────────────────────────

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

/**
 * Delays execution for the given number of milliseconds.
 * Used to rate-limit API calls.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Processes an array of items through an async function with concurrency control.
 * Prevents rate-limit violations on API-Sports (free tier: ~10 req/min).
 */
export async function processWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 3,
  delayMs: number = 300
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
      // Rejected promises are silently skipped (already logged inside fn)
    }
    // Pause between batches to respect rate limits
    if (i + concurrency < items.length) {
      await delay(delayMs);
    }
  }
  return results;
}

// ─── Football Analysis ──────────────────────────────────────

export async function analyzeFixtureWithRealData(
  fixture: Record<string, unknown>,
  apiKey: string
): Promise<AnalyzedFixture | null> {
  try {
    const fixtureId = fixture.fixture_id;
    if (!fixtureId) return null;

    const response = await fetch(
      `https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`,
      {
        method: 'GET',
        headers: { 'x-apisports-key': apiKey },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      console.error(`API-Sports HTTP ${response.status} for fixture ${fixtureId}`);
      return null;
    }

    const data = await response.json();

    // Guard against quota errors or empty responses
    if (data.errors && Object.keys(data.errors).length > 0) return null;

    const prediction = data.response?.[0]?.predictions;
    if (!prediction?.percent) return null;

    // --- Win probabilities ---
    const homeWin = parseInt(prediction.percent.home?.replace('%', '') ?? '0', 10) || 0;
    const awayWin = parseInt(prediction.percent.away?.replace('%', '') ?? '0', 10) || 0;

    // --- Goal-based markets: use predicted goals from API ---
    const rawHomeLambda = prediction.goals?.home;
    const rawAwayLambda = prediction.goals?.away;
    const isFallback = rawHomeLambda == null || rawAwayLambda == null;

    const homeLambda = parseFloat(rawHomeLambda ?? '1.2') || 1.2;
    const awayLambda = parseFloat(rawAwayLambda ?? '0.9') || 0.9;

    const ov15 = poissonOver(homeLambda + awayLambda, 1);
    const ov25 = poissonOver(homeLambda + awayLambda, 2);
    const ov35 = poissonOver(homeLambda + awayLambda, 3);
    const btts = bttsProb(homeLambda, awayLambda);

    return {
      fixture_id: fixtureId as number,
      sport_type: (fixture.sport_type as string) || 'soccer',
      match_date: (fixture.match_date as string) || '',
      home_team_id: (fixture.home_team_id as number) || 0,
      away_team_id: (fixture.away_team_id as number) || 0,
      home_team_name: (fixture.home_team_name as string) || 'Unknown',
      away_team_name: (fixture.away_team_name as string) || 'Unknown',
      status: (fixture.status as string) || '',
      league_name: (fixture.league_name as string) || 'Unknown League',
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
      isFallbackPrediction: isFallback,
    };
  } catch (error) {
    console.error(`Failed to fetch predictions for fixture ${fixture.fixture_id}:`, error);
    return null;
  }
}

// ─── Basketball Analysis ────────────────────────────────────

export async function analyzeBasketballFixtureWithRealData(
  fixture: Record<string, unknown>,
  apiKey: string
): Promise<AnalyzedBasketballFixture | null> {
  try {
    const fixtureId = fixture.fixture_id;
    if (!fixtureId) return null;

    // NOTE: API-Basketball uses a different base URL and parameter name
    const response = await fetch(
      `https://v1.basketball.api-sports.io/odds?game=${fixtureId}`,
      {
        method: 'GET',
        headers: { 'x-apisports-key': apiKey },
      }
    );

    if (!response.ok) {
      console.error(`API-Basketball HTTP ${response.status} for fixture ${fixtureId}`);
      return null;
    }

    const data = await response.json();

    // Guard against quota errors or empty responses
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error(`API-Basketball errors for fixture ${fixtureId}:`, data.errors);
      return null;
    }

    let homeWin = 50;
    let awayWin = 50;
    let homeSpread = 0;
    let projectedTotal = 210;
    let isFallback = true;

    const oddsResponse = data.response;
    if (oddsResponse && Array.isArray(oddsResponse) && oddsResponse.length > 0) {
      // Try to extract moneyline and spread from the odds data
      const bookmaker = oddsResponse[0]?.bookmakers?.[0];
      if (bookmaker?.bets) {
        isFallback = false;
        for (const bet of bookmaker.bets) {
          if (bet.name === 'Home/Away') {
            const homeOdds = parseFloat(bet.values?.find((v: { value: string }) => v.value === 'Home')?.odd ?? '1.90');
            const awayOdds = parseFloat(bet.values?.find((v: { value: string }) => v.value === 'Away')?.odd ?? '1.90');
            // Convert decimal odds to implied probability
            const totalImplied = (1 / homeOdds) + (1 / awayOdds);
            homeWin = Math.round(((1 / homeOdds) / totalImplied) * 100);
            awayWin = 100 - homeWin;
          }
          if (bet.name === 'Asian Handicap' || bet.name === 'Handicap') {
            const homeHandicap = bet.values?.find((v: { value: string }) => v.value === 'Home');
            if (homeHandicap?.handicap) {
              homeSpread = parseFloat(homeHandicap.handicap);
            }
          }
          if (bet.name === 'Over/Under') {
            const overValue = bet.values?.find((v: { value: string }) => v.value === 'Over');
            if (overValue?.handicap) {
              projectedTotal = parseFloat(overValue.handicap);
            }
          }
        }
      }
    }

    // If no real odds, derive spread from a simple probability heuristic
    if (isFallback) {
      const probDiff = homeWin - awayWin;
      homeSpread = -Math.round(probDiff * 0.15 * 2) / 2;
    }

    return {
      fixture_id: fixtureId as number,
      sport_type: 'basketball',
      match_date: (fixture.match_date as string) || '',
      home_team_id: (fixture.home_team_id as number) || 0,
      away_team_id: (fixture.away_team_id as number) || 0,
      home_team_name: (fixture.home_team_name as string) || 'Unknown',
      away_team_name: (fixture.away_team_name as string) || 'Unknown',
      status: (fixture.status as string) || '',
      league_name: (fixture.league_name as string) || 'Unknown League',
      home_win_probability: homeWin,
      away_win_probability: awayWin,
      home_spread: homeSpread,
      projected_total_points: Math.round(projectedTotal),
      isFallbackPrediction: isFallback,
    };
  } catch (error) {
    console.error(`Failed basketball prediction for fixture ${fixture.fixture_id}:`, error);
    return null;
  }
}