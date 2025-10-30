import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const SideQuest: AppMeta = {
  icon: "https://cdn.sidequestvr.com/images/logo.png",
  id: "sidequest-stable",
  friendlyName: "SideQuest",
  twitter: "SideQuestVR",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/SideQuestVR/SideQuest/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.endsWith(".dmg")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
