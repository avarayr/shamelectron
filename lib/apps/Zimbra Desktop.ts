import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Zimbra Desktop: AppMeta = {
  icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/da/b7/e5/dab7e575-d90d-fb26-4688-6c49689e4304/AppIcon-1x_U007emarketing-0-10-0-85-220-0.png/460x0w.webp",
  id: "zimbra desktop",
  friendlyName: "Zimbra Desktop",
  twitter: "zimbra",
  async checkIsFixed() {
    const url =
      "https://files.zimbra.com/downloads/zxui/4.46.0/Zimbra_Desktop_4.46.0_c975480bb_20250701130514.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
