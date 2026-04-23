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
}

export function analyzeFixture(fixture: any): AnalyzedFixture {
  const seed = fixture.fixture_id || Math.random() * 10000;
  const pseudoRandom = (hash: number) => {
    let x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
  const getProb = (offset: number) => Math.floor(40 + pseudoRandom(Number(seed) + offset) * 55);
  const ov15 = getProb(1);
  const ov25 = getProb(2);
  const ov35 = getProb(3);

  return {
    ...fixture,
    league_name: fixture.league_name || "Unknown League",
    over1_5_probability: ov15,
    under1_5_probability: 100 - ov15,
    over2_5_probability: ov25,
    under2_5_probability: 100 - ov25,
    over3_5_probability: ov35,
    under3_5_probability: 100 - ov35,
    btts_probability: getProb(4),
    home_win_probability: getProb(5),
    away_win_probability: getProb(6),
  };
}

// ⚽ THE GENUINE FOOTBALL API ENGINE (No Fake Fallback)
// ⚽ THE PUNTER'S CUSTOM STATS ENGINE
export async function analyzeFixtureWithRealData(fixture: any, apiKey: string): Promise<AnalyzedFixture | null> {
  try {
    const response = await fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixture.fixture_id}`, {
      method: 'GET',
      headers: { 'x-apisports-key': apiKey },
      next: { revalidate: 86400 } 
    });

    const data = await response.json();
    const res = data.response?.[0];

    // If the API doesn't have data for this match, hide it.
    if (!res || !res.comparison) return null;

    const comp = res.comparison;

    // Helper to safely parse API-Sports comparison strings (e.g., "65%" -> 65)
    const parseStat = (val: string) => parseInt(val?.replace('%', '')) || 50;

    // 1. EXTRACT RAW HISTORICAL STATISTICS
    const homeForm = parseStat(comp.form?.home);
    const awayForm = parseStat(comp.form?.away);
    const homeAtt = parseStat(comp.att?.home);
    const awayAtt = parseStat(comp.att?.away);
    const homeDef = parseStat(comp.def?.home);
    const awayDef = parseStat(comp.def?.away);
    const homeGoals = parseStat(comp.goals?.home);
    const awayGoals = parseStat(comp.goals?.away);

    // 2. STRAIGHT WIN ALGORITHM
    // A team needs strong recent form, strong attack, and needs to face a weak defense.
    // We weight Form and Attack highly (40% each), and opponent's Defensive weakness at 20%.
    const homeWinScore = Math.round((homeForm * 0.40) + (homeAtt * 0.40) + ((100 - awayDef) * 0.20));
    const awayWinScore = Math.round((awayForm * 0.40) + (awayAtt * 0.40) + ((100 - homeDef) * 0.20));

    // 3. GOALS ALGORITHM (OVER / UNDER)
    // High scoring requires high combined attack stats, historical goal frequency, and leaky defenses.
    const attackingPace = (homeAtt + awayAtt) / 2;
    const goalHistory = (homeGoals + awayGoals) / 2;
    const defensiveWeakness = ((100 - homeDef) + (100 - awayDef)) / 2;

    // Base score for an average 2.5 goal game
    const overBase = Math.round((attackingPace * 0.40) + (goalHistory * 0.40) + (defensiveWeakness * 0.20));

    // Derive surrounding markets logically based on the pace of the game
    const over1_5 = Math.min(99, overBase + 18);
    const over2_5 = overBase;
    const over3_5 = Math.max(10, overBase - 22);

    const under1_5 = 100 - over1_5;
    const under2_5 = 100 - over2_5;
    const under3_5 = 100 - over3_5;

    // 4. BTTS ALGORITHM (Both Teams To Score)
    // Both teams need to have an attack stronger than the other's defense
    const homeCanScore = (homeAtt + (100 - awayDef)) / 2;
    const awayCanScore = (awayAtt + (100 - homeDef)) / 2;
    const bttsScore = Math.round((homeCanScore + awayCanScore) / 2);

    return {
      ...fixture,
      league_name: fixture.league_name || "Unknown League",
      home_win_probability: homeWinScore,
      away_win_probability: awayWinScore,
      btts_probability: bttsScore,
      over1_5_probability: over1_5,
      under1_5_probability: under1_5,
      over2_5_probability: over2_5,
      under2_5_probability: under2_5,
      over3_5_probability: over3_5,
      under3_5_probability: under3_5,
    };
    
  } catch (error) {
    console.error(`Failed to fetch stats for fixture ${fixture.fixture_id}:`, error);
    return null;
  }
}
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
  const seed = fixture.fixture_id || Math.random() * 10000;
  const pseudoRandom = (hash: number) => {
    let x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  const homeWinProb = Math.floor(30 + pseudoRandom(Number(seed) + 1) * 55);
  const awayWinProb = 100 - homeWinProb; 
  const projectedTotal = Math.floor(190 + pseudoRandom(Number(seed) + 2) * 45); 
  const winDiff = homeWinProb - awayWinProb; 
  const rawSpread = -(winDiff / 4);
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

// 🏀 THE GENUINE BASKETBALL API ENGINE (No Fake Fallback)
export async function analyzeBasketballFixtureWithRealData(fixture: any, apiKey: string): Promise<AnalyzedBasketballFixture | null> {
  try {
    const response = await fetch(`https://v1.basketball.api-sports.io/odds?game=${fixture.fixture_id}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      next: { revalidate: 86400 } 
    });

    const data = await response.json();
    const bookmakers = data.response?.[0]?.bookmakers;

    if (bookmakers && bookmakers.length > 0) {
      const markets = bookmakers[0].bets;
      
      let homeWinProb = 50;
      let awayWinProb = 50;
      let homeSpread = 0;
      let projectedTotal = 210;

      const moneyline = markets.find((m: any) => m.name === "Home/Away");
      if (moneyline) {
        const homeOdds = parseFloat(moneyline.values.find((v: any) => v.value === "Home")?.odd || "1.9");
        const awayOdds = parseFloat(moneyline.values.find((v: any) => v.value === "Away")?.odd || "1.9");
        homeWinProb = Math.round((1 / homeOdds) * 100);
        awayWinProb = Math.round((1 / awayOdds) * 100);
      }

      const spreadMarket = markets.find((m: any) => m.name === "Asian Handicap");
      if (spreadMarket && spreadMarket.values.length > 0) {
        const rawSpread = spreadMarket.values[0].value.replace("Home ", "").replace("Away ", "");
        homeSpread = parseFloat(rawSpread) || 0;
      }

      const totalMarket = markets.find((m: any) => m.name === "Over/Under");
      if (totalMarket && totalMarket.values.length > 0) {
        const rawTotal = totalMarket.values[0].value.replace("Over ", "").replace("Under ", "");
        projectedTotal = Math.round(parseFloat(rawTotal)) || 210;
      }

      return {
        ...fixture,
        league_name: fixture.league_name || "Unknown League",
        home_win_probability: homeWinProb,
        away_win_probability: awayWinProb,
        projected_total_points: projectedTotal,
        home_spread: homeSpread,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch real odds for basketball game ${fixture.fixture_id}:`, error);
  }

  // If no genuine Vegas Odds exist, return null so it gets hidden
  return null;
}