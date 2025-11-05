import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const ProtonPass: AppMeta = {
  icon: "https://proton.me/favicons/apple-touch-icon.png",
  id: "proton-pass",
  friendlyName: "Proton Pass",
  twitter: "ProtonPrivacy",
  async checkIsFixed() {
    const versions = await fetch(
      "https://proton.me/download/PassDesktop/darwin/universal/version.json"
    )
      .then((res) => res.text())
      .then(
        (text) =>
          JSON.parse(text) as {
            Releases: Array<{ File: Array<{ Url: string }> }>;
          }
      );
    const url = versions.Releases?.[0].File?.[0]?.Url;
    if (!url) {
      throw new Error("Could not find .dmg asset in latest release");
    }
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
