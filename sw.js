const SHARE_CACHE = "shared-images-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (
    event.request.method === "POST" &&
    url.searchParams.has("share-target")
  ) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  if (url.pathname.startsWith("/shared-image/") || url.pathname.startsWith("/shared-image-meta/")) {
    event.respondWith(caches.open(SHARE_CACHE).then(cache => cache.match(event.request)));
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const files = formData.getAll("image").filter(file => file && file.type && file.type.startsWith("image/"));

  const cache = await caches.open(SHARE_CACHE);
  const ids = [];

  for (const file of files) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    ids.push(id);

    await cache.put(`/shared-image/${id}`, new Response(file));
    await cache.put(
      `/shared-image-meta/${id}`,
      new Response(JSON.stringify({
        name: file.name || `shared-${id}.jpg`,
        type: file.type || "image/jpeg",
        lastModified: file.lastModified || Date.now()
      }), {
        headers: { "Content-Type": "application/json" }
      })
    );
  }

  return Response.redirect(`./?shared=${ids.join(",")}`, 303);
}