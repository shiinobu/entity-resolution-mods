import {
    RegisterWebsite,
    Website,
    type DynamicWebsitePageDefinition,
    type PageContext,
    type PageMetadata,
} from "@hotbunny/hackhub-content-sdk";

import {
    Q01_CLIENT_NAME,
    Q01_TARGET_IP,
    Q01_WEB_AUDIT_PATH,
    Q01_WEB_FORBIDDEN_PATHS,
    Q01_WEB_HOME_HOST,
} from "../../../content/index.js";

import forbiddenPage from "./q01-forbidden.html";
import homePage from "./q01-home.html";
import httpErrorPage from "./q01-http-error.html";
import securityPage from "./q01-security.html";

const page = (
    path: string,
    html: string,
    title: string,
    description: string,
): DynamicWebsitePageDefinition => ({
    path,
    metadata: (context: PageContext): PageMetadata => {
        if (!context.url.startsWith("https:")) {
            return {
                title: "400 Bad Request",
                description: "Insecure request rejected.",
                html: httpErrorPage,
            };
        }

        return { title, description, html };
    },
});

@RegisterWebsite
export class Q01SkynetLogisticsWebsite extends Website {
    SiteName = Q01_CLIENT_NAME;
    Host = Q01_WEB_HOME_HOST;
    Icon = "";

    Pages: DynamicWebsitePageDefinition[] = [
        page(
            "/",
            homePage,
            `${Q01_CLIENT_NAME} — Operations Portal`,
            `${Q01_CLIENT_NAME} public operations portal.`,
        ),
        page(
            Q01_WEB_FORBIDDEN_PATHS[0],
            forbiddenPage,
            `${Q01_CLIENT_NAME} — Forbidden`,
            "Restricted public web surface.",
        ),
        page(
            Q01_WEB_FORBIDDEN_PATHS[1],
            forbiddenPage,
            `${Q01_CLIENT_NAME} — Forbidden`,
            "Restricted public web surface.",
        ),
        page(
            Q01_WEB_AUDIT_PATH,
            securityPage,
            `${Q01_CLIENT_NAME} — Security Review`,
            "External security review surface for authorized auditors.",
        ),
    ];

    override Exports = {
        clientName: Q01_CLIENT_NAME,
        targetIp: Q01_TARGET_IP,
    };
}
