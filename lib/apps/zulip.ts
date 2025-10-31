import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Zulip: AppMeta = {
  icon: "https://cdn.brandfetch.io/idEa7rFF7H/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1755950906745",
  id: "zulip",
  friendlyName: "Zulip",
  twitter: "zulip",
  async checkIsFixed() {
    const url = "https://zulip.com/apps/download/mac-arm64";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
