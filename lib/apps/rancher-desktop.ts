import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const RancherDesktop: AppMeta = {
  icon: "https://rancherdesktop.io/images/icon-rancher-desktop.svg",
  id: "rancher-desktop",
  friendlyName: "Rancher Desktop",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/rancher-sandbox/rancher-desktop/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find(
            (asset: { name: string }) =>
              asset.name.startsWith("Rancher.Desktop") &&
              asset.name.endsWith(".dmg")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
