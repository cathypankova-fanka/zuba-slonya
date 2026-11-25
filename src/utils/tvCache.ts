import { useEffect, useState } from 'react';

/**
 * Мультики не качаются заранее: файл целиком сохраняется в офлайн-кэш только после того,
 * как его начали смотреть. Service worker (vite.config.ts, кэш 'tv-videos') потом отдаёт
 * видео из этого кэша, в том числе кусками для перемотки.
 */
const CACHE = 'tv-videos';
const EVT = 'tv-cache-change';

const abs = (src: string) => new URL(src, location.origin).href;
const hasCaches = () => typeof caches !== 'undefined';

export async function cachedTvSrcs(): Promise<Set<string>> {
  if (!hasCaches()) return new Set();
  try {
    const c = await caches.open(CACHE);
    const keys = await c.keys();
    return new Set(keys.map((r) => new URL(r.url).pathname));
  } catch {
    return new Set();
  }
}

const inFlight = new Set<string>();

/** Скачать мультик целиком в кэш (если ещё не скачан). Ошибки молча пропускаем — попробуем в следующий раз. */
export async function cacheTvVideo(src: string): Promise<void> {
  if (!hasCaches() || !navigator.onLine || inFlight.has(src)) return;
  inFlight.add(src);
  try {
    const c = await caches.open(CACHE);
    if (await c.match(abs(src))) return;
    // ?dl — чтобы запрос прошёл мимо service worker (он кэшировал бы ответ с Vary, с которым <video> офлайн не играет)
    const res = await fetch(`${src}?dl=1`, { cache: 'no-store' });
    if (res.status !== 200) return;
    // Без Vary: видео потом запрашивается с другими заголовками (Range, Accept-Encoding),
    // и с Vary кэш считал бы это другим запросом и не отдавал файл офлайн
    const headers = new Headers(res.headers);
    headers.delete('Vary');
    headers.set('Content-Type', res.headers.get('Content-Type') || 'video/mp4');
    await c.put(abs(src), new Response(await res.blob(), { status: 200, headers }));
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* сеть пропала посреди скачивания — не страшно */
  } finally {
    inFlight.delete(src);
  }
}

let normalized: Promise<void> | null = null;
/** Один раз переписать записи с заголовком Vary (их клал service worker в прошлых версиях) — иначе офлайн не играют. */
function normalizeTvCache(): Promise<void> {
  if (!hasCaches()) return Promise.resolve();
  normalized ??= (async () => {
    try {
      const c = await caches.open(CACHE);
      for (const req of await c.keys()) {
        const r = await c.match(req);
        if (!r || !r.headers.has('Vary')) continue;
        const headers = new Headers(r.headers);
        headers.delete('Vary');
        await c.put(req, new Response(await r.blob(), { status: 200, headers }));
      }
    } catch {
      /* не получилось — не страшно */
    }
  })();
  return normalized;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Какие мультики уже скачаны (пути вида /assets/tv/x.mp4); null — ещё проверяем. */
export function useCachedTv(): Set<string> | null {
  const [set, setSet] = useState<Set<string> | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void normalizeTvCache().then(cachedTvSrcs).then((s) => alive && setSet(s));
    load();
    window.addEventListener(EVT, load);
    window.addEventListener('online', load);
    window.addEventListener('offline', load);
    return () => {
      alive = false;
      window.removeEventListener(EVT, load);
      window.removeEventListener('online', load);
      window.removeEventListener('offline', load);
    };
  }, []);
  return set;
}
