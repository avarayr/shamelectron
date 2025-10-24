import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Framer: AppMeta = {
  icon: "https://cdn.brandfetch.io/idCeIE9B96/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667565216026",
  id: "framer-stable",
  friendlyName: "Framer",
  twitter: "framer",
  async checkIsFixed() {
    const url = "https://updates.framer.com/electron/darwin/arm64/Framer.zip";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
