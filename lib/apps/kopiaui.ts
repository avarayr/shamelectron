import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const KopiaUI: AppMeta = {
  icon: "https://github.com/kopia/kopia/raw/master/icons/kopia.svg",
  id: "kopiaui",
  friendlyName: "KopiaUI",
  twitter: "kopia_backup",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/kopia/kopia/releases/latest"
    )
      .then((res) => res.json())
      .then((data) => {
        const dmgAsset = data.assets.find((asset: { name: string }) =>
          asset.name.endsWith("arm64.dmg")
        );
        return dmgAsset?.browser_download_url;
      });

    if (!url) {
      throw new Error("Could not find macOS DMG asset in latest release");
    }

    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
