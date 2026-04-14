"use client";

import { useState, useCallback, useMemo } from "react";
import MarketTabs, { MarketTab } from "@/app/components/MarketTabs";
import BetSlip from "@/app/components/BetSlip";
import BasketballMatchCard, { BasketballMatch } from "@/app/components/BasketballMatchCard";
import type { Match } from "@/app/components/MatchCard";
import type { AnalyzedBasketballFixture } from "@/lib/logic-engine";
import { Target, TrendingUp, Trophy } from "lucide-react";

export const BASKETBALL_MARKETS: MarketTab[] = [
  { id: "moneyline", label: "Moneyline", icon: <Trophy className="h-4 w-4" /> },
  { id: "point-spread", label: "Point Spread", icon: <Target className="h-4 w-4" /> },
  { id: "total-points", label: "Total Points", icon: <TrendingUp className="h-4 w-4" /> },
];

interface DashboardClientProps {
  fixtures: AnalyzedBasketballFixture[];
}

export default function BasketballDashboardClient({ fixtures }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("moneyline");
  const [selections, setSelections] = useState<Match[]>([]);

  const matches = useMemo(() => {
    return fixtures
      .filter((fixture) => {
        if (activeTab === "moneyline") {
          return fixture.home_win_probability >= 70 || fixture.away_win_probability >= 70;
        }
        if (activeTab === "point-spread") {
          return Math.abs(fixture.home_spread) >= 5.5;
        }
        if (activeTab === "total-points") {
          return fixture.projected_total_points >= 210 || fixture.projected_total_points <= 200;
        }
        return false;
      })
      .map((fixture): BasketballMatch => {
        let confidence = 0;
        let prediction = "";
        let odds = 1.90; // Standard baseline for spreads and totals
        
        if (activeTab === "moneyline") {
          if (fixture.home_win_probability >= fixture.away_win_probability && fixture.home_win_probability >= 70) {
             confidence = fixture.home_win_probability;
             prediction = `${fixture.home_team_name} Moneyline`;
             odds = 1.20 + (100 - confidence) / 50; 
          } else {
             confidence = fixture.away_win_probability;
             prediction = `${fixture.away_team_name} Moneyline`;
             odds = 1.20 + (100 - confidence) / 50;
          }
        } else if (activeTab === "point-spread") {
          // If home probability > away, they are likely favorites (negative spread)
          // But our algorithm gives us raw home_spread
          if (fixture.home_spread < 0) {
             confidence = fixture.home_win_probability;
             prediction = `${fixture.home_team_name} ${fixture.home_spread}`;
          } else {
             confidence = fixture.away_win_probability;
             // If home spread is positive, away spread is negative
             prediction = `${fixture.away_team_name} -${fixture.home_spread}`;
          }
          // The confidence scale for point spread could just mirror the win probability for simplicity, 
          // but we ensure it's high enough since it passed the filter.
          odds = 1.90;
        } else if (activeTab === "total-points") {
          if (fixture.projected_total_points >= 210) {
            // High scoring
            confidence = Math.min(95, 60 + ((fixture.projected_total_points - 210) * 1.5));
            prediction = `Over ${fixture.projected_total_points}`;
          } else {
            // Low scoring
            confidence = Math.min(95, 60 + ((200 - fixture.projected_total_points) * 1.5));
            prediction = `Under ${fixture.projected_total_points}`;
          }
          odds = 1.90;
        }

       const matchDateObj = new Date(fixture.match_date);
const matchTime = fixture.match_date 
  ? `${matchDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${matchDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  : "TBD";

        return {
          id: String(fixture.fixture_id),
          homeTeam: fixture.home_team_name,
          awayTeam: fixture.away_team_name,
          homeTeamLogo: "🏀",
          awayTeamLogo: "⛹️",
          matchTime: matchTime,
        league: fixture.league_name || "Basketball",
          confidence: Math.round(confidence),
          odds: Number(odds.toFixed(2)),
          prediction,
          pointSpread: fixture.home_spread,
          totalPoints: fixture.projected_total_points
        };
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [fixtures, activeTab]);

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
          tabs={BASKETBALL_MARKETS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Active Market Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {BASKETBALL_MARKETS.find((t) => t.id === activeTab)?.label} Market
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
            <BasketballMatchCard
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
