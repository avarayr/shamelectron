import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Loom: AppMeta = {
  icon: "https://cdn.brandfetch.io/iddLCZGlbs/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667809258295",
  id: "loom",
  friendlyName: "Loom",
  twitter: "loom",
  async checkIsFixed() {
    const versions = await fetch(
      "https://packages.loom.com/desktop-packages/latest-mac.yml"
    )
      .then((res) => res.text())
      .then(
        (text) =>
          Bun.YAML.parse(text) as {
            version: string;
            files: { url: string }[];
          }
      );

    const filename = versions.files?.find((file) =>
      file.url.endsWith(".dmg") && !file.url.includes("-arm64")
    )?.url;

    const url = `https://packages.loom.com/desktop-packages/${filename}`;

    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
