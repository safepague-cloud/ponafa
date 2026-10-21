// Static-site Service Worker.
const ORIGIN_HOSTS = ["estacaocerto.com","www.estacaocerto.com"];

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function(event) {
  var req = event.request;
  try {
    var mu = new URL(req.url);
    // Prefer captured copies of media assets over the original remote host.
    if (req.method === 'GET' && mu.host === 'media.inlead.cloud') {
      var mediaUrl = self.location.origin + '/_external/' + mu.host + mu.pathname + mu.search;
      event.respondWith(
        fetch(mediaUrl, { cache: 'no-cache' })
          .then(function(r) { return (r && r.ok) ? r : fetch(req); })
          .catch(function() { return fetch(req); })
      );
      return;
    }
    if (req.method === 'GET' && mu.origin === self.location.origin && mu.pathname.indexOf('/_next/static/') === 0) {
      var chunkUrl = self.location.origin + '/_external/inlead.digital' + mu.pathname + mu.search;
      event.respondWith(
        fetch(req, { cache: 'no-cache' })
          .then(function(r) {
            return (r && r.ok) ? r : fetch(chunkUrl, { cache: 'no-cache' }).then(function(local) {
              return (local && local.ok) ? local : r;
            });
          })
          .catch(function() { return fetch(chunkUrl); })
      );
      return;
    }
    // Re-home captured assets when the runtime requests them from the original host.
    if (req.method === 'GET' && ORIGIN_HOSTS.indexOf(mu.host) !== -1 && mu.origin !== self.location.origin) {
      var localUrl = self.location.origin + mu.pathname + mu.search;
      event.respondWith(
        fetch(localUrl, { cache: 'no-cache' })
          .then(function(r) { return (r && r.ok) ? r : fetch(req); })
          .catch(function() { return fetch(req); })
      );
      return;
    }
    // Keep same-origin form submissions from failing on a static host.
    var isMutation = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
    if (isMutation && mu.origin === self.location.origin) {
      event.respondWith(new Response('{"ok":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  } catch (e) {}
});
