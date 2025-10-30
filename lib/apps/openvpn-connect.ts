import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const OpenVPNConnect: AppMeta = {
  icon: "https://dka575ofm4ao0.cloudfront.net/pages-favicon_logos/original/177794/fav.png",
  id: "openvpn-connect-stable",
  friendlyName: "OpenVPN Connect",
  twitter: "OpenVPN",
  async checkIsFixed() {
    const url = "https://openvpn.net/downloads/openvpn-connect-v3-macos.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat, { useGetCheck: true });
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
