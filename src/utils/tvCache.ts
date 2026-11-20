import tvVideos from '../data/tvVideos.json';

/**
 * Загружает мультики «Телевизора» в офлайн-кэш (service worker, кэш tv-videos).
 * Запускается в фоне после старта, по одному файлу, когда есть сеть;
 * пропускается, если включена экономия трафика.
 */
export function warmTvCache(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;

  const run = async () => {
    try {
      await navigator.serviceWorker.ready;
      for (const v of tvVideos as Array<{ src: string }>) {
        if (!navigator.onLine) return;
        const cache = await caches.open('tv-videos');
        if (await cache.match(v.src)) continue;
        // запрос идёт через service worker → он сам положит файл в кэш
        const res = await fetch(v.src);
        await res.arrayBuffer();
      }
    } catch {
      /* без кэша мультики просто грузятся из сети */
    }
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  window.setTimeout(() => (ric ? ric(() => void run()) : void run()), 8000);
}
