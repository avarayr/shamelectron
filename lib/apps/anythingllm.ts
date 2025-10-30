import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const AnythingLLM: AppMeta = {
  icon: "https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/master/images/icon.png",
  id: "anythingllm-stable",
  friendlyName: "AnythingLLM",
  twitter: "anythingLLMapp",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/Mintplex-Labs/anything-llm/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.includes("mac-")
          )?.browser_download_url
      );
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
