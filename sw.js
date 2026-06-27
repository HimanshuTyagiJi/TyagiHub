const CACHE_NAME = "tyagihub-v2"; // 🟢 Version badha diya taaki naya code force update ho

const PRECACHE_URLS = [
  "/assets/css/search-main.css",
  "/offline.html"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        PRECACHE_URLS.map(url =>
          fetch(url)
            .then(res => {
              if (res && res.ok) {
                return cache.put(url, res.clone());
              }
            })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // HTML, CSS, JS parsing (Network First)
  if (
    url.origin === self.location.origin &&
    (
      url.pathname === "/" ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".json")
    )
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && (response.type === "basic" || response.type === "cors")) {
            const cloneForCache = response.clone(); // 🟢 Safe Clone Before Use
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, cloneForCache);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(res => res || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Images and Fonts Caching (Cache First)
  if (
    event.request.destination === "image" ||
    event.request.destination === "font" ||
    url.hostname.includes("googleusercontent.com")
  ) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached ||
        fetch(event.request).then(response => {
          if (response && (response.status === 200 || response.status === 0)) {
            const responseToCache = response.clone(); // 🟢 Fixed Clone Execution
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => caches.match("/assets/images/icon-192.png"))
      )
    );
  }
});
