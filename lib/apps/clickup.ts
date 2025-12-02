import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Clickup: AppMeta = {
  icon: "https://cdn.brandfetch.io/idU6lzwMYA/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
  id: "clickup",
  friendlyName: "Clickup",
  twitter: "clickup",
  async checkIsFixed() {
    const versions = await fetch(
      "https://download.todesktop.com/221003ra4tebclw/latest-mac.yml"
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
      file.url.includes("-arm64.dmg")
    )?.url;

    const url = `https://download.todesktop.com/221003ra4tebclw/${filename}`;

    const pat = "_cornerMask";
    const result = await findPattern(url, pat, { useGetCheck: true });
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
