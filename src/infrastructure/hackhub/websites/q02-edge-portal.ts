import {
    RegisterWebsite,
    Website,
    type WebsitePageDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q02_EDGE_SITE_NAME, Q02_WEB_HOST } from "../../../content/index.js";

import statusPage from "./q02-edge-status.html";

@RegisterWebsite
export class Q02EdgeWebsite extends Website {
    SiteName = Q02_EDGE_SITE_NAME;
    Host = Q02_WEB_HOST;
    Icon = "";

    Pages: WebsitePageDefinition[] = [
        {
            path: "/",
            title: "edge-03 — Node Status",
            description: "Internal edge node monitoring interface.",
            html: statusPage,
        },
    ];
}
