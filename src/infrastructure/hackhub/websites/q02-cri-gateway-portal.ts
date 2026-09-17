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

@RegisterWebsite
export class Q02CriGatewayIpWebsite extends Website {
    SiteName = Q02_HIDDEN_HOSTNAME_IP;
    Host = Q02_HIDDEN_HOSTNAME_IP;
    Icon = "";

    Pages: WebsitePageDefinition[] = diagnosticPages(Q02_HIDDEN_HOSTNAME_IP);
}
