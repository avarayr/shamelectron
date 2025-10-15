import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const SparkMail: AppMeta = {
  icon: "https://static.helpjuice.com/helpjuice_production/uploads/upload/image/11007/direct/spark-icon-96x96.png",
  id: "spark-mail-stable",
  friendlyName: "Spark Mail",
  twitter: "SparkMailApp",
  async checkIsFixed() {
    const url = await fetch(
      "https://downloads.sparkmailapp.com/Spark3/mac/dist/appcast.xml"
    )
      .then((res) => res.text())
      .then(
        // Match with RegEx to avoid bringing a whole XML parser dependency just for this
        (text) => text?.match(/<enclosure\s+url="([^"]+\.dmg)"/)?.[1]
      );

    const pat = "_cornerMask";
    const result = await findPattern(url!, pat, {useGetCheck: true});
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
