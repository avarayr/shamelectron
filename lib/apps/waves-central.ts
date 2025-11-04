import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const WavesCentral: AppMeta = {
  icon: "https://media.wavescdn.com/images/favicons/android-chrome-192x192.png",
  id: "waves-central-stable",
  friendlyName: "Waves Central",
  twitter: "WavesAudioLtd",
  async checkIsFixed() {
    const url =
      "https://cf-installers.waves.com/WavesCentral/Install_Waves_Central.dmg";
    const pat = "_cornerMask";
    const result = await findPattern(url, pat, { useGetCheck: true });
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
