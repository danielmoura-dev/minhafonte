const CACHE_NAME = 'fontepro-v2';

// Apenas assets verdadeiramente estáticos — nunca rotas dinâmicas
const PRECACHE_ASSETS = [
    '/images/logo.png',
    '/images/logo2.png',
    '/sounds/cash.mp3',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            // ignora falhas individuais (arquivo pode não existir)
            Promise.allSettled(PRECACHE_ASSETS.map(url => cache.add(url)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Só processa GET
    if (request.method !== 'GET') return;

    // Não intercepta requisições cross-origin
    if (url.origin !== self.location.origin) return;

    // Não intercepta navegações (páginas HTML) — deixa ir pro servidor
    if (request.mode === 'navigate') return;

    // Não intercepta requisições Inertia (têm header X-Inertia)
    if (request.headers.get('X-Inertia')) return;

    // Para assets estáticos: cache-first
    const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|mp3)(\?.*)?$/.test(url.pathname);
    if (!isStaticAsset) return; // deixa o browser lidar com o resto normalmente

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (response.ok && response.status < 400) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            }).catch(() => cached ?? Response.error());
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
        self.registration.showNotification(data.title ?? 'Fonte Pro', {
            body:  data.body  ?? '',
            icon:  data.icon  ?? '/icons/icon-192.png',
            badge: data.badge ?? '/icons/icon-72.png',
            data:  { url: data.url ?? '/vendedor/fabrica' },
            requireInteraction: false,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url ?? '/vendedor/fabrica';
    const fullUrl = self.location.origin + url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Se já tem uma janela do app aberta, foca e navega
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.focus();
                    return client.navigate(fullUrl);
                }
            }
            // Senão, abre nova janela
            return clients.openWindow(fullUrl);
        })
    );
});
