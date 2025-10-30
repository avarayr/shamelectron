import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Upscayl: AppMeta = {
  icon: "https://raw.githubusercontent.com/upscayl/upscayl/main/resources/icon.png",
  id: "upscayl-stable",
  friendlyName: "Upscayl",
  twitter: "upscayl",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/upscayl/upscayl/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.endsWith("-mac.dmg")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
