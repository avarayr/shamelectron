import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Asana: AppMeta = {
  icon: "https://cdn.brandfetch.io/idxPi2Evsk/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515642970",
  id: "asana-desktop",
  friendlyName: "Asana for Desktop",
  twitter: "asana",
  async checkIsFixed() {
    const url =
      "https://desktop-downloads.asana.com/darwin_universal/prod/latest/Asana.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
