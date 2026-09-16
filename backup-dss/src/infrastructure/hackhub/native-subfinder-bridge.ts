import {
    Events,
    Shell,
} from "@hotbunny/hackhub-content-sdk";

import type {
    NativeSubdomainResolver,
} from "../../application/ops/recon-service.js";

// HackHub's native `subfinder` command is undocumented for mod invocation
// and isn't part of Shell.CommandDataMap, but the SDK's ModEventMap lists
// Subfinder.Try / Subfinder.Results as listenable events. This bridge tries
// to trigger the real native generator and read its result back; if it
// never fires within the timeout, callers fall back to a synthetic profile.
const NATIVE_SUBFINDER_TIMEOUT_MS = 6000;

export const resolveNativeSubdomains: NativeSubdomainResolver = (
    domain: string,
): Promise<readonly string[] | null> => new Promise((resolve) => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;

    const finish = (value: readonly string[] | null): void => {
        if (settled) {
            return;
        }

        settled = true;
        clearTimeout(timer);
        unsubscribe?.();
        resolve(value);
    };

    const timer = setTimeout(() => {
        console.warn(`[DSS] native subfinder timed out for '${domain}' after ${NATIVE_SUBFINDER_TIMEOUT_MS}ms`);
        finish(null);
    }, NATIVE_SUBFINDER_TIMEOUT_MS);

    try {
        unsubscribe = Events.on("Subfinder.Results", (event) => {
            console.log("[DSS] Subfinder.Results received:", event);

            if (!event || event.domain.toLowerCase() !== domain.toLowerCase()) {
                console.log(`[DSS] Subfinder.Results domain mismatch: expected '${domain}', got '${event?.domain}'`);
                return;
            }

            const subdomains = Array.isArray(event.subdomains)
                ? event.subdomains.filter(
                    (value): value is string => typeof value === "string",
                )
                : [];

            finish(subdomains.length > 0 ? subdomains : null);
        });

        console.log(`[DSS] invoking Shell.exec('subfinder -d ${domain}')`);
        Shell.exec(`subfinder -d ${domain}`)
            .then(() => console.log(`[DSS] Shell.exec resolved for 'subfinder -d ${domain}'`))
            .catch((error) => {
                console.warn(`[DSS] Shell.exec rejected for 'subfinder -d ${domain}':`, error);
                finish(null);
            });
    } catch (error) {
        console.warn("[DSS] native subfinder bridge failed:", error);
        finish(null);
    }
});
