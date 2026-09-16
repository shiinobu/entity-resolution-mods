// SKELETON — see docs/source-current.md. Host/IP are real
// (sourced — see src/content/q05.ts's Q05_WEB_HOST/Q05_TARGET_IP comment).
// No protocol-gating yet (§6 of docs/implementation-rules.md) —
// decide once Q05 becomes the active implementation target (this host is
// HTTPS-only per its own network fixture, so §6 gating will need to reject
// plain http:// once real page content is written).

import {
    RegisterWebsite,
    Website,
    type DynamicWebsitePageDefinition,
    type PageMetadata,
} from "@hotbunny/hackhub-content-sdk";

import { Q05_WEB_HOST } from "../../../content/index.js";

@RegisterWebsite
export class Q05NusantaraPayWebsite extends Website {
    SiteName = "Nusantara Pay — Staging";
    Host = Q05_WEB_HOST;
    Icon = "";

    Pages: DynamicWebsitePageDefinition[] = [
        {
            path: "/",
            metadata: (): PageMetadata => ({
                title: "Operations Classification Console",
                description: "TODO: staging portal content — not yet written.",
                html: "<p>TODO: staging portal content</p>",
            }),
        },
    ];
}
