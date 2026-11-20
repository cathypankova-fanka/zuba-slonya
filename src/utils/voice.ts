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

function start(id: string, onMissing?: () => void): void {
  try {
    const a = new Audio(voiceUrl(id));
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
  if (playing) { pending = null; current?.pause(); playing = false; }
  start(id, onMissing);
  return true;
}

/** Вызывает cb, когда помощник договорит (и очередь пуста). Если молчит — сразу. */
export function whenVoiceIdle(cb: () => void): void {
  if (!playing && !pending) cb();
  else idleCbs.push(cb);
}

export function stopVoice(): void {
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
