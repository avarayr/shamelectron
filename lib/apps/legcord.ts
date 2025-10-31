import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Legcord: AppMeta = {
  icon: "https://avatars.githubusercontent.com/u/85643862?s=128",
  id: "legcord",
  friendlyName: "Legcord",
  twitter: "Legcord",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/Legcord/Legcord/releases/latest"
    )
      .then((res) => res.json())
      .then((data) => {
        const dmgAsset = data.assets.find((asset: { name: string }) =>
          asset.name.toLowerCase().includes("legcord") &&
          asset.name.endsWith(".dmg")
        ) || data.assets.find((asset: { name: string }) =>
          asset.name.endsWith(".dmg")
        );
        return dmgAsset?.browser_download_url;
      });
    if (!url) {
      throw new Error("Could not find .dmg asset in latest release");
    }
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
