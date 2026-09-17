import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

export const Q04_GATEWAY_LOG_CONTENT = [
    "Sep 09 14:02:11 edge-03 gateway-relay: session established with 10.42.7.18",
    "Sep 09 14:07:53 edge-03 gateway-relay: session closed",
].join("\n");

export const Q04_AUTH_LOG_CONTENT = [
    "Sep 08 11:19:40 edge-03 sshd: Accepted password for auditor from 203.0.113.10",
].join("\n");

export const Q04_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "var",
        isFolder: true,
        children: [
            {
                name: "log",
                isFolder: true,
                children: [
                    { name: "gateway", extension: "log", data: Q04_GATEWAY_LOG_CONTENT },
                    { name: "auth", extension: "log", data: Q04_AUTH_LOG_CONTENT },
                ],
            },
        ],
    },
];
