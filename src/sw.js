import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Handle Web Share Target Level 2 (POST request with files or text)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if this is the share-target action
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const mediaFile = formData.get('media');
          const text = formData.get('text') || '';
          const title = formData.get('title') || '';
          const sharedUrl = formData.get('url') || '';

          if (mediaFile && mediaFile.size > 0) {
            // Save the shared media file into the cache storage
            const cache = await caches.open('voce-shared-cache');
            await cache.put(
              'shared-media',
              new Response(mediaFile, {
                headers: {
                  'Content-Type': mediaFile.type || 'image/png',
                  'X-Media-Name': encodeURIComponent(mediaFile.name || 'screenshot.png'),
                },
              })
            );
            // Redirect to the app with a query param signaling a shared image
            return Response.redirect('/Voce/?sharedImage=1', 303);
          }

          // If no media file, but text or URL was shared
          const combinedText = [title, text, sharedUrl].filter(Boolean).join(' ');
          if (combinedText) {
            return Response.redirect(`/Voce/?text=${encodeURIComponent(combinedText)}`, 303);
          }

          // Fallback redirect to app root
          return Response.redirect('/Voce/', 303);
        } catch (error) {
          console.error('Error handling share_target in SW:', error);
          return Response.redirect('/Voce/', 303);
        }
      })()
    );
  }
});
