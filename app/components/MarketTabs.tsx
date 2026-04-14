"use client";

import { Trophy, TrendingUp, TrendingDown, Target } from "lucide-react";

export interface MarketTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const FOOTBALL_MARKETS: MarketTab[] = [
  { id: "straight-win", label: "Straight Win", icon: <Trophy className="h-4 w-4" /> },
  { id: "over-1.5", label: "Over 1.5", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "under-1.5", label: "Under 1.5", icon: <TrendingDown className="h-4 w-4" /> },
  { id: "over-2.5", label: "Over 2.5", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "under-2.5", label: "Under 2.5", icon: <TrendingDown className="h-4 w-4" /> },
  { id: "over-3.5", label: "Over 3.5", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "under-3.5", label: "Under 3.5", icon: <TrendingDown className="h-4 w-4" /> },
  { id: "btts", label: "BTTS", icon: <Target className="h-4 w-4" /> },
];

interface MarketTabsProps {
  tabs: MarketTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function MarketTabs({
  tabs,
  activeTab,
  onTabChange,
}: MarketTabsProps) {
  return (
    <nav
      className="mb-6 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
      role="tablist"
      aria-label="Betting markets"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`group flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-accent-green text-background shadow-lg shadow-accent-green/20"
              : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          <span
            className={`transition-colors ${
              activeTab === tab.id
                ? "text-background"
                : "text-muted group-hover:text-foreground"
            }`}
          >
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
