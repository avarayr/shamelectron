import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const Qoder: AppMeta = {
  icon: "https://g.alicdn.com/qbase/qoder/0.0.128/favIcon.svg",
  id: "qoder-stable",
  friendlyName: "Qoder",
  twitter: "Qoder_ai_ide",
  async checkIsFixed() {
    const url = "https://download.qoder.com/release/latest/Qoder-darwin-arm64.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};