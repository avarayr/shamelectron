import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const BeekeeperStudio: AppMeta = {
  icon: "https://cdn.brandfetch.io/idSCESg8RD/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1758503122837",
  id: "beekeeper-studio",
  friendlyName: "Beekeeper Studio",
  twitter: "beekeeperstudio",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/beekeeper-studio/beekeeper-studio/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.endsWith("-arm64.dmg")
          )?.browser_download_url
      );

    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
