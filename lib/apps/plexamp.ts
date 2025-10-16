import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Plexamp: AppMeta = {
  icon: "https://cdn.brandfetch.io/id6OgdnqKb/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1736438079801",
  id: "plexamp",
  friendlyName: "plexamp",
  twitter: "plexamp",
  async checkIsFixed() {
    const url = await findDownloadUrl();
    const pat = "_cornerMask";
    const result = await findPattern(url, pat);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};

async function findDownloadUrl() {
  const brewPlexampUrl = "https://formulae.brew.sh/api/cask/plexamp.json";
  const resp = await fetch(brewPlexampUrl, {
    method: "GET",
    redirect: "follow",
  });
  const jsonResponse = await resp.json();
  return jsonResponse.url;
}