import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Miro: AppMeta = {
  icon: "https://cdn.brandfetch.io/idAnDTFapY/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1751372903964",
  id: "miro-stable",
  friendlyName: "Miro",
  twitter: "mirohq",
  async checkIsFixed() {
    const url =
      "https://desktop.miro.com/platforms/darwin-arm64/Install-Miro.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
