import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const UAConnect: AppMeta = {
  icon: "https://cdn.brandfetch.io/idCL7JMAKw/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1755454075459",
  id: "ua-connect",
  friendlyName: "UA Connect",
  twitter: "UAudio",
  async checkIsFixed() {
    const url = "https://www.uaudio.com/apps/uaconnect/mac/installer";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
