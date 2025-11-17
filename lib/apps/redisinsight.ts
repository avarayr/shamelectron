import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const RedisInsight: AppMeta = {
    icon: "https://avatars.githubusercontent.com/u/1529926?s=128",
    id: "redisinsight",
    friendlyName: "RedisInsight",
    twitter: "Redisinc",
    async checkIsFixed() {
        const url = "https://s3.amazonaws.com/redisinsight.download/public/latest/Redis-Insight-mac-x64.dmg";
        const pat = "_cornerMask";
        const result = await findPattern(url, pat);
        return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
    },
};
