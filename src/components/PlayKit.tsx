import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { emotionUrl, hasEmotion } from '../data/emotionAssets';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { ReactionHero } from './ReactionHero';

/** Общие кирпичики новых мини-игр (милкшейк, блинчики, доктор, садик…). */

export const P = (n: string) => `/assets/items/play/${n}.webp`;
export const say = (id: string, on: boolean) => playVoice(id, on);

/** Шаги миссии: звезда «готово», фраза договаривается, потом следующий шаг. Фраза шага звучит при входе. */
export function useSteps<S extends string>(steps: readonly S[], soundEnabled: boolean, voices: Partial<Record<S, string>>) {
  const [idx, setIdx] = useState(0);
  const step = steps[Math.min(idx, steps.length - 1)];
  const [doneFx, setDoneFx] = useState(false);
  const busy = useRef(false);
  const next = useCallback((v?: string) => {
    if (busy.current) return;
    busy.current = true;
    soundEngine.playGameOk(soundEnabled);
    setDoneFx(true);
    if (v) window.setTimeout(() => playVoice(v, soundEnabled), 150);
    window.setTimeout(() => whenVoiceIdle(() => {
      setDoneFx(false);
      busy.current = false;
      setIdx((i) => Math.min(i + 1, steps.length - 1));
    }), 900);
  }, [soundEnabled, steps.length]);
  useEffect(() => {
    const v = voices[step];
    if (v) playVoice(v, soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, idx]);
  const restart = useCallback(() => { busy.current = false; setDoneFx(false); setIdx(0); }, []);
  return { idx, step, doneFx, next, restart, setIdx };
}

/** Держать палец: пока держим — каждый кадр вызывается onTick(dt, секунды). */
export function useHold(active: boolean, onTick: (dt: number) => void) {
  const [holding, setHolding] = useState(false);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  useEffect(() => {
    if (!holding || !active) return;
    let raf = 0;
    let last = performance.now();
    const f = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tickRef.current(dt);
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    const up = () => setHolding(false);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [holding, active]);
  useEffect(() => { if (!active) setHolding(false); }, [active]);
  const bind = {
    onPointerDown: (e: React.PointerEvent) => { if (!active) return; e.preventDefault(); setHolding(true); },
    style: { touchAction: 'none' as const },
  };
  return { holding: holding && active, bind, stop: () => setHolding(false) };
}

/** «Потереть»: копит пройденный пальцем путь (в долях ширины элемента). onRub(доля, точка 0..1). */
export function useRub(active: boolean, onRub: (amount: number, p: { x: number; y: number }) => void) {
  const last = useRef<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pt = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const bind = {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      if (!active) return;
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
      last.current = pt(e);
      onRub(0, last.current);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!active || !last.current) return;
      const p = pt(e);
      const d = Math.hypot(p.x - last.current.x, p.y - last.current.y);
      if (d > 0.01) { onRub(d, p); last.current = p; }
    },
    onPointerUp: () => { last.current = null; },
    onPointerCancel: () => { last.current = null; },
    style: { touchAction: 'none' as const },
  };
  return bind;
}

/**
 * «Проявить картинку пальчиком»: холст поверх коробки boxRef; reveal(p) рисует кусочек картинки под пальцем (p — 0..1 в коробке).
 * Возвращает долю закрашенной картинки (по непрозрачным местам). active — пока шаг идёт.
 */
export function useReveal(src: string, active: boolean, opts: { radius?: number; fallback?: string } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const grid = useRef<{ cells: [number, number][]; hit: Set<number> }>({ cells: [], hit: new Set() });
  const [pct, setPct] = useState(0);
  const R = opts.radius ?? 0.13;
  useEffect(() => {
    if (!active) return;
    grid.current = { cells: [], hit: new Set() };
    setPct(0);
    const im = new Image();
    im.onerror = () => { if (opts.fallback && !im.dataset.fb) { im.dataset.fb = '1'; im.src = opts.fallback; } };
    im.onload = () => {
      img.current = im;
      const c = canvasRef.current, box = boxRef.current; if (!c || !box) return;
      const r = box.getBoundingClientRect();
      c.width = Math.max(10, Math.round(r.width * 2)); c.height = Math.max(10, Math.round(r.height * 2));
      c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
      const off = document.createElement('canvas'); off.width = 48; off.height = Math.max(4, Math.round(48 * c.height / c.width));
      const o = off.getContext('2d')!; o.drawImage(im, 0, 0, off.width, off.height);
      const d = o.getImageData(0, 0, off.width, off.height).data;
      const cells: [number, number][] = [];
      for (let y = 1; y < off.height; y += 2) for (let x = 1; x < off.width; x += 2) if (d[(y * off.width + x) * 4 + 3] > 60) cells.push([x / off.width, y / off.height]);
      grid.current.cells = cells;
    };
    im.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, active]);
  /** tint — перекрасить узор под пальцем в этот цвет (форма и тени узора сохраняются). */
  const reveal = (p: { x: number; y: number }, tint?: string) => {
    const c = canvasRef.current, im = img.current; if (!c || !im) return 0;
    const ctx = c.getContext('2d')!;
    ctx.save(); ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, R * c.width, 0, Math.PI * 2); ctx.clip();
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(im, 0, 0, c.width, c.height);
    if (tint) { ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.62; ctx.fillStyle = tint; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.restore();
    const g = grid.current, asp = c.height / c.width;
    g.cells.forEach(([cx, cy], i) => { if (!g.hit.has(i) && Math.hypot(cx - p.x, (cy - p.y) * asp) < R) g.hit.add(i); });
    const v = g.cells.length ? g.hit.size / g.cells.length : 0;
    setPct(v);
    return v;
  };
  const fill = () => { const c = canvasRef.current, im = img.current; if (c && im) c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); setPct(1); };
  /** точка события в долях коробки */
  const at = (e: { clientX: number; clientY: number }) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  return { canvasRef, boxRef, reveal, fill, at, pct };
}

/** Лицо героя с эмоцией (sad, joy, sleepy…), круглое. */
export const HeroFace: React.FC<{ hero: CharacterItem; emotion?: string; size: string; className?: string; children?: React.ReactNode }> = ({ hero, emotion, size, className = '', children }) => (
  <div className={`relative rounded-full overflow-hidden border-[6px] border-white shadow-2xl ${className}`} style={{ width: size, height: size, background: hero.accentBg }}>
    <img src={emotion && hasEmotion(hero.id, emotion) ? emotionUrl(hero.id, emotion) : hero.imageSrc} alt="" draggable={false}
      className="w-full h-full object-cover object-top pointer-events-none" />
    {children}
  </div>
);

/** Финал не-едовой игры: герой радуется (анимация реакции), звёзды и «ещё раз». */
export const Celebrate: React.FC<{ hero: CharacterItem; runKey: number; soundEnabled: boolean; onRestart: () => void; children?: React.ReactNode }> = ({ hero, runKey, soundEnabled, onRestart, children }) => {
  const reaction = useMemo(() => pickReaction('cake', hero.id), [runKey, hero.id]);
  useEffect(() => {
    soundEngine.playGameReward(soundEnabled);
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 2600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);
  return (
    <div className="flex flex-col items-center gap-[2vmin]">
      <div className="relative rounded-full overflow-hidden border-[6px] border-white shadow-2xl" style={{ width: 'min(40vmin, 340px)', height: 'min(40vmin, 340px)', background: hero.accentBg }}>
        <ReactionHero character={hero} reaction={reaction} runKey={`c-${runKey}`} />
      </div>
      {children}
      <div className="text-[7vmin] animate-bounce">⭐⭐⭐</div>
      <button type="button" aria-label="Ещё раз" onClick={onRestart}
        className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
        style={{ width: 'min(15vmin, 120px)', height: 'min(15vmin, 120px)', fontSize: 'min(8vmin, 64px)' }}>🔄</button>
    </div>
  );
};

/** Случайный герой (кроме текущего). */
export const randomHero = (all: CharacterItem[], exceptId?: string) => {
  const pool = all.filter((c) => c.id !== exceptId);
  return pool[Math.floor(Math.random() * pool.length)];
};

export const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Плита-варочная панель (вид чуть сверху): посуда стоит на конфорке. burnerX — где центр конфорки (%), под дном посуды. */
export const Stove: React.FC<{ width: string; on?: boolean; burnerX?: number; children?: React.ReactNode; knob?: React.ReactNode }> = ({ width, on = true, burnerX = 50, children, knob }) => (
  <div className="relative flex flex-col items-center" style={{ width }}>
    {/* столешница плиты */}
    <div className="absolute left-0 right-0 bottom-0 rounded-[2.2rem]" style={{ height: `calc(${width} * 0.36)`, background: 'linear-gradient(#52525B, #27272A 70%, #18181B)', boxShadow: '0 16px 26px rgba(0,0,0,.35), inset 0 4px 0 #A1A1AA' }}>
      <div className="absolute -translate-x-1/2 rounded-[50%] border-[6px]" style={{
        left: `${burnerX}%`, top: '14%', width: '58%', height: '52%',
        borderColor: on ? '#F97316' : '#71717A',
        boxShadow: on ? '0 0 26px 8px rgba(249,115,22,.6), inset 0 0 18px rgba(249,115,22,.6)' : 'inset 0 0 0 10px #3F3F46', transition: 'all .5s' }} />
    </div>
    <div className="relative z-10 w-full flex justify-center" style={{ paddingBottom: `calc(${width} * 0.12)` }}>{children}</div>
    {/* ручка поверх посуды, чтобы её можно было нажать */}
    {knob && <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none [&>*]:pointer-events-auto" style={{ height: `calc(${width} * 0.36)` }}>{knob}</div>}
  </div>
);
