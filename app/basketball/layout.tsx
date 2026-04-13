import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import WarningBanner from "@/app/components/WarningBanner";

export default function BasketballLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WarningBanner />

      {/* Dashboard Header */}
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/10 text-lg">
                🏀
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Basketball Analytics
                </h1>
                <p className="hidden text-xs text-muted sm:block">
                  AI-powered match predictions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-accent-green/20 bg-accent-green/5 px-3 py-1.5 sm:flex">
              <Activity className="h-3.5 w-3.5 text-accent-green" />
              <span className="text-xs font-semibold text-accent-green">
                Live Engine
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        {children}
      </div>
    </>
  );
}
