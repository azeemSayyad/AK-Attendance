"use client";

import { useEffect } from "react";

/** Registers the service worker once, on the client, after load. */
export default function PWARegister() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
        const onLoad = () => {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.error("SW registration failed:", err);
            });
        };
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);

    return null;
}
