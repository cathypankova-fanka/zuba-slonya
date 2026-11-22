import { getActiveHelper } from './activeHelper';

let current: HTMLAudioElement | null = null;
let globalOn = true;
/** Общий флаг озвучки (из настроек звука) — для мест, где нет props. */
export const setVoiceEnabled = (v: boolean) => { globalOn = v; };
export const isVoiceEnabled = () => globalOn;

export const voiceUrl = (id: string, helper = getActiveHelper()) => `/assets/voices/${helper}/${id}.mp3`;

let playing = false;
let pending: { id: string; onMissing?: () => void } | null = null;
let idleCbs: Array<() => void> = [];
let safety: number | undefined;

const finish = () => {
  playing = false;
  current = null;
  window.clearTimeout(safety);
  if (pending) {
    const p = pending;
    pending = null;
    start(p.id, p.onMissing);
  } else {
    const cbs = idleCbs;
    idleCbs = [];
    cbs.forEach((f) => f());
  }
};

/**
 * Фразы играем из Blob: файл берётся обычным fetch (его отдаёт офлайн-кэш service worker целиком),
 * а не <audio src=url> — Safari просит аудио кусками (Range), и такие ответы не попадали в кэш.
 */
const blobUrls = new Map<string, string>();
const loading = new Map<string, Promise<string>>();
function loadVoice(url: string): Promise<string> {
  const ready = blobUrls.get(url);
  if (ready) return Promise.resolve(ready);
  let p = loading.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then((b) => { const u = URL.createObjectURL(b); blobUrls.set(url, u); return u; })
      .finally(() => loading.delete(url));
    loading.set(url, p);
  }
  return p;
}

let token = 0;
function start(id: string, onMissing?: () => void): void {
  const my = ++token;
  playing = true;
  window.clearTimeout(safety);
  safety = window.setTimeout(() => { if (my === token && playing) finish(); }, 12000);
  const url = voiceUrl(id);
  loadVoice(url)
    .then((src) => { if (my === token && playing) startAudio(src, onMissing); })
    .catch(() => { if (my !== token || !playing) return; if (navigator.onLine) startAudio(url, onMissing); else { onMissing?.(); finish(); } });
}

function startAudio(src: string, onMissing?: () => void): void {
  try {
    const a = new Audio(src);
    a.volume = 1;
    current = a;
    playing = true;
    a.onended = finish;
    a.onerror = () => { onMissing?.(); finish(); };
    window.clearTimeout(safety);
    safety = window.setTimeout(() => { if (current === a) finish(); }, 9000);
    void a.play().catch(() => { onMissing?.(); if (current === a) finish(); });
  } catch {
    onMissing?.();
    finish();
  }
}

/**
 * Говорит фразу голосом текущего помощника (русская озвучка из /assets/voices).
 * По умолчанию фраза встаёт в очередь и ДОГОВАРИВАЕТ предыдущую (в очереди держится только последняя);
 * mode 'replace' — сразу перебить (для названий предметов при быстрых нажатиях).
 */
export function playVoice(id: string, enabled: boolean, onMissing?: () => void, mode: 'queue' | 'replace' = 'queue'): boolean {
  if (!enabled || typeof window === 'undefined') return false;
  if (playing && mode === 'queue') {
    pending = { id, onMissing };
    return true;
  }
  if (playing) { pending = null; current?.pause(); current = null; playing = false; }
  start(id, onMissing);
  return true;
}

/** Вызывает cb, когда помощник договорит (и очередь пуста). Если молчит — сразу. */
export function whenVoiceIdle(cb: () => void): void {
  if (!playing && !pending) cb();
  else idleCbs.push(cb);
}

/** Помощник сейчас говорит (нужно, чтобы микрофон не принял его голос за «дуновение»). */
export const isVoicePlaying = () => playing;

export function stopVoice(): void {
  token++;
  current?.pause();
  current = null;
  playing = false;
  pending = null;
  const cbs = idleCbs; idleCbs = []; cbs.forEach((f) => f());
}

/** Случайная фраза из набора `<prefix>_1..<count>` (без повтора подряд). */
const lastPick: Record<string, number> = {};
export function sayRandom(prefix: string, count: number, enabled: boolean): void {
  let n = 1 + Math.floor(Math.random() * count);
  if (count > 1 && n === lastPick[prefix]) n = (n % count) + 1;
  lastPick[prefix] = n;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('helper-say', { detail: prefix }));
  playVoice(`${prefix}_${n}`, enabled);
}
