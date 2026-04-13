import Link from "next/link";
import {
  Zap,
  Activity,
  BarChart3,
  Shield,
  ArrowRight,
  CircleDot,
} from "lucide-react";
import WarningBanner from "@/app/components/WarningBanner";

export default function LandingPage() {
  return (
    <>
      <WarningBanner />

      {/* ============ HERO SECTION ============ */}
      <main className="relative flex flex-1 flex-col">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="pointer-events-none absolute inset-0 radial-glow" />

        <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          {/* Badge */}
          <div className="animate-fade-in mb-8 flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/5 px-4 py-2">
            <Zap className="h-4 w-4 text-accent-green" />
            <span className="text-sm font-medium text-accent-green">
              AI-Powered Analytics Engine
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in text-center text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-foreground">Welcome to{" "}</span>
            <span className="gradient-text">SureOdds</span>
          </h1>

          {/* Subtext */}
          <p
            className="animate-fade-in mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted sm:text-xl"
            style={{ animationDelay: "0.15s" }}
          >
            A data-driven prediction engine that analyses thousands of
            statistical variables to deliver high-confidence betting insights
            across football and basketball markets.
          </p>

          {/* Stats Row */}
          <div
            className="animate-fade-in mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
            style={{ animationDelay: "0.3s" }}
          >
            {[
              { label: "Avg Accuracy", value: "87%", icon: Activity },
              { label: "Daily Matches", value: "200+", icon: BarChart3 },
              { label: "Markets Covered", value: "12", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-green/10">
                  <stat.icon className="h-5 w-5 text-accent-green" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ============ CATEGORY CARDS ============ */}
          <div
            className="animate-slide-up mt-16 grid w-full max-w-3xl gap-5 sm:grid-cols-2"
            style={{ animationDelay: "0.45s" }}
          >
            {/* Football Card */}
            <Link
              href="/football"
              id="category-football"
              className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-8 transition-all duration-300 hover:border-accent-green/40 hover:shadow-2xl hover:shadow-accent-green/10 hover:-translate-y-1"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-green/10 blur-3xl transition-all duration-500 group-hover:bg-accent-green/20" />

              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-green/10 text-3xl transition-transform duration-300 group-hover:scale-110">
                  ⚽
                </div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Football Analytics
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-muted">
                  Over 1.5, Over 2.5, Over 3.5, Straight Win, BTTS and more —
                  powered by historical match data and form analysis.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-accent-green transition-all group-hover:gap-3">
                  Explore Markets
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Basketball Card */}
            <Link
              href="/basketball"
              id="category-basketball"
              className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-8 transition-all duration-300 hover:border-accent-orange/40 hover:shadow-2xl hover:shadow-accent-orange/10 hover:-translate-y-1"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-orange/10 blur-3xl transition-all duration-500 group-hover:bg-accent-orange/20" />

              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-orange/10 transition-transform duration-300 group-hover:scale-110">
                  <CircleDot className="h-8 w-8 text-accent-orange" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Basketball Analytics
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-muted">
                  Points totals, spreads, player props and money lines — with
                  real-time confidence scoring from our AI model.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-accent-orange transition-all group-hover:gap-3">
                  Explore Markets
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-subtle py-6">
          <p className="text-center text-xs text-muted">
            © {new Date().getFullYear()} SureOdds. For educational and
            analytical purposes only. Past results do not guarantee future
            outcomes.
          </p>
        </footer>
      </main>
    </>
  );
}