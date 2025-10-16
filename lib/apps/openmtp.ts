import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Openmtp: AppMeta = {
  icon: "https://openmtp.ganeshrvel.com/favicon.ico",
  id: "openmtp",
  friendlyName: "openmtp",
  twitter: "openmtp",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/ganeshrvel/openmtp/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.endsWith("mac-arm64.dmg")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
