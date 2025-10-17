import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Fastmail: AppMeta = {
  icon: "https://www.fastmailcdn.com/proxy/aHR0cHM6Ly9hcHAuZmFzdG1haWwuY29tL3N0YXRpYy9mYXZpY29ucy9GTS1BcHAtSWNvbi01MTIucG5n/FM-App-Icon-512.png",
  id: "fastmail",
  friendlyName: "Fastmail",
  twitter: "Fastmail",
  async checkIsFixed() {
    const url = "https://www.fastmail.com/download/macos/arm64/";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
