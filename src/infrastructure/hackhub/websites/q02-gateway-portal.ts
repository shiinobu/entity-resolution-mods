import {
    RegisterWebsite,
    Website,
    type WebsitePageDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q02_WEB_HOST } from "../../../content/index.js";

import certificatePage from "./q02-gateway-certificate.html";

@RegisterWebsite
export class Q02GatewayWebsite extends Website {
    SiteName = "gateway.internal";
    Host = Q02_WEB_HOST;
    Icon = "";

    Pages: WebsitePageDefinition[] = [
        {
            path: "/",
            title: "gateway.internal — Certificate",
            description: "Unregistered internal gateway service.",
            html: certificatePage,
        },
    ];
}
