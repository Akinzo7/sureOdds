"use client";

import {
  Receipt,
  Trash2,
  X,
  ChevronUp,
  Save,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { Match } from "./MatchCard";

interface BetSlipProps {
  selections: Match[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function BetSlip({
  selections,
  onRemove,
  onClear,
}: BetSlipProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalOdds = selections.reduce((acc, match) => acc * match.odds, 1);

  return (
    <>
      {/* ============ MOBILE: Bottom Sheet Toggle ============ */}
      {selections.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-accent-green/30 bg-accent-green px-5 py-3.5 text-background shadow-2xl lg:hidden"
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <span className="font-bold">Bet Slip</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs font-bold">
              {selections.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              @{totalOdds.toFixed(2)}
            </span>
            <ChevronUp
              className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>
      )}

      {/* ============ MOBILE: Slide-Up Drawer ============ */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <SlipContent
              selections={selections}
              totalOdds={totalOdds}
              onRemove={onRemove}
              onClear={onClear}
              onClose={() => setIsExpanded(false)}
            />
          </div>
        </div>
      )}

      {/* ============ DESKTOP: Side Panel ============ */}
      <aside className="hidden lg:block lg:w-80 xl:w-96 shrink-0">
        <div className="sticky top-[48px] overflow-y-auto rounded-2xl border border-border-subtle bg-surface">
          <SlipContent
            selections={selections}
            totalOdds={totalOdds}
            onRemove={onRemove}
            onClear={onClear}
          />
        </div>
      </aside>
    </>
  );
}

/* ============ Shared Slip Content ============ */

interface SlipContentProps {
  selections: Match[];
  totalOdds: number;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

function SlipContent({
  selections,
  totalOdds,
  onRemove,
  onClear,
  onClose,
}: SlipContentProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/10">
            <Receipt className="h-4 w-4 text-accent-green" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Accumulator Slip</h3>
            <p className="text-xs text-muted">
              {selections.length} selection{selections.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {selections.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-accent-red/10 hover:text-accent-red"
              aria-label="Clear all selections"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Close slip"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selections List */}
      <div className="flex-1 px-5 py-3">
        {selections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-hover">
              <Receipt className="h-6 w-6 text-muted" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              No selections yet
            </p>
            <p className="text-xs text-muted">
              Add matches to build your accumulator
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selections.map((match) => (
              <li
                key={match.id}
                className="group/item flex items-start gap-3 rounded-xl border border-border-subtle bg-background p-3 transition-colors hover:border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {match.prediction}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-md bg-accent-cyan/10 px-1.5 py-0.5 text-xs font-bold text-accent-cyan">
                      @{match.odds.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted">{match.league}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(match.id)}
                  className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition-all group-hover/item:opacity-100 hover:bg-accent-red/10 hover:text-accent-red"
                  aria-label={`Remove ${match.homeTeam} vs ${match.awayTeam}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer: Total & Save */}
      {selections.length > 0 && (
        <div className="border-t border-border-subtle px-5 pb-5 pt-4">
          {/* Total Odds */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-accent-green/5 border border-accent-green/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-green" />
              <span className="text-sm font-medium text-muted">
                Combined Odds
              </span>
            </div>
            <span className="text-xl font-black text-accent-green">
              {totalOdds.toFixed(2)}
            </span>
          </div>

          {/* Save Button */}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green py-3.5 text-sm font-bold text-background transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-accent-green/25 active:scale-[0.98]"
            onClick={() =>
              alert(
                `Accumulator saved!\n${selections.length} selections @ ${totalOdds.toFixed(2)} total odds`
              )
            }
          >
            <Save className="h-4 w-4" />
            Save Accumulator
          </button>
        </div>
      )}
    </div>
  );
}
