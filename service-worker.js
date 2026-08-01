/**
 * AyuVerse — Service Worker
 *
 * Purpose: makes the site installable as a PWA and gives it basic
 * offline support. Does NOT change what any page serves to a normal
 * online visit — HTML pages always go to the network first, so
 * content stays fresh (no impact on SEO / how the site is indexed).
 * The cache is only a fallback for repeat visits and offline use.
 */

const CACHE_NAME = "ayuverse-cache-v1";

// Core files precached on install so the app shell works offline.
// Paths are relative to this file's own location, so this works
// correctly whether the site is served from the domain root or a
// project sub-path (e.g. /AyuVerse-jee-preparation-/).
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./physics.html",
  "./maths.html",
  "./chemistry.html",
  "./physics-notes.html",
  "./physics-quiz.html",
  "./physics-doubt.html",
  "./jee-advanced-pyq-archive.html",
  "./basic-maths-and-vectors.html",
  "./terms.html",
  "./404.html",
  "./css/style.css",
  "./js/script.js",
  "./js/physics-doubt.js",
  "./js/physics-quiz.js",
  "./site.webmanifest",
  "./assets/images/icon-mark.webp",
  "./assets/images/logo-full.webp",
  "./assets/images/physics.webp",
  "./assets/images/maths.webp",
  "./assets/images/chemistry.webp",
  "./assets/images/favicon-32x32.png",
  "./assets/images/favicon-16x16.png",
  "./assets/images/apple-touch-icon.png",
  "./assets/images/android-chrome-192x192.png",
  "./assets/images/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              /* ignore individual missing files instead of failing install */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const isNavigation =
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    // Network-first for pages: always serve the live, current page
    // when online (keeps content identical to what search engines
    // see); fall back to cache only when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          () =>
            caches.match(request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Cache-first for static assets (css/js/images) with a background
  // network update, for speed and offline availability.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
