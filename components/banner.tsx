export function Banner() {
  return (
    <div className="relative isolate flex items-center justify-center gap-x-6 overflow-hidden bg-emerald-500/10 px-6 py-3 sm:px-3.5 border-b border-emerald-500/20 backdrop-blur-md shadow-[0_0_30px_-15px_rgba(16,185,129,0.3)]">
      {/* Background glow effect */}
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#34d399] to-[#10b981] opacity-20 dark:opacity-10"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>
      <div
        className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#34d399] to-[#10b981] opacity-20 dark:opacity-10"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-50 font-medium">
          <strong className="font-bold bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md text-emerald-700 dark:text-emerald-300 mr-2 border border-emerald-200 dark:border-emerald-800">
            🎉 Good news!
          </strong>
          This issue appears to be fixed on the latest betas of macOS 26.2
        </p>
      </div>
    </div>
  );
}
