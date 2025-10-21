import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const PodmanDesktop: AppMeta = {
  icon: "https://podman-desktop.io/img/logo.svg",
  id: "podman-desktop",
  friendlyName: "Podman Desktop",
  twitter: "podman-desktop",
  async checkIsFixed() {
    const url =
      "https://github.com/podman-desktop/podman-desktop/releases/download/v1.22.1/podman-desktop-1.22.1-universal.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
