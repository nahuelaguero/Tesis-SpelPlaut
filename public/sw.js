const APP_VERSION = "spelplaut-pwa-2026-04-28-1";
const STATIC_CACHE = `${APP_VERSION}-static`;
const RUNTIME_CACHE = `${APP_VERSION}-runtime`;

const PUBLIC_SHELL = [
  "/",
  "/canchas",
  "/login",
  "/register",
  "/offline.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icons/icon-144x144.png",
  "/icons/search-96x96.png",
  "/icons/calendar-96x96.png",
  "/icons/profile-96x96.png",
];

const CACHEABLE_PUBLIC_PAGES = new Set(["/", "/canchas", "/login", "/register"]);
const CACHEABLE_PUBLIC_APIS = new Set(["/api/canchas"]);
const OPTIONAL_RUNTIME_ASSETS = ["/api/canchas"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PUBLIC_SHELL))
      .then(() => warmRuntimeCache())
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => !cacheName.startsWith(APP_VERSION))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url));
    return;
  }

  if (url.pathname === "/api/images") {
    event.respondWith(cacheFirst(request, "/icon-512x512.png"));
    return;
  }

  if (url.pathname === "/api/auth/me") {
    event.respondWith(authStatus(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, "/icon-512x512.png"));
    return;
  }

  if (CACHEABLE_PUBLIC_APIS.has(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});

async function handleNavigation(request, url) {
  if (CACHEABLE_PUBLIC_PAGES.has(url.pathname)) {
    return networkFirst(request, "/offline.html");
  }

  try {
    return await fetch(request);
  } catch {
    const cachedOffline = await caches.match("/offline.html");
    return cachedOffline || Response.error();
  }
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }

    return Response.error();
  }
}

async function warmRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE);

  await Promise.all(
    OPTIONAL_RUNTIME_ASSETS.map(async (assetUrl) => {
      try {
        const response = await fetch(assetUrl);
        if (response.ok) {
          await cache.put(assetUrl, response.clone());
        }
      } catch {
        // Optional API warmup must not block service worker installation.
      }
    })
  );
}

async function cacheFirst(request, fallbackUrl) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }

    return Response.error();
  }
}

async function authStatus(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Sin sesión activa offline.",
        data: null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/icon-192x192.png" ||
    url.pathname === "/icon-512x512.png" ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}
