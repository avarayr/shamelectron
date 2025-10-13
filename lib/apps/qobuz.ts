import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Qobuz: AppMeta = {
  icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/7a/fb/92/7afb9286-fb02-55fc-60b8-0eb9cdd80d50/AppIcon-Release-0-0-1x_U007epad-0-1-0-85-220.png/460x0w.webp",
  id: "Qobuz",
  friendlyName: "Qobuz",
  twitter: "qobuz",
  async checkIsFixed() {
    const url =
      "https://desktop.qobuz.com/releases/darwin/arm64/bigsur/8.1.0-b019/Qobuz.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
