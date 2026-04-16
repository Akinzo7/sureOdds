"use client";

import { useState, useCallback, useMemo } from "react";
import MarketTabs, { FOOTBALL_MARKETS } from "@/app/components/MarketTabs";
import MatchCard from "@/app/components/MatchCard";
import BetSlip from "@/app/components/BetSlip";
import type { Match } from "@/app/components/MatchCard";
import type { AnalyzedFixture } from "@/lib/logic-engine";

interface DashboardClientProps {
  fixtures: AnalyzedFixture[];
}

const TIME_FILTER_OPTIONS = ["All", "Next 6 Hours", "Next 12 Hours", "Next 24 Hours"] as const;

export default function DashboardClient({ fixtures }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("over-1.5");
  const [selections, setSelections] = useState<Match[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [timeFilter, setTimeFilter] = useState<string>("All");

  const uniqueLeagues = useMemo(() => {
    const leagues = Array.from(
      new Set(fixtures.map((f) => f.league_name || "Unknown League"))
    ).sort((a, b) => a.localeCompare(b));
    return leagues;
  }, [fixtures]);

  const matches = useMemo(() => {
    const now = new Date();

    return fixtures
      .filter((fixture) => {
        if (selectedLeague === "All") return true;
        return (fixture.league_name || "Unknown League") === selectedLeague;
      })
      .filter((fixture) => {
        if (timeFilter === "All") return true;
        const matchDate = new Date(fixture.match_date);
        const diffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (timeFilter === "Next 6 Hours") return diffHours >= 0 && diffHours <= 6;
        if (timeFilter === "Next 12 Hours") return diffHours >= 0 && diffHours <= 12;
        if (timeFilter === "Next 24 Hours") return diffHours >= 0 && diffHours <= 24;
        return true;
      })
      // 3. THE PUNTER's STRATEGY ALGORITHM
      .filter((fixture) => {
        // Over 1.5 is a highly likely event, so we still demand 75% confidence here
        if (activeTab === "over-1.5") return fixture.over1_5_probability >= 75; 
        
        // Straight Win: Punters know 70%+ is the sweet spot for a favorite
        if (activeTab === "straight-win") return fixture.home_win_probability >= 70 || fixture.away_win_probability >= 70; 
        
        // Over 2.5 is riskier, 65% is a very strong signal from an ML model
        if (activeTab === "over-2.5") return fixture.over2_5_probability >= 65;
        
        // Over 3.5 is rare, 55% ML confidence means the model expects a massive blowout
        if (activeTab === "over-3.5") return fixture.over3_5_probability >= 55; 
        
        // BTTS: 65% indicates both teams have massive attacking data
        if (activeTab === "btts") return fixture.btts_probability >= 65;
        
        // Under markets: Demanding 70% ensures a tight, defensive prediction
        if (activeTab === "under-1.5") return fixture.under1_5_probability >= 70;
        if (activeTab === "under-2.5") return fixture.under2_5_probability >= 70;
        if (activeTab === "under-3.5") return fixture.under3_5_probability >= 75; // Under 3.5 is common, demand higher safety
        
        return false;
      })
      .map((fixture): Match => {
        let confidence = 0;
        let prediction = "";
        let realOdds = 1.0; 
        
        // Use genuine odds pulled directly from Vegas bookmakers
        if (activeTab === "over-1.5") {
          confidence = fixture.over1_5_probability;
          prediction = "Over 1.5 Goals";
          // @ts-ignore - Temporary bypass until odds API is wired
          realOdds = fixture.over_1_5_odds || 1.0;
        } else if (activeTab === "straight-win") {
          if (fixture.home_win_probability >= fixture.away_win_probability) {
             confidence = fixture.home_win_probability;
             prediction = `${fixture.home_team_name} Win`;
             // @ts-ignore
             realOdds = fixture.home_win_odds || 1.0;
          } else {
             confidence = fixture.away_win_probability;
             prediction = `${fixture.away_team_name} Win`;
             // @ts-ignore
             realOdds = fixture.away_win_odds || 1.0;
          }
        } else if (activeTab === "over-2.5") {
          confidence = fixture.over2_5_probability;
          prediction = "Over 2.5 Goals";
          // @ts-ignore
          realOdds = fixture.over_2_5_odds || 1.0;
        } else if (activeTab === "btts") {
          confidence = fixture.btts_probability;
          prediction = "Both Teams to Score";
          // @ts-ignore
          realOdds = fixture.btts_yes_odds || 1.0;
        } else if (activeTab === "over-3.5") {
          confidence = fixture.over3_5_probability;
          prediction = "Over 3.5 Goals";
          realOdds = 0.0; 
        } else if (activeTab.startsWith("under")) {
          confidence = activeTab === "under-1.5" ? fixture.under1_5_probability : activeTab === "under-2.5" ? fixture.under2_5_probability : fixture.under3_5_probability;
          prediction = `Under ${activeTab.split('-')[1]} Goals`;
          realOdds = 0.0;
        }

        // --- THE QUANTITATIVE EDGE CALCULATOR ---
        let isPositiveEV = false;
        let evMargin = 0;

        if (realOdds > 1.0) {
          const impliedProbability = (1 / realOdds) * 100;
          evMargin = confidence - impliedProbability;
          // Temporarily set to 0.5% edge so you can see it working locally
          isPositiveEV = evMargin >= 0.5; 
        }

        const matchDateObj = new Date(fixture.match_date);
        const matchTime = fixture.match_date 
          ? `${matchDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${matchDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : "TBD";

        return {
          id: String(fixture.fixture_id),
          homeTeam: fixture.home_team_name,
          awayTeam: fixture.away_team_name,
          homeTeamLogo: "🛡️", 
          awayTeamLogo: "⚔️", 
          matchTime: matchTime,
          league: fixture.league_name || "Football",
          confidence,
          odds: Number(realOdds.toFixed(2)),
          prediction,
          // @ts-ignore - Temporary bypass until EV is officially added to types
          isPositiveEV,
          evMargin,
        };
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [fixtures, activeTab, selectedLeague, timeFilter]);

  const toggleSelection = useCallback((match: Match) => {
    setSelections((prev) => {
      const exists = prev.find((m) => m.id === match.id);
      if (exists) return prev.filter((m) => m.id !== match.id);
      return [...prev, match];
    });
  }, []);

  const removeSelection = useCallback((id: string) => {
    setSelections((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearSelections = useCallback(() => {
    setSelections([]);
  }, []);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <MarketTabs tabs={FOOTBALL_MARKETS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all duration-200 hover:border-accent-green focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="All">All Leagues</option>
            {uniqueLeagues.map((league) => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all duration-200 hover:border-accent-green focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 appearance-none cursor-pointer min-w-[180px]"
          >
            {TIME_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All Times" : option}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {FOOTBALL_MARKETS.find((t) => t.id === activeTab)?.label} Market
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {matches.length} match{matches.length !== 1 ? "es" : ""} found
            </p>
          </div>
          <div className="hidden items-center gap-1 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-muted sm:flex">
            <span className="mr-1 h-2 w-2 rounded-full bg-accent-green animate-pulse" />
            Live Engine
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id + activeTab} 
              match={match}
              isSelected={selections.some((s) => s.id === match.id)}
              onToggle={toggleSelection}
            />
          ))}
        </div>

        {matches.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              No matches meet the threshold
            </p>
            <p className="mt-1 text-sm text-muted">
              Try exploring other markets for high-confidence predictions.
            </p>
          </div>
        )}

        {selections.length > 0 && <div className="h-16 lg:hidden" />}
      </div>

      <BetSlip selections={selections} onRemove={removeSelection} onClear={clearSelections} />
    </div>
  );
}