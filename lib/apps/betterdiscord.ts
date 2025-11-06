import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const BetterDiscord: AppMeta = {
  icon: "https://avatars.githubusercontent.com/u/72631062?s=128",
  id: "betterdiscord",
  friendlyName: "BetterDiscord",
  twitter: "_BetterDiscord_",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/BetterDiscord/Installer/releases/latest"
    )
      .then((res) => res.json())
      .then((data) => {
        const macAsset = data.assets.find((asset: { name: string }) =>
          asset.name.toLowerCase().includes("mac") &&
          asset.name.endsWith(".zip")
        );
        return macAsset?.browser_download_url;
      });
    if (!url) {
      throw new Error("Could not find Mac .zip asset in latest release");
    }
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
