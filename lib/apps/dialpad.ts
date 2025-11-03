import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Dialpad: AppMeta = {
  icon: "https://cdn.brandfetch.io/idUMeZW7IP/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1755681511906",
  id: "dialpad",
  friendlyName: "Dialpad",
  twitter: "dialpad",
  async checkIsFixed() {
    const url =
      "https://storage.googleapis.com/dialpad_native/osx/arm64/Dialpad.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
