import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "@/types";

export const AltairGraphql: AppMeta = {
  icon: "https://raw.githubusercontent.com/altair-graphql/altair/refs/heads/master/icons/android-icon-192x192.png",
  id: "altair-graphql",
  friendlyName: "Altair GraphQL Client",
  twitter: "AltairGraphQL",
  async checkIsFixed() {
    const url = await fetch(
      "https://api.github.com/repos/altair-graphql/altair/releases/latest"
    )
      .then((res) => res.json())
      .then(
        (data) =>
          data.assets.find((asset: { name: string }) =>
            asset.name.endsWith("_arm64_mac.zip")
          )?.browser_download_url
      );

    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
