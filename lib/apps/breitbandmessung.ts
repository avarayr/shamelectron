import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Breitbandmessung: AppMeta = {
  icon: "https://breitbandmessung.de/apple-touch-icon-180x180.png",
  id: "breitbandmessung",
  friendlyName: "Breitbandmessung",
  twitter: "bnetza",
  async checkIsFixed() {
    const url = "https://download.breitbandmessung.de/bbm/Breitbandmessung-mac.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
