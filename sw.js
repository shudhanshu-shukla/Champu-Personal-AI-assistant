
const CACHE_NAME = "champu-shell-v2";
const BASE_URL = new URL("./", self.location.href);

const SHELL = [
  BASE_URL.href,
  new URL("index.html", BASE_URL).href,
  new URL("styles.css", BASE_URL).href,
  new URL("app.js", BASE_URL).href,
  new URL("manifest.webmanifest", BASE_URL).href,
  new URL("icon.svg", BASE_URL).href
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("champu-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).catch(() => {
        if (request.mode === "navigate") {
          return caches.match(new URL("index.html", BASE_URL).href);
        }
        return Response.error();
      });
    })
  );
});

