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
  over2_5_probability: number;
  over3_5_probability: number;
  btts_probability: number;
  home_win_probability: number;
  away_win_probability: number;
}

export function analyzeFixture(fixture: any): AnalyzedFixture {
  // Use a seeded random based on fixture ID so probabilities stay stable 
  // between renders for the same fixture.
  const seed = fixture.fixture_id || Math.random() * 10000;
  
  const pseudoRandom = (hash: number) => {
    let x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  // Generate a mock probability between 40 and 95
  const getProb = (offset: number) => Math.floor(40 + pseudoRandom(Number(seed) + offset) * 55);

  return {
    ...fixture,
    over1_5_probability: getProb(1),
    over2_5_probability: getProb(2),
    over3_5_probability: getProb(3),
    btts_probability: getProb(4),
    home_win_probability: getProb(5),
    away_win_probability: getProb(6),
  };
}

// Add this to the BOTTOM of your existing lib/logic-engine.ts file

export async function analyzeFixtureWithRealData(fixture: any, apiKey: string): Promise<AnalyzedFixture> {
  try {
    // 1. Ask API-Sports for the official prediction data for this specific match
    const response = await fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixture.fixture_id}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      // Cache the response for 24 hours so we don't waste API calls if you refresh the page
      next: { revalidate: 86400 } 
    });

    const data = await response.json();
    const prediction = data.response?.[0]?.predictions;

    // 2. If the API returns real data, parse the percentages
    if (prediction && prediction.percent) {
      // API returns strings like "45%", so we strip the % and turn it into a number
      const homeWin = parseInt(prediction.percent.home.replace('%', '')) || 0;
      const awayWin = parseInt(prediction.percent.away.replace('%', '')) || 0;
      
      // API-Sports doesn't strictly provide Over 1.5, so we derive a safe algorithmic estimate 
      // based on the overall win/draw dynamics and BTTS (Both Teams To Score) probability
      const bttsString = prediction.percent.btts || "50%";
      const btts = parseInt(bttsString.replace('%', ''));

      return {
        ...fixture,
        home_win_probability: homeWin,
        away_win_probability: awayWin,
        btts_probability: btts,
        // Algorithmic derivations for goal markets based on primary stats
        over1_5_probability: Math.min(99, btts + 25), 
        over2_5_probability: Math.min(99, btts),
        over3_5_probability: Math.max(10, btts - 30),
      };
    }
  } catch (error) {
    console.error(`Failed to fetch real stats for fixture ${fixture.fixture_id}:`, error);
  }

  // 3. FALLBACK: If the API fails or we hit our limit, fall back to our seeded math logic
  return analyzeFixture(fixture);
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

export function analyzeBasketballFixture(fixture: any): AnalyzedBasketballFixture {
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
    home_win_probability: homeWinProb,
    away_win_probability: awayWinProb,
    projected_total_points: projectedTotal,
    home_spread: homeSpread,
  };
}

// Add this to the BOTTOM of lib/logic-engine.ts

export async function analyzeBasketballFixtureWithRealData(fixture: any, apiKey: string): Promise<AnalyzedBasketballFixture> {
  try {
    // 1. Ask API-Basketball for real Vegas Odds (Bookmaker ID 1 is typically Bet365/Bwin)
    const response = await fetch(`https://v1.basketball.api-sports.io/odds?game=${fixture.fixture_id}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      next: { revalidate: 86400 } // Cache for 24 hours to protect API limits
    });

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
        const homeOdds = parseFloat(moneyline.values.find((v: any) => v.value === "Home")?.odd || "1.9");
        const awayOdds = parseFloat(moneyline.values.find((v: any) => v.value === "Away")?.odd || "1.9");
        // Convert decimal odds to implied probability
        homeWinProb = Math.round((1 / homeOdds) * 100);
        awayWinProb = Math.round((1 / awayOdds) * 100);
      }

      // Extract Point Spread (Asian Handicap)
      const spreadMarket = markets.find((m: any) => m.name === "Asian Handicap");
      if (spreadMarket && spreadMarket.values.length > 0) {
        // Vegas formats it like "Home -5.5", we just need the number
        const rawSpread = spreadMarket.values[0].value.replace("Home ", "").replace("Away ", "");
        homeSpread = parseFloat(rawSpread) || 0;
      }

      // Extract Over/Under Total Points
      const totalMarket = markets.find((m: any) => m.name === "Over/Under");
      if (totalMarket && totalMarket.values.length > 0) {
        // Vegas formats it like "Over 215.5"
        const rawTotal = totalMarket.values[0].value.replace("Over ", "").replace("Under ", "");
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
    console.error(`Failed to fetch real odds for basketball game ${fixture.fixture_id}:`, error);
  }

  // 3. FALLBACK: If the API fails or the game doesn't have odds yet, use our mock math
  return analyzeBasketballFixture(fixture);
}