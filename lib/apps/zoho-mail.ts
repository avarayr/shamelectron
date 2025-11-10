import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const ZohoMail: AppMeta = {
  icon: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Zoho_Mail-256.png",
  id: "zoho-mail",
  friendlyName: "Zoho Mail",
  twitter: "zohomail",
  async checkIsFixed() {
    // Generate random cache-busting parameter
    const randomString = Math.random().toString(36).substring(2, 15);
    const yamlUrl = `https://downloads.zohocdn.com/zmail-desktop/mac/latest-arm64-mac.yml?noCache=${randomString}`;

    const versions = await fetch(yamlUrl)
      .then((res) => res.text())
      .then(
        (text) =>
          Bun.YAML.parse(text) as {
            version: string;
            files: {
              url: string;
              sha512: string;
              size: number;
            }[];
          }
      );

    // Find the DMG installer file (not the update zip)
    const dmgFile = versions.files?.find(
      (file) => file.url.includes("update-arm64") && file.url.endsWith(".zip")
    );

    if (!dmgFile?.url) {
      throw new Error("Could not find DMG installer file in latest release");
    }

    const pat = "_cornerMask";
    const result = await findPattern(dmgFile.url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
