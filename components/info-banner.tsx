import { Info } from "lucide-react";

export function InfoBanner() {
  return (
    <div className="mb-6 sm:mb-8 relative overflow-hidden bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-700/30 rounded-xl backdrop-blur-sm">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/[0.03] to-transparent"></div>

      <div className="relative px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" strokeWidth={2} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm sm:text-base text-emerald-100 font-mono leading-relaxed">
              🎉 Great news! This issue appears to be fixed on the latest macOS 26.2 betas
            </div>
            <div className="text-xs text-emerald-300/60 font-mono mt-1">
              Users on macOS 26.2 beta are reporting improved performance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
