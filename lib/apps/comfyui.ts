import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Comfyui: AppMeta = {
  icon: "https://framerusercontent.com/images/3cNQMWKzIhIrQ5KErBm7dSmbd2w.png",
  id: "comfyui"
  friendlyName: "ComfyUI",
  twitter: "ComfyUI",
  async checkIsFixed() {
    const url =
      "https://download.comfy.org/mac/dmg/arm64";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
