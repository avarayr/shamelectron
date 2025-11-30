import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const StandardNotes: AppMeta = {
  // prettier-ignore
  icon: "https://avatars.githubusercontent.com/u/24537496?s=128",
  id: "standard-notes",
  friendlyName: "Standard Notes",
  twitter: "StandardNotes",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/standardnotes/app/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find(
            (asset: { name: string }) =>
              asset.name.endsWith("-mac-arm64.zip")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
