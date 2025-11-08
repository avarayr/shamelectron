import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const BuildBetter: AppMeta = {
  icon: "https://buildbetter.ai/favicon.ico",
  id: "buildbetter",
  friendlyName: "BuildBetter",
  async checkIsFixed() {
    const versions = await fetch(
      "https://download.todesktop.com/240120qxd7y13zk/latest-mac.yml"
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
      file.url.includes("-arm64-mac.zip")
    )?.url;

    const url = `https://download.todesktop.com/240120qxd7y13zk/${filename}`;

    const pat = "_cornerMask";
    const result = await findPattern(url, pat, { useGetCheck: true });
   
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
