export interface AnalyzedFixture {
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
