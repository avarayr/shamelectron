import { Github, GitPullRequest, TwitterIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-800/50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left side - GitHub link with icon */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/avarayr/shamelectron"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <div className="p-2 rounded-lg bg-gray-900/50 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors duration-200">
                <Github
                  size={18}
                  className="text-gray-400 group-hover:text-white transition-colors duration-200"
                />
              </div>
              <span className="font-mono text-sm">
                github.com/avarayr/shamelectron
              </span>
            </a>
          </div>

          {/* Center divider */}
          <div className="hidden md:block w-px h-8 bg-gray-800/50"></div>

          {/* Right side - Submit PR link */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/avarayr/shamelectron/tree/main/lib/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <div className="p-2 rounded-lg bg-gray-900/50 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors duration-200">
                <GitPullRequest
                  size={18}
                  className="text-gray-400 group-hover:text-white transition-colors duration-200"
                />
              </div>
              <span className="font-mono text-sm">
                submit an app tracking PR
              </span>
            </a>
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="mt-8 pt-6 border-t border-gray-800/30">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <span className="font-mono text-sm">vibe coded by</span>

            <a
              href="https://x.com/normarayr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-[#1DA1F2] hover:text-gray-300 transition-colors duration-200 font-medium flex items-center gap-2"
            >
              <TwitterIcon />
              <span className="font-mono text-sm">normarayr</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
