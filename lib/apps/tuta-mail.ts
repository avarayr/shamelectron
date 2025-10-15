import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const TutaMail: AppMeta = {
  icon: "https://tuta.com/favicon/logo-favicon.svg",
  id: "tuta-mail",
  friendlyName: "Tuta Mail",
  twitter: "TutaPrivacy",
  async checkIsFixed() {
    const url = "https://app.tuta.com/desktop/tutanota-desktop-mac.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
