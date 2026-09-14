import {
    RegisterWebsite,
    Website,
    type WebsitePageDefinition,
} from "@hotbunny/hackhub-content-sdk";

import {
    Q02_HIDDEN_HOSTNAME,
    Q02_HIDDEN_HOSTNAME_IP,
} from "../../../content/index.js";

import diagnosticTemplate from "./templates/unreachable-diagnostic.html";

// The private gateway behind the certificate's hidden SAN entry is
// deliberately never actually reachable — confirmed live that pinging it
// already returns native isUp: false with no fixture needed. Browsing it
// used to hit HackHub's generic "no such host" 404 on both http:// and
// https://; this renders that same outcome as an in-fiction connection
// timeout instead, reusing the reusable templates/unreachable-diagnostic.html
// base (see docs/phase13-quest-structure-standard.md for the template
// catalog). Two Website registrations are needed — one per Host string —
// since a player may reach this dead end via either the hostname or the
// raw IP nslookup revealed.
const CRI_GATEWAY_PORT = "443";

const renderDiagnosticPage = (target: string): string =>
    diagnosticTemplate
        .replaceAll("__TARGET__", target)
        .replace("__PORT__", CRI_GATEWAY_PORT);

const diagnosticPages = (target: string): WebsitePageDefinition[] => [
    {
        path: "/",
        title: "Connection Timeout",
        description: "No response from host.",
        html: renderDiagnosticPage(target),
    },
];

@RegisterWebsite
export class Q02CriGatewayHostnameWebsite extends Website {
    SiteName = Q02_HIDDEN_HOSTNAME;
    Host = Q02_HIDDEN_HOSTNAME;
    Icon = "";

    Pages: WebsitePageDefinition[] = diagnosticPages(Q02_HIDDEN_HOSTNAME);
}

// Experimental: Website.Host set to a raw IP instead of a domain name —
// same pattern already used by Q02GatewayWebsite. See
// docs/phase13-q02-source-recovered.md.
@RegisterWebsite
export class Q02CriGatewayIpWebsite extends Website {
    SiteName = Q02_HIDDEN_HOSTNAME_IP;
    Host = Q02_HIDDEN_HOSTNAME_IP;
    Icon = "";

    Pages: WebsitePageDefinition[] = diagnosticPages(Q02_HIDDEN_HOSTNAME_IP);
}
