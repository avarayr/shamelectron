import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const ProtonMail: AppMeta = {
  icon: "https://pmecdn.protonweb.com/image-transformation/?s=c&image=image%2Fupload%2Fstatic%2Flogos%2Ficons%2Fmail_xxy4bg.svg",
  id: "proton-mail",
  friendlyName: "Proton Mail",
  twitter: "ProtonPrivacy",
  async checkIsFixed() {
    const url = "https://proton.me/download/mail/macos/ProtonMail-desktop.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
