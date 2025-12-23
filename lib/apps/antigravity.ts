import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Antigravity: AppMeta = {
  icon: "https://cdn.brandfetch.io/idR_Q3daYc/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1763658538701",
  id: "antigravity-ide-stable",
  friendlyName: "Google Antigravity IDE",
  twitter: "antigravity",
  async checkIsFixed() {
    const url = await fetch(
      "https://antigravity.google/download"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.includes("darwin-arm") && asset.name.endsWith(".dmg")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
