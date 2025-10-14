import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const 1min.ai: AppMeta = {
  icon: "https://1min.ai/_next/image?url=%2Fimages%2Flogo%2Flogo-text.png",
  id: "1min.ai",
  friendlyName: "1min AI",
  twitter: "1min_dot_AI",
  async checkIsFixed() {
    const url =
      "https://1minai-application.s3.us-east-1.amazonaws.com/app/darwin/arm64/1min+AI.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
