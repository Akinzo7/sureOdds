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

  // Extract unique leagues from fixtures, sorted alphabetically
  const uniqueLeagues = useMemo(() => {
    const leagues = Array.from(
      new Set(fixtures.map((f) => f.league_name || "Unknown League"))
    ).sort((a, b) => a.localeCompare(b));
    return leagues;
  }, [fixtures]);

  const matches = useMemo(() => {
    const now = new Date();

    return fixtures
      // 1. Filter by selected league
      .filter((fixture) => {
        if (selectedLeague === "All") return true;
        return (fixture.league_name || "Unknown League") === selectedLeague;
      })
      // 2. Filter by time window
      .filter((fixture) => {
        if (timeFilter === "All") return true;
        const matchDate = new Date(fixture.match_date);
        const diffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (timeFilter === "Next 6 Hours") return diffHours >= 0 && diffHours <= 6;
        if (timeFilter === "Next 12 Hours") return diffHours >= 0 && diffHours <= 12;
        if (timeFilter === "Next 24 Hours") return diffHours >= 0 && diffHours <= 24;
        return true;
      })
      // 3. Filter by active market confidence threshold
      .filter((fixture) => {
        if (activeTab === "over-1.5") return fixture.over1_5_probability >= 80;
        if (activeTab === "straight-win") return fixture.home_win_probability >= 75 || fixture.away_win_probability >= 75;
        if (activeTab === "over-2.5") return fixture.over2_5_probability >= 80;
        if (activeTab === "over-3.5") return fixture.over3_5_probability >= 75; 
        if (activeTab === "btts") return fixture.btts_probability >= 80;
        if (activeTab === "under-1.5") return fixture.under1_5_probability >= 70;
        if (activeTab === "under-2.5") return fixture.under2_5_probability >= 70;
        if (activeTab === "under-3.5") return fixture.under3_5_probability >= 70;
        return false;
      })
      .map((fixture): Match => {
        let confidence = 0;
        let prediction = "";
        let odds = 1.5; 
        
        if (activeTab === "over-1.5") {
          confidence = fixture.over1_5_probability;
          prediction = "Over 1.5 Goals";
          odds = 1.25 + (100 - confidence) / 100;
        } else if (activeTab === "straight-win") {
          if (fixture.home_win_probability >= fixture.away_win_probability && fixture.home_win_probability >= 75) {
             confidence = fixture.home_win_probability;
             prediction = `${fixture.home_team_name} Win`;
             odds = 1.30 + (100 - confidence) / 50;
          } else {
             confidence = fixture.away_win_probability;
             prediction = `${fixture.away_team_name} Win`;
             odds = 1.30 + (100 - confidence) / 50;
          }
        } else if (activeTab === "over-2.5") {
          confidence = fixture.over2_5_probability;
          prediction = "Over 2.5 Goals";
          odds = 1.65 + (100 - confidence) / 50;
        } else if (activeTab === "over-3.5") {
          confidence = fixture.over3_5_probability;
          prediction = "Over 3.5 Goals";
          odds = 2.50 + (100 - confidence) / 30;
        } else if (activeTab === "btts") {
          confidence = fixture.btts_probability;
          prediction = "Both Teams to Score";
          odds = 1.70 + (100 - confidence) / 50;
        } else if (activeTab === "under-1.5") {
          confidence = fixture.under1_5_probability;
          prediction = "Under 1.5 Goals";
          odds = 2.20 + (100 - confidence) / 40;
        } else if (activeTab === "under-2.5") {
          confidence = fixture.under2_5_probability;
          prediction = "Under 2.5 Goals";
          odds = 1.80 + (100 - confidence) / 50;
        } else if (activeTab === "under-3.5") {
          confidence = fixture.under3_5_probability;
          prediction = "Under 3.5 Goals";
          odds = 1.40 + (100 - confidence) / 60;
        }

        const matchTime = fixture.match_date 
          ? new Date(fixture.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : "TBD";

        return {
          id: String(fixture.fixture_id),
          homeTeam: fixture.home_team_name,
          awayTeam: fixture.away_team_name,
          homeTeamLogo: "🛡️", // Generics as placeholder since real logos aren't fetched yet
          awayTeamLogo: "⚔️", // Generics as placeholder
          matchTime: matchTime,
          league:fixture.league_name || "Football",
          confidence,
          odds: Number(odds.toFixed(2)),
          prediction,
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
      {/* ============ Main Content ============ */}
      <div className="flex-1 min-w-0">
        {/* Market Tabs */}
        <MarketTabs
          tabs={FOOTBALL_MARKETS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Filter Dropdowns */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* League Filter */}
          <select
            id="league-filter"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all duration-200 hover:border-accent-green focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="All">All Leagues</option>
            {uniqueLeagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>

          {/* Time Filter */}
          <select
            id="time-filter"
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

        {/* Active Market Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {FOOTBALL_MARKETS.find((t) => t.id === activeTab)?.label} Market
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {matches.length} match{matches.length !== 1 ? "es" : ""} found
              with AI predictions
            </p>
          </div>
          <div className="hidden items-center gap-1 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-muted sm:flex">
            <span className="mr-1 h-2 w-2 rounded-full bg-accent-green animate-pulse" />
            Live Engine
          </div>
        </div>

        {/* Match Cards Grid */}
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

        {/* Empty State */}
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

        {/* Bottom padding for mobile bet slip */}
        {selections.length > 0 && <div className="h-16 lg:hidden" />}
      </div>

      {/* ============ Bet Slip (Desktop Sidebar) ============ */}
      <BetSlip
        selections={selections}
        onRemove={removeSelection}
        onClear={clearSelections}
      />
    </div>
  );
}
