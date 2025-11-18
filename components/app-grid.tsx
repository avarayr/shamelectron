import { AppRecord } from "@/types";
import { AppGridClient } from "./app-grid-client";
import { Footer } from "./footer";
import TimeAgo from "./time-ago";
import { InfoBanner } from "./info-banner";

const dateTime = new Date(
  new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
);

export function AppGrid({ apps }: { apps: AppRecord[] }) {
  const fixedCount = apps.filter((app) => app.isFixed === "fixed").length;
  const notFixedCount = apps.filter(
    (app) => app.isFixed === "not_fixed"
  ).length;
  const unknownCount = apps.filter((app) => app.isFixed === "unknown").length;
  const totalCount = apps.length;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large blob top-left */}
        <div className="absolute -top-80 -left-80 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl"></div>

        {/* Large blob top-right */}
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-2xl"></div>

        {/* Large blob bottom-left */}
        <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-red-500/10 to-transparent rounded-full blur-2xl"></div>

        {/* Large blob bottom-right */}
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-yellow-500/10 via-orange-500/10 to-transparent rounded-full blur-3xl"></div>

        {/* Massive center blob */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {/* Informational Banner */}
        <InfoBanner />

        {/* Header */}
        <header className="mb-3">
          <h1 className="text-2xl font-mono text-white mb-2">shamelectron</h1>
          <div className="text-muted text-sm font-mono mb-6">
            <div>
              Tracking problematic Electron apps macOS Tahoe.
              <div className="text-subtle">
                Major GPU performance issue on macOS 26 (
                <a
                  href="https://github.com/electron/electron/pull/48376"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition-colors"
                >
                  electron/electron#48376
                </a>
                ).
              </div>
            </div>
          </div>

          {/* Elegant Stats Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/40 to-gray-800/20 border border-gray-700/50 rounded-xl backdrop-blur-sm mb-8">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>

            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-mono text-white/90 uppercase tracking-[0.15em] mb-1">
                    Status Overview
                  </h2>
                  <div className="text-xs text-gray-400 font-mono">
                    {totalCount} total apps tracked
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-mono mb-2 uppercase tracking-wide">
                    Last updated
                  </div>
                  <div className="text-sm font-mono font-medium bg-yellow-300 text-black rounded px-2 py-0.5 inline-block shadow-sm">
                    <TimeAgo updatedAt={dateTime} />
                  </div>
                  <div className="text-xs text-gray-300 font-mono mt-1 opacity-80 mt-2">
                    updates automatically every{" "}
                    <span className="underline decoration-dashed underline-offset-4">
                      12 hours
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <div className="text-3xl font-mono text-emerald-400 font-light">
                    {fixedCount}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    fixed
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-mono text-red-400 font-light">
                    {notFixedCount}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    not fixed
                  </div>
                </div>

                {unknownCount > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-mono text-gray-400 font-light">
                      {unknownCount}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      unknown
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Developer Notice */}
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-300 font-mono mb-2">
              Are you an Electron app developer?
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Bump Electron to at least versions{" "}
              <span className="text-emerald-400">v38.2.0</span>,{" "}
              <span className="text-emerald-400">v37.6.0</span> and{" "}
              <span className="text-emerald-400">v36.9.2</span>
            </div>
          </div>
        </div>

        {/* Apps List with Client-Side Toggle */}
        <AppGridClient apps={apps} />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
