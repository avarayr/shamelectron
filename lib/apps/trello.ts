import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const Trello: AppMeta = {
    icon: "https://bxp-content-static.prod.public.atl-paas.net/img/favicon.ico",
    id: "trello",
    friendlyName: "Trello",
    twitter: "trello",
    async checkIsFixed() {
      return FixedStatus.NOT_FIXED
    },
      

};
