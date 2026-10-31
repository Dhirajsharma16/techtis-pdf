/**
 * TECHTIS (techtis.in) - Progressive Web App Service Worker
 * Enables 100% Offline Client-Side Execution for all 60 PDF, Image & Dev Tools
 * Cache Version: v2.4.2
 */

const CACHE_NAME = 'techtis-cache-v2.4.2';

// Essential Core App Shell & WebAssembly/Worker Libraries
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/site.webmanifest',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/favicon-48x48.png',
    '/favicon-96x96.png',
    '/favicon-192x192.png',
    '/favicon-512x512.png',
    '/apple-touch-icon.png',
    '/assets/images/logo.png',
    '/css/tailwind.min.css?v=2.4.0',
    '/css/styles.css?v=2.4.0',
    '/js/app.js?v=2.4.2',
    '/js/tools/registry.js',
    '/js/utils/storage.js',
    '/js/utils/pdf-helpers.js',
    '/js/tools/merge.js',
    '/js/tools/split.js',
    '/js/tools/rotate.js',
    '/js/edge/ai-bridge.js',
    '/js/tools/all-tools-engine.js',
    '/js/tools/image-workspaces.js',
    '/js/tools/image-engine.js',
    '/js/tools/passport-studio.js?v=2.4.1',
    '/js/tools/passport-studio.js',
    '/js/tools/utility-workspaces.js',
    '/vendor/lucide.min.js',
    '/vendor/pdf-lib.min.js',
    '/vendor/pdf.min.js',
    '/vendor/pdf.worker.min.js',
    '/vendor/jszip.min.js',
    '/vendor/tesseract.min.js'
];

// Install Event: Precache Core Assets with Fault-Tolerant Fallback
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Attempt to cache all core assets resiliently
            for (const url of PRECACHE_URLS) {
                try {
                    const response = await fetch(url, { cache: 'reload' });
                    if (response && response.ok) {
                        await cache.put(url, response);
                    }
                } catch (err) {
                    console.warn('[Service Worker] Non-fatal precache skip for:', url, err);
                }
            }
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Purge Previous Caches & Claim Clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('techtis-cache-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[Service Worker] Deleting obsolete cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network-First for HTML Navigation, Cache-First for Static Assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Only intercept same-origin GET requests
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // Bypass ad scripts, analytics, and browser extensions
    if (url.pathname.startsWith('/cdn-cgi/') || url.pathname.includes('pagead') || url.pathname.includes('google-analytics')) {
        return;
    }

    // 1. Navigation Requests (HTML pages: /merge-pdf/, /index.html, etc.)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    // When offline, attempt to serve the exact cached page or fallback to cached app shell
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;
                    
                    const indexFallback = await caches.match('/index.html') || await caches.match('/');
                    if (indexFallback) return indexFallback;

                    return new Response(
                        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline - TECHTIS</title><style>body{font-family:sans-serif;text-align:center;padding:50px;color:#002244;}</style></head><body><h1>Offline Mode</h1><p>TECHTIS operates 100% in your browser. Return to the <a href="/">Homepage</a> to use cached tools.</p></body></html>`,
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    );
                })
        );
        return;
    }

    // 2. JavaScript & CSS Scripts -> Network-First so code updates take effect immediately
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.includes('/js/')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // 3. Other Static Assets (Vendor WebAssembly, Images, Fonts) -> Cache-First with Dynamic Cache Fill
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                return new Response('', { status: 408, statusText: 'Request Timed Out Offline' });
            });
        })
    );
});
