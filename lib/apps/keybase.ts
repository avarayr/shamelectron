import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Keybase: AppMeta = {
  // prettier-ignore
  icon: "https://cdn.brandfetch.io/idnGQ5ixrr/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1753832315722",
  id: "keybase",
  friendlyName: "Keybase",
  twitter: "keybaseio",
  async checkIsFixed() {
    const url = "https://prerelease.keybase.io/Keybase-arm64.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
