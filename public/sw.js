const CACHE='w3rk-public-v3';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name==='start-url'||name==='w3rk-cache'||name.startsWith('workbox-')||(name.startsWith('w3rk-public-')&&name!==CACHE))await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const r=event.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==self.location.origin||u.search||r.mode==='navigate'||r.headers.has('authorization'))return;
  const publicAsset=/^\/(?:(?:assets|_next\/static\/(?:chunks|css|media|workers))\/[^/]+\.(?:js|css|wasm|png|svg|woff2)|icon-(?:192|512)\.png|manifest\.json)$/.test(u.pathname);
  if(!publicAsset)return;
  event.respondWith((async()=>{const c=await caches.open(CACHE),hit=await c.match(r);if(hit)return hit;const response=await fetch(r);if(response.ok&&!/private|no-store/i.test(response.headers.get('cache-control')||''))await c.put(r,response.clone());return response;})());
});
