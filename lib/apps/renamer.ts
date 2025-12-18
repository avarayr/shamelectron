import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Renamer: AppMeta = {
  icon: "https://renamer.ai/favicon.ico",
  id: "renamer",
  friendlyName: "Renamer.ai",
  async checkIsFixed() {
    const url = "https://files.renamer.ai/installers/renamer.ai-arm64.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};

