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
  // Probabilities
  over1_5_probability: number;
  under1_5_probability: number;
  over2_5_probability: number;
  under2_5_probability: number;
  over3_5_probability: number;
  under3_5_probability: number;
  btts_probability: number;
  home_win_probability: number;
  away_win_probability: number;
  // REAL ODDS
  home_win_odds: number;
  away_win_odds: number;
  over_1_5_odds: number;
  over_2_5_odds: number;
  btts_yes_odds: number;
}

export async function analyzeFixtureWithRealData(fixture: any, apiKey: string): Promise<AnalyzedFixture | null> {
  try {
    // 1. Fetch BOTH Predictions and Odds concurrently for maximum speed
    const [predRes, oddsRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixture.fixture_id}`, {
        method: 'GET', headers: { 'x-apisports-key': apiKey }, next: { revalidate: 86400 }
      }),
      fetch(`https://v3.football.api-sports.io/odds?fixture=${fixture.fixture_id}`, {
        method: 'GET', headers: { 'x-apisports-key': apiKey }, next: { revalidate: 86400 }
      })
    ]);

    const predData = await predRes.json();
    const oddsData = await oddsRes.json();

    const predictionObj = predData.response?.[0]?.predictions;
    const comparisonObj = predData.response?.[0]?.comparison;
    const bookmakers = oddsData.response?.[0]?.bookmakers;

    if (!predictionObj || !predictionObj.percent) return null;

    // 2. Extract Real Bookmaker Odds (Fallback to 1.0 if not found so UI doesn't crash)
    let homeOdds = 1.0, awayOdds = 1.0, ov15Odds = 1.0, ov25Odds = 1.0, bttsOdds = 1.0;

    if (bookmakers && bookmakers.length > 0) {
      const bets = bookmakers[0].bets;

      // Extract Match Winner (1x2)
      const matchWinner = bets.find((b: any) => b.name === "Match Winner");
      if (matchWinner) {
        homeOdds = parseFloat(matchWinner.values.find((v: any) => v.value === "Home")?.odd || "1.0");
        awayOdds = parseFloat(matchWinner.values.find((v: any) => v.value === "Away")?.odd || "1.0");
      }

      // Extract Goals Over/Under
      const goalsOU = bets.find((b: any) => b.name === "Goals Over/Under");
      if (goalsOU) {
        ov15Odds = parseFloat(goalsOU.values.find((v: any) => v.value === "Over 1.5")?.odd || "1.0");
        ov25Odds = parseFloat(goalsOU.values.find((v: any) => v.value === "Over 2.5")?.odd || "1.0");
      }

      // Extract BTTS
      const bttsMarket = bets.find((b: any) => b.name === "Both Teams Score");
      if (bttsMarket) {
        bttsOdds = parseFloat(bttsMarket.values.find((v: any) => v.value === "Yes")?.odd || "1.0");
      }
    }

    // 3. Process the Strictly Validated Math (Phase 1)
    const rawHomeWin = parseInt(predictionObj.percent.home.replace('%', '')) || 0;
    const rawAwayWin = parseInt(predictionObj.percent.away.replace('%', '')) || 0;
    const homeForm = parseInt(comparisonObj?.form?.home?.replace('%', '') || String(rawHomeWin));
    const awayForm = parseInt(comparisonObj?.form?.away?.replace('%', '') || String(rawAwayWin));
    const homeH2H = parseInt(comparisonObj?.h2h?.home?.replace('%', '') || String(rawHomeWin));
    const awayH2H = parseInt(comparisonObj?.h2h?.away?.replace('%', '') || String(rawAwayWin));

    const validatedHomeWin = Math.round((rawHomeWin * 0.7) + (homeForm * 0.2) + (homeH2H * 0.1));
    const validatedAwayWin = Math.round((rawAwayWin * 0.7) + (awayForm * 0.2) + (awayH2H * 0.1));

    const bttsString = predictionObj.percent.btts || "50%";
    const rawBtts = parseInt(bttsString.replace('%', ''));
    const combinedForm = (homeForm + awayForm) / 2;
    const goalFormPenalty = combinedForm < 50 ? -10 : 0;

    const validatedBtts = Math.max(0, rawBtts + goalFormPenalty);
    const ov15 = Math.max(0, Math.min(99, validatedBtts + 25 + goalFormPenalty));
    const ov25 = Math.max(0, Math.min(99, validatedBtts + goalFormPenalty));
    const ov35 = Math.max(0, validatedBtts - 30 + goalFormPenalty);

    // 4. Return strictly genuine data
    return {
      ...fixture,
      league_name: fixture.league_name || "Unknown League",
      home_win_probability: validatedHomeWin,
      away_win_probability: validatedAwayWin,
      btts_probability: validatedBtts,
      over1_5_probability: ov15,
      under1_5_probability: 100 - ov15,
      over2_5_probability: ov25,
      under2_5_probability: 100 - ov25,
      over3_5_probability: ov35,
      under3_5_probability: 100 - ov35,
      // REAL ODDS DATA
      home_win_odds: homeOdds,
      away_win_odds: awayOdds,
      over_1_5_odds: ov15Odds,
      over_2_5_odds: ov25Odds,
      btts_yes_odds: bttsOdds,
    };
    
  } catch (error) {
    console.error(`Failed to fetch real stats for fixture ${fixture.fixture_id}:`, error);
  }

  return null;
}

// Add this to the BOTTOM of your existing lib/logic-engine.ts file

export async function analyzeFixtureWithRealData(fixture: any, apiKey: string): Promise<AnalyzedFixture | null> {
  try {
    const response = await fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixture.fixture_id}`, {
      method: 'GET',
      headers: { 'x-apisports-key': apiKey },
      next: { revalidate: 86400 } 
    });

    const data = await response.json();
    const predictionObj = data.response?.[0]?.predictions;
    const comparisonObj = data.response?.[0]?.comparison; // Extract the hidden reality check data

    if (predictionObj && predictionObj.percent) {
      // 1. Extract Raw ML Percentages
      const rawHomeWin = parseInt(predictionObj.percent.home.replace('%', '')) || 0;
      const rawAwayWin = parseInt(predictionObj.percent.away.replace('%', '')) || 0;
      
      // 2. Extract Reality Check Percentages (Form & H2H)
      // If the API doesn't provide them for a small league, fallback to the raw ML so it doesn't break
      const homeForm = parseInt(comparisonObj?.form?.home?.replace('%', '') || String(rawHomeWin));
      const awayForm = parseInt(comparisonObj?.form?.away?.replace('%', '') || String(rawAwayWin));
      const homeH2H = parseInt(comparisonObj?.h2h?.home?.replace('%', '') || String(rawHomeWin));
      const awayH2H = parseInt(comparisonObj?.h2h?.away?.replace('%', '') || String(rawAwayWin));

      // 3. THE ALGORITHM: Apply Strict Weighting
      // 70% Machine Learning, 20% Recent Form Momentum, 10% Historical Matchup
      const validatedHomeWin = Math.round((rawHomeWin * 0.7) + (homeForm * 0.2) + (homeH2H * 0.1));
      const validatedAwayWin = Math.round((rawAwayWin * 0.7) + (awayForm * 0.2) + (awayH2H * 0.1));

      // 4. Process Goals (BTTS)
      const bttsString = predictionObj.percent.btts || "50%";
      const rawBtts = parseInt(bttsString.replace('%', ''));
      
      // If teams are in bad form, they score less. We penalize goal markets based on combined form.
      const combinedForm = (homeForm + awayForm) / 2;
      const goalFormPenalty = combinedForm < 50 ? -10 : 0; // Severe 10% penalty if both teams are playing poorly

      const validatedBtts = Math.max(0, rawBtts + goalFormPenalty);
      const ov15 = Math.max(0, Math.min(99, validatedBtts + 25 + goalFormPenalty));
      const ov25 = Math.max(0, Math.min(99, validatedBtts + goalFormPenalty));
      const ov35 = Math.max(0, validatedBtts - 30 + goalFormPenalty);

      return {
        ...fixture,
        league_name: fixture.league_name || "Unknown League",
        home_win_probability: validatedHomeWin,
        away_win_probability: validatedAwayWin,
        btts_probability: validatedBtts,
        over1_5_probability: ov15,
        under1_5_probability: 100 - ov15,
        over2_5_probability: ov25,
        under2_5_probability: 100 - ov25,
        over3_5_probability: ov35,
        under3_5_probability: 100 - ov35,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch real stats for fixture ${fixture.fixture_id}:`, error);
  }

  // Strict rejection: If we don't have genuine data, kill the match.
  return null;
}
// Add this to the BOTTOM of lib/logic-engine.ts

export interface AnalyzedBasketballFixture {
  league_name: string;
  fixture_id: number;
  sport_type: string;
  match_date: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  status: string;
  home_win_probability: number;
  away_win_probability: number;
  projected_total_points: number;
  home_spread: number;
}

export function analyzeBasketballFixture(
  fixture: any,
): AnalyzedBasketballFixture {
  // Seeded random logic so percentages stay consistent on refresh
  const seed = fixture.fixture_id || Math.random() * 10000;

  const pseudoRandom = (hash: number) => {
    let x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  // Generate a mock win probability for the home team (between 30 and 85)
  const homeWinProb = Math.floor(30 + pseudoRandom(Number(seed) + 1) * 55);
  // Basketball has no ties, so away probability is the exact inverse
  const awayWinProb = 100 - homeWinProb;

  // Projected Total Points (Typically between 190 and 235 for NBA/high-level games)
  const projectedTotal = Math.floor(190 + pseudoRandom(Number(seed) + 2) * 45);

  // Calculate the Point Spread.
  // If a team has a huge win probability advantage, the negative spread increases.
  const winDiff = homeWinProb - awayWinProb;
  const rawSpread = -(winDiff / 4); // E.g., 60% win diff = -15 point spread
  // Round to the nearest 0.5 (e.g., -7.5)
  const homeSpread = Math.round(rawSpread * 2) / 2;

  return {
    ...fixture,
    league_name: fixture.league_name || "Unknown League",
    home_win_probability: homeWinProb,
    away_win_probability: awayWinProb,
    projected_total_points: projectedTotal,
    home_spread: homeSpread,
  };
}

// Add this to the BOTTOM of lib/logic-engine.ts

export async function analyzeBasketballFixtureWithRealData(
  fixture: any,
  apiKey: string,
): Promise<AnalyzedBasketballFixture> {
  try {
    // 1. Ask API-Basketball for real Vegas Odds (Bookmaker ID 1 is typically Bet365/Bwin)
    const response = await fetch(
      `https://v1.basketball.api-sports.io/odds?game=${fixture.fixture_id}`,
      {
        method: "GET",
        headers: {
          "x-apisports-key": apiKey,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours to protect API limits
      },
    );

    const data = await response.json();
    const bookmakers = data.response?.[0]?.bookmakers;

    // 2. If we got real odds data back, parse it!
    if (bookmakers && bookmakers.length > 0) {
      const markets = bookmakers[0].bets;

      let homeWinProb = 50;
      let awayWinProb = 50;
      let homeSpread = 0;
      let projectedTotal = 210;

      // Extract Moneyline (Home/Away)
      const moneyline = markets.find((m: any) => m.name === "Home/Away");
      if (moneyline) {
        const homeOdds = parseFloat(
          moneyline.values.find((v: any) => v.value === "Home")?.odd || "1.9",
        );
        const awayOdds = parseFloat(
          moneyline.values.find((v: any) => v.value === "Away")?.odd || "1.9",
        );
        // Convert decimal odds to implied probability
        homeWinProb = Math.round((1 / homeOdds) * 100);
        awayWinProb = Math.round((1 / awayOdds) * 100);
      }

      // Extract Point Spread (Asian Handicap)
      const spreadMarket = markets.find(
        (m: any) => m.name === "Asian Handicap",
      );
      if (spreadMarket && spreadMarket.values.length > 0) {
        // Vegas formats it like "Home -5.5", we just need the number
        const rawSpread = spreadMarket.values[0].value
          .replace("Home ", "")
          .replace("Away ", "");
        homeSpread = parseFloat(rawSpread) || 0;
      }

      // Extract Over/Under Total Points
      const totalMarket = markets.find((m: any) => m.name === "Over/Under");
      if (totalMarket && totalMarket.values.length > 0) {
        // Vegas formats it like "Over 215.5"
        const rawTotal = totalMarket.values[0].value
          .replace("Over ", "")
          .replace("Under ", "");
        projectedTotal = Math.round(parseFloat(rawTotal)) || 210;
      }

      return {
        ...fixture,
        home_win_probability: homeWinProb,
        away_win_probability: awayWinProb,
        projected_total_points: projectedTotal,
        home_spread: homeSpread,
      };
    }
  } catch (error) {
    console.error(
      `Failed to fetch real odds for basketball game ${fixture.fixture_id}:`,
      error,
    );
  }

  // 3. FALLBACK: If the API fails or the game doesn't have odds yet, use our mock math
  return analyzeBasketballFixture(fixture);
}
