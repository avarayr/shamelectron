import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Mockoon: AppMeta = {
  icon: "https://mockoon.com/images/logo-eyes.png",
  id: "mockoon",
  friendlyName: "Mockoon",
  twitter: "",
  async checkIsFixed() {
    const url =
      "https://github.com/mockoon/mockoon/releases/download/v9.3.0/mockoon.setup.9.3.0.arm64.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
