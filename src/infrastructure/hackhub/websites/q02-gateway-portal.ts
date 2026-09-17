import {
    RegisterWebsite,
    Website,
    type DynamicWebsitePageDefinition,
    type PageContext,
    type PageMetadata,
} from "@hotbunny/hackhub-content-sdk";

import {
    Q02_GATEWAY_IP,
    Q02_GATEWAY_SERVICE_NAME,
    Q02_GATEWAY_SERVICE_VERSION,
} from "../../../content/index.js";

import certificatePage from "./q02-gateway-certificate.html";
import httpErrorPage from "./q02-gateway-http-error.html";

const NGINX_VERSION_HEADER = Q02_GATEWAY_SERVICE_VERSION.replace(" ", "/");
const RENDERED_HTTP_ERROR_PAGE = httpErrorPage.replace(
    "__NGINX_VERSION__",
    NGINX_VERSION_HEADER,
);

@RegisterWebsite
export class Q02GatewayWebsite extends Website {
    SiteName = Q02_GATEWAY_SERVICE_NAME;
    Host = Q02_GATEWAY_IP;
    Icon = "";

    Pages: DynamicWebsitePageDefinition[] = [
        {
            path: "/",
            metadata: (context: PageContext): PageMetadata => {
                if (!context.url.startsWith("https:")) {
                    return {
                        title: "400 Bad Request",
                        description: "Insecure request rejected.",
                        html: RENDERED_HTTP_ERROR_PAGE,
                    };
                }

                return {
                    title: "Private Gateway",
                    description: "Unregistered internal gateway service.",
                    html: certificatePage,
                };
            },
        },
    ];
}
