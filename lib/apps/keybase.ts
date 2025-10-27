import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Keybase: AppMeta = {
  // prettier-ignore
  icon: "https://cdn.brandfetch.io/idnGQ5ixrr/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1753832315722",
  id: "keybase",
  friendlyName: "Keybase",
  twitter: "keybaseio",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/keybase/client/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find(
            (asset: { name: string }) =>
              asset.name.startsWith("keybase-v") &&
              asset.name.endsWith(".tar.xz")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
