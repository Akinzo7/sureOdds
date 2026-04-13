"use client";

import { Clock, TrendingUp, Plus, Check } from "lucide-react";

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchTime: string;
  league: string;
  confidence: number;
  odds: number;
  prediction: string;
}

interface MatchCardProps {
  match: Match;
  isSelected: boolean;
  onToggle: (match: Match) => void;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-accent-green";
  if (confidence >= 65) return "text-accent-emerald";
  if (confidence >= 50) return "text-accent-amber";
  return "text-accent-orange";
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return "bg-accent-green/10 border-accent-green/30";
  if (confidence >= 65) return "bg-accent-emerald/10 border-accent-emerald/30";
  if (confidence >= 50) return "bg-accent-amber/10 border-accent-amber/30";
  return "bg-accent-orange/10 border-accent-orange/30";
}

function getConfidenceBarColor(confidence: number): string {
  if (confidence >= 80) return "bg-accent-green";
  if (confidence >= 65) return "bg-accent-emerald";
  if (confidence >= 50) return "bg-accent-amber";
  return "bg-accent-orange";
}

export default function MatchCard({
  match,
  isSelected,
  onToggle,
}: MatchCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isSelected
          ? "border-accent-green/50 bg-accent-green/5 shadow-lg shadow-accent-green/10"
          : "border-border-subtle bg-surface hover:border-border hover:bg-surface-hover hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      {/* Top accent line */}
      <div
        className={`absolute left-0 right-0 top-0 h-0.5 transition-all duration-300 ${
          isSelected
            ? "bg-accent-green"
            : "bg-gradient-to-r from-transparent via-border to-transparent opacity-0 group-hover:opacity-100"
        }`}
      />

      <div className="p-5">
        {/* Header: League & Time */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-accent-violet/10 px-2.5 py-0.5 text-xs font-semibold text-accent-violet">
            {match.league}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3 w-3" />
            <span>{match.matchTime}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hover text-lg">
              {match.homeTeamLogo}
            </div>
            <span className="font-semibold text-foreground">
              {match.homeTeam}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-xs font-bold tracking-widest text-muted">
              VS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hover text-lg">
              {match.awayTeamLogo}
            </div>
            <span className="font-semibold text-foreground">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Prediction Label */}
        <div className="mb-3 rounded-lg bg-surface-hover px-3 py-2">
          <p className="text-xs text-muted">
            Prediction:{" "}
            <span className="font-semibold text-foreground">
              {match.prediction}
            </span>
          </p>
        </div>

        {/* Confidence Score */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp
                className={`h-3.5 w-3.5 ${getConfidenceColor(match.confidence)}`}
              />
              <span className="text-xs font-medium text-muted">
                AI Confidence
              </span>
            </div>
            <span
              className={`${getConfidenceBg(match.confidence)} rounded-md border px-2 py-0.5 text-sm font-bold ${getConfidenceColor(match.confidence)}`}
            >
              {match.confidence}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getConfidenceBarColor(match.confidence)}`}
              style={{ width: `${match.confidence}%` }}
            />
          </div>
        </div>

        {/* Footer: Odds + Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Odds</p>
            <p className="text-lg font-bold text-accent-cyan">
              {match.odds.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => onToggle(match)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isSelected
                ? "bg-accent-green text-background shadow-lg shadow-accent-green/25 hover:bg-accent-green/90"
                : "bg-surface-hover text-foreground hover:bg-accent-green/10 hover:text-accent-green"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
