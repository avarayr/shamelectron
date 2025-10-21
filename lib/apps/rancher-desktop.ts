import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const RancherDesktop: AppMeta = {
  icon: "https://rancherdesktop.io/images/icon-rancher-desktop.svg",
  id: "rancher-desktop",
  friendlyName: "Rancher Desktop",
  async checkIsFixed() {
    const url =
      "https://github.com/rancher-sandbox/rancher-desktop/releases/download/v1.20.0/Rancher.Desktop-1.20.0.aarch64.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
