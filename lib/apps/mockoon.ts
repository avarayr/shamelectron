import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Mockoon: AppMeta = {
  icon: "https://mockoon.com/images/logo-eyes.png",
  id: "mockoon",
  friendlyName: "Mockoon",
  twitter: "",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/mockoon/mockoon/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find(
            (asset: { name: string }) =>
              asset.name.startsWith("mockoon.setup") &&
              asset.name.endsWith(".arm64.dmg")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
