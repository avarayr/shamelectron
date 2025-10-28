"use client";

import { useEffect, useState } from "react";
import { AppRecord, FixedStatus } from "@/types";
import {
  HelpCircle,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TwitterIcon,
  Sparkles,
  HeartPulse,
  Heart,
  GithubIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cloneElement } from "react";
import { twMerge } from "tailwind-merge";
import { XTwitterIcon } from "./icons/xtwittericon";

function StatusIndicator({ status }: { status: FixedStatus }) {
  const getStatusDisplay = () => {
    switch (status) {
      case "fixed":
        return {
          Icon: <ThumbsUpIcon />,
          color: "text-green-400",
          bgColor: "bg-green-400/10",
        };
      case "not_fixed":
        return {
          Icon: <ThumbsDownIcon />,
          color: "text-red-400",
          bgColor: "bg-red-400/10",
        };
      default:
        return {
          Icon: <HelpCircle />,
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
        };
    }
  };

  const { Icon, color, bgColor } = getStatusDisplay();

  return (
    <div
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bgColor} flex items-center justify-center border border-gray-800`}
    >
      {cloneElement(Icon, {
        className: twMerge(Icon.props.className, color, "size-5 sm:size-6"),
      })}
    </div>
  );
}

export function AppRow({ app }: { app: AppRecord }) {
  const [showThanksModal, setShowThanksModal] = useState(false);
  const DISMISS_KEY = "x-follow-thanks-dismissed";
  const [dontShowThanksAgain, setDontShowThanksAgain] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(DISMISS_KEY);
    return stored === "1";
  });

  const handleTwitterClick = () => {
    if (!dontShowThanksAgain) {
      setShowThanksModal(true);
    }
  };

  const handleCancel =
    ({ dontShowAgain }: { dontShowAgain: boolean }) =>
    () => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DISMISS_KEY, "1");
      }
      setDontShowThanksAgain(dontShowAgain);
      setShowThanksModal(false);
    };

  const handleFollowX = () => {
    if (typeof window !== "undefined") {
      window.open("https://x.com/normarayr", "_blank", "noopener,noreferrer");
    }
  };

  const handleFollowGithub = () => {
    if (typeof window !== "undefined") {
      window.open(
        "https://github.com/avarayr",
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <div className="flex items-center gap-3 sm:gap-6 py-3 sm:py-4 border-b border-dashed-subtle border-gray-800 hover:bg-gray-900/20">
      {/* Status - Now the main focus */}
      <StatusIndicator status={app.isFixed} />

      {/* Icon */}
      <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
        <Image
          src={app.icon}
          alt={`${app.friendlyName} icon`}
          width={32}
          height={32}
          className="w-full h-full object-cover rounded-sm"
        />
      </div>

      {/* App Name */}
      <div className="flex-1 min-w-0">
        <span className="text-white text-xs sm:text-sm font-mono">
          {app.friendlyName}
        </span>
      </div>

      {/* Twitter Link */}
      <div className="text-center">
        {app.twitter && app.isFixed === FixedStatus.NOT_FIXED && (
          <Link
            href={
              `https://x.com/intent/tweet?text=` +
              encodeURIComponent(
                `Please bump Electron to fix MacOS 26 performance issue @${app.twitter} https://github.com/electron/electron/pull/48376`
              )
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center gap-1 flex-row"
            aria-label={`Follow ${app.friendlyName} on Twitter`}
            onClick={handleTwitterClick}
          >
            <span className="hidden sm:inline text-xs">
              ask <span className="text-white">@{app.twitter}</span> to bump
              Electron
            </span>
            <span className="sm:hidden">
              ask <span className="text-white">@{app.twitter}</span>
            </span>
            <TwitterIcon className="size-3 sm:size-4 ml-1 sm:ml-2" />
          </Link>
        )}
      </div>

      {showThanksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel({ dontShowAgain: false })}
          />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/95 p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Heart className="size-5 text-red-500 fill-red-500" />
            </div>
            <h2 className="text-center text-white font-semibold text-lg">
              Thank you!
            </h2>
            <div className="mt-2 text-center text-sm text-gray-300 space-y-2">
              <div>Hey! Seems like you care about software.</div>

              <div>I&apos;m just like you :)</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="mt-5 flex items-center flex-col justify-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={handleFollowX}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white text-black px-3 py-3 text-sm w-full font-medium hover:bg-gray-200 transition-colors"
                >
                  <XTwitterIcon className="size-4" />
                  <span>Follow me on X</span>
                </button>
                <button
                  type="button"
                  onClick={handleFollowGithub}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white text-black px-3 py-3 text-sm w-full font-medium hover:bg-gray-200 transition-colors"
                >
                  <GithubIcon className="size-4" />
                  <span>Follow me on GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel({ dontShowAgain: false })}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Don&apos;t show again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
