import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const UnityHub: AppMeta = {
  icon: "https://cdn.brandfetch.io/idEc0EPR9J/w/128/h/128/theme/dark/symbol.png?c=1bxid64Mup7aczewSAYMX&t=1668070683125",
  id: "unity-hub",
  friendlyName: "Unity Hub",
  twitter: "unity",
  async checkIsFixed() {
    const url = "https://public-cdn.cloud.unity3d.com/hub/prod/UnityHubSetup-arm64.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
