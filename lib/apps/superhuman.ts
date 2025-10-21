import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Superhuman: AppMeta = {
  icon: "https://cdn.brandfetch.io/id_4JNEAzK/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667687835411",
  id: "superhuman",
  friendlyName: "Superhuman",
  twitter: "superhuman",
  async checkIsFixed() {
    const url = "https://superhuman.com/mac-m1";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
