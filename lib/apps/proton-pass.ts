import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const ProtonPass: AppMeta = {
  icon: "https://proton.me/favicons/apple-touch-icon.png",
  id: "proton-pass",
  friendlyName: "Proton Pass",
  twitter: "ProtonPrivacy",
  async checkIsFixed() {
    const url = "https://proton.me/download/pass/macos/ProtonPass_1.32.11.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
