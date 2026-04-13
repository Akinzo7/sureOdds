"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function WarningBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      id="responsible-gambling-banner"
      role="alert"
      className="sticky top-0 z-50 w-full border-b border-amber-500/20 bg-amber-500/10 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-amber-200/90">
            <span className="font-bold text-accent-amber">18+ Only.</span>{" "}
            Please gamble responsibly. Never bet more than you can afford to
            lose.
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="shrink-0 rounded-md p-1 text-amber-200/60 transition-colors hover:bg-amber-500/20 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
