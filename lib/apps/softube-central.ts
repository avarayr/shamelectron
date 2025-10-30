import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const SoftubeCentral: AppMeta = {
  icon: "https://www.softube.com/favicon-196x196.png",
  id: "softube-central-stable",
  friendlyName: "Softube Central",
  twitter: "softtubestudios",
  async checkIsFixed() {
    const url =
      "https://softubestorage.b-cdn.net/softubecentraldata/softubecentral/Softube%20Central-2.1.2-universal.pkg";
    const pat = "_cornerMask";
    try {
      const result = await findPattern(url, pat, { useGetCheck: true });
      return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
    } catch {
      // PKG/XAR not supported by pattern scanner yet
      return FixedStatus.UNKNOWN;
    }
  },
};
