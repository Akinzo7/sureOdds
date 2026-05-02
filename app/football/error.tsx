"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FootballError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[Football ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-red/10">
        <AlertTriangle className="h-8 w-8 text-accent-red" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-foreground">
        Football Dashboard Error
      </h2>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-muted">
        Something went wrong loading the football predictions. This could be a
        temporary API issue — try again in a moment.
      </p>

      {error.digest && (
        <p className="mb-4 rounded-lg bg-surface px-3 py-1.5 text-xs font-mono text-muted">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-accent-green px-6 py-3 text-sm font-bold text-background transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-accent-green/25 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
