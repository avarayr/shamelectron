import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Clickup: AppMeta = {
  icon: "https://cdn.brandfetch.io/idU6lzwMYA/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
  id: "clickup",
  friendlyName: "Clickup",
  twitter: "clickup",
  async checkIsFixed() {
    const url =
      "https://desktop.clickup.com/mac";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
