import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const CricutDesignSpace: AppMeta = {
  icon: "https://cdn.brandfetch.io/idkNv9kgpD/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764632626928",
  id: "cricut-design-space",
  friendlyName: "Cricut Design Space",
  twitter: "cricut",
  async checkIsFixed() {
    const url = "https://design.cricut.com/";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
