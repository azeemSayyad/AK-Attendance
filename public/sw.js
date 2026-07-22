// AK Attendance service worker — app-shell caching for installability + offline fallback.
// Bump CACHE_VERSION to force clients onto a fresh cache.
const CACHE_VERSION = "ak-attend-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_URLS = [
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Only handle same-origin GET requests. Everything else (POST server
    // actions, cross-origin) goes straight to the network untouched.
    if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    // Navigations: network-first so data is always fresh, fall back to cache
    // (then a cached shell) when offline.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
                    return res;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match("/")))
        );
        return;
    }

    // Hashed static assets (/_next/static, /icons, images): cache-first.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons") || /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname)) {
        event.respondWith(
            caches.match(request).then((cached) =>
                cached ||
                fetch(request).then((res) => {
                    const copy = res.clone();
                    caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
                    return res;
                })
            )
        );
    }
});
