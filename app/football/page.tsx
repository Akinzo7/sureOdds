"use client";

import { useState, useCallback } from "react";
import MarketTabs, { FOOTBALL_MARKETS } from "@/app/components/MarketTabs";
import MatchCard from "@/app/components/MatchCard";
import BetSlip from "@/app/components/BetSlip";
import { MOCK_MATCHES } from "@/app/lib/mock-data";
import type { Match } from "@/app/components/MatchCard";

export default function FootballDashboard() {
  const [activeTab, setActiveTab] = useState("over-1.5");
  const [selections, setSelections] = useState<Match[]>([]);

  const matches = MOCK_MATCHES[activeTab] ?? [];

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
            Updated just now
          </div>
        </div>

        {/* Match Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
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
              No matches available
            </p>
            <p className="mt-1 text-sm text-muted">
              Check back later for predictions in this market.
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
