import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Freelens: AppMeta = {
    icon: "https://freelensapp.github.io/images/freelens-logo.png",
    id: "freelens",
    friendlyName: "Freelens",
    async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/freelensapp/freelens/releases/latest"
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
