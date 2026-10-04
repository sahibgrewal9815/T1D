// T1DTMD service worker: makes the app open fast and work offline.
const VERSION = "t1dtmd-v8";
const FILES = ["./", "index.html", "manifest.json", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  // cache what we can; one missing file must not stop the app from installing
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Android Chrome refuses "redirected" responses when opening the installed app,
// so copy them into a clean response first.
async function clean(res) {
  if (!res || !res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  // only our own files + the Supabase code file; never touch login/database traffic
  if (u.origin !== location.origin && u.host !== "cdn.jsdelivr.net") return;

  if (req.mode === "navigate") {
    // opening the app: try the internet, else the saved copy of index.html
    e.respondWith((async () => {
      try {
        const res = await clean(await fetch(req));
        if (res.ok) caches.open(VERSION).then(c => c.put("index.html", res.clone())).catch(() => {});
        return res;
      } catch {
        return (await caches.match("index.html")) || (await caches.match("./")) ||
          new Response("<h3 style='font-family:sans-serif;padding:20px'>You're offline. Connect to the internet and open T1DTMD again.</h3>", { headers: { "Content-Type": "text/html" } });
      }
    })());
    return;
  }

  e.respondWith((async () => {
    try {
      const res = await clean(await fetch(req));
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    } catch {
      return (await caches.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
