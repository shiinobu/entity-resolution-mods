import {
    RegisterWebsite,
    Website,
    type DynamicWebsitePageDefinition,
    type PageContext,
    type PageMetadata,
} from "@hotbunny/hackhub-content-sdk";

import { Q02_EDGE_SITE_NAME, Q02_WEB_HOST } from "../../../content/index.js";

import httpErrorPage from "./q02-edge-http-error.html";
import statusPage from "./q02-edge-status.html";

// Port 80 is absent from Q02_NMAP_RESULT for this target (only 22/443/8443
// are modeled) — per the mandatory protocol-gating rule (locked
// 2026-09-14, docs/phase13-quest-structure-standard.md §6), a port not
// listed at all defaults to CLOSE, so plain HTTP must return 400 Bad
// Request here too, matching Q01SkynetLogisticsWebsite's pattern exactly.
@RegisterWebsite
export class Q02EdgeWebsite extends Website {
    SiteName = Q02_EDGE_SITE_NAME;
    Host = Q02_WEB_HOST;
    Icon = "";

    Pages: DynamicWebsitePageDefinition[] = [
        {
            path: "/",
            metadata: (context: PageContext): PageMetadata => {
                if (!context.url.startsWith("https:")) {
                    return {
                        title: "400 Bad Request",
                        description: "Insecure request rejected.",
                        html: httpErrorPage,
                    };
                }

                return {
                    title: "edge-03 — Node Status",
                    description: "Internal edge node monitoring interface.",
                    html: statusPage,
                };
            },
        },
    ];
}
