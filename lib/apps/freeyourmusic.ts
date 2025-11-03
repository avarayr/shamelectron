import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const FreeYourMusic: AppMeta = {
  icon: "https://cdn.brandfetch.io/idgC4F2aRd/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1755083578876",
  id: "freeyourmusic",
  friendlyName: "FreeYourMusic",
  twitter: "freeyourmusic",
  async checkIsFixed() {
    const versions = await fetch(
      "https://fym-app-production.s3.nl-ams.scw.cloud/latest-mac.yml"
    )
      .then((res) => res.text())
      .then(
        (text) =>
          Bun.YAML.parse(text) as {
            version: string;
            files: { url: string }[];
          }
      );

    const filename = versions.files?.find((file) =>
      file.url.endsWith(".dmg") && !file.url.includes("x64") && !file.url.includes("universal")
    )?.url;

    const url = `https://fym-app-production.s3.nl-ams.scw.cloud/${filename}`;

    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
