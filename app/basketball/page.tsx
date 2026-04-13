import Link from "next/link";
import { ArrowLeft, Construction, CircleDot } from "lucide-react";
import WarningBanner from "@/app/components/WarningBanner";

export default function BasketballPage() {
  return (
    <>
      <WarningBanner />
      <main className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-grid" />

        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-orange/10 animate-float">
            <CircleDot className="h-10 w-10 text-accent-orange" />
          </div>

          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            Basketball Analytics
          </h1>
          <p className="mb-2 text-lg text-muted">Coming Soon</p>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
            Our AI model is being trained on NBA, EuroLeague, and international
            basketball data. This dashboard will feature points totals, spreads,
            player props, and money line predictions.
          </p>

          <div className="mb-8 flex items-center gap-2 rounded-full border border-accent-orange/20 bg-accent-orange/5 px-4 py-2">
            <Construction className="h-4 w-4 text-accent-orange" />
            <span className="text-sm font-medium text-accent-orange">
              Under Development
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
