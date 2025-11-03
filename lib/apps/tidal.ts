import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Tidal: AppMeta = {
  icon: "https://cdn.brandfetch.io/idtVfiVkt8/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1756402137207",
  id: "tidal",
  friendlyName: "TIDAL",
  twitter: "TIDAL",
  async checkIsFixed() {
    const url = "https://desktop.tidal.com/download/mac";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
