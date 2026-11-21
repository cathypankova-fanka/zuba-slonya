import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Общий каркас кулинарных миссий в стиле «крупный план на весь экран»:
 * - каждый шаг занимает весь экран (столешница + крупный объект по центру);
 * - ингредиенты лежат на больших тарелках внизу (нажать или перетащить);
 * - анимированная рука показывает жест (нажать / перетащить / покрутить / разрезать / намазать),
 *   цель подсвечивается — визуальная подсказка наравне со звуковой.
 */

// ---------------------------------------------------------------- экран шага

export const CookScreen: React.FC<{
  stepKey: string;
  stepIdx: number;
  total: number;
  recipe?: React.ReactNode;
  tray?: React.ReactNode;
  done?: boolean;
  /** лента-карусель на всю ширину (без боковых отступов) */
  trayLoop?: boolean;
  /** свой фон вместо кухонной столешницы (CSS background) */
  bg?: string;
  children: React.ReactNode;
}> = ({ stepKey, stepIdx, total, recipe, tray, done, trayLoop, bg, children }) => {
  useEffect(() => {
    document.body.dataset.cook = '1';
    return () => { delete document.body.dataset.cook; };
  }, []);
  return (
  <div className="fixed inset-0 z-[25] overflow-hidden select-none bg-[#F6D9B8]" style={bg ? { background: bg } : undefined}>
    {/* столешница */}
    {!bg && <img src="/assets/cook/counter_land.webp" alt="" draggable={false}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none portrait:hidden" />}
    {!bg && <img src="/assets/cook/counter_port.webp" alt="" draggable={false}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none landscape:hidden" />}

    <div className="relative z-10 w-full h-full flex flex-col items-center">
      {/* прогресс: крупные кружки-шаги без текста */}
      <div className="pt-[max(10px,env(safe-area-inset-top))] flex items-center gap-2 shrink-0">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i}
            className={`rounded-full border-[3px] border-white shadow transition-all duration-300 ${
              i < stepIdx ? 'w-4 h-4 sm:w-5 sm:h-5 bg-[#10C97A]' : i === stepIdx ? 'w-6 h-6 sm:w-7 sm:h-7 bg-[#FFB800] animate-pulse' : 'w-4 h-4 sm:w-5 sm:h-5 bg-white/70'}`} />
        ))}
      </div>

      {/* рецепт-образец в углу */}
      {recipe && (
        <div className="cook-recipe absolute right-3 top-3 sm:right-5 sm:top-5 rounded-full bg-white/95 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden"
          style={{ width: 'min(18vmin, 132px)', height: 'min(18vmin, 132px)' }}>
          {recipe}
        </div>
      )}

      {/* крупный объект шага */}
      <div key={stepKey} className="flex-1 min-h-0 w-full flex items-center justify-center animate-step-in">
        {children}
      </div>

      {/* тарелки с ингредиентами */}
      {tray && (
        <div key={`tray-${stepKey}`} className={`cook-tray shrink-0 w-full pb-[max(12px,env(safe-area-inset-bottom))] animate-tray-in ${trayLoop ? '' : 'flex flex-wrap items-end justify-center gap-[1.8vmin] px-[clamp(96px,15vw,160px)]'}`}>
          {tray}
        </div>
      )}
    </div>

    {done && (
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <div className="text-[22vmin] animate-done-pop drop-shadow-xl">⭐</div>
      </div>
    )}
  </div>
  );
};

// ---------------------------------------------------------------- бесконечная лента

const LoopCtx = React.createContext<{ scrollBy: (dx: number) => void; fling: (v: number) => void; copy: number } | null>(null);

/**
 * Непрерывная зацикленная лента тарелок: листается пальцем вбок (и по тарелкам тоже), по кругу без конца.
 * Тарелку можно вытянуть вверх — это перетаскивание ингредиента.
 */
export const LoopScroller: React.FC<{ children: React.ReactNode[] }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const copyW = useRef(0);
  const inertia = useRef(0);
  const wrap = () => {
    const el = ref.current;
    if (!el || !copyW.current) return;
    if (el.scrollLeft < copyW.current * 0.5) el.scrollLeft += copyW.current;
    else if (el.scrollLeft > copyW.current * 1.5) el.scrollLeft -= copyW.current;
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const first = el.querySelector<HTMLElement>('[data-copy="0"]');
      copyW.current = first ? first.offsetWidth : el.scrollWidth / 3;
      el.scrollLeft = copyW.current;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children.length]);
  const api = React.useMemo(() => ({
    scrollBy: (dx: number) => { const el = ref.current; if (el) { el.scrollLeft += dx; wrap(); } },
    fling: (v: number) => {
      cancelAnimationFrame(inertia.current);
      let vel = v;
      const step = () => {
        const el = ref.current;
        if (!el || Math.abs(vel) < 0.4) return;
        el.scrollLeft += vel; wrap(); vel *= 0.94;
        inertia.current = requestAnimationFrame(step);
      };
      inertia.current = requestAnimationFrame(step);
    },
  }), []);
  return (
    <div ref={ref} onScroll={wrap} className="w-full overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
      <div className="flex w-max items-end">
        {[0, 1, 2].map((c) => (
          <LoopCtx.Provider key={c} value={{ ...api, copy: c }}>
            <div data-copy={c} className="flex items-end gap-[2.2vmin] pr-[2.2vmin] py-3">{children}</div>
          </LoopCtx.Provider>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- тарелка

/** Эффект «положили»: картинка летит дугой с тарелки на место, а там — брызги звёздочек. Без React-состояния. */
const BURST_COLORS = ['#FFD54A', '#FF8FB1', '#7FDBFF', '#9BE15D', '#FFFFFF', '#FFB347'];
export function sparkleBurst(x: number, y: number, n = 12): void {
  if (typeof document === 'undefined') return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 40 + Math.random() * 50, sz = 7 + Math.random() * 9;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;z-index:70;pointer-events:none;border-radius:${i % 3 ? '50%' : '2px'};background:${BURST_COLORS[i % BURST_COLORS.length]};box-shadow:0 0 6px rgba(255,255,255,.9)`;
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${Math.random() * 180}deg)`, opacity: 0 },
    ], { duration: 550 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => el.remove();
  }
}
function flyTo(src: string, from: DOMRect, to: { x: number; y: number }, w: number, onLand: () => void): void {
  const el = document.createElement('img');
  el.src = src;
  el.style.cssText = `position:fixed;left:0;top:0;width:${w}px;z-index:70;pointer-events:none;filter:drop-shadow(0 8px 8px rgba(0,0,0,.3))`;
  document.body.appendChild(el);
  const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
  const mx = (fx + to.x) / 2, my = Math.min(fy, to.y) - 90;
  el.animate([
    { transform: `translate(${fx}px, ${fy}px) translate(-50%,-50%) scale(1)` },
    { transform: `translate(${mx}px, ${my}px) translate(-50%,-50%) scale(1.25) rotate(-12deg)`, offset: 0.5 },
    { transform: `translate(${to.x}px, ${to.y}px) translate(-50%,-50%) scale(.8) rotate(8deg)`, opacity: 0.2 },
  ], { duration: 480, easing: 'ease-in-out' }).onfinish = () => { el.remove(); onLand(); };
}

/**
 * Большая тарелка с ингредиентом внизу экрана. Нажатие → onPick, перетаскивание на target → onDrop(точка).
 */
export const Plate: React.FC<{
  src: string;
  label: string;
  onPick?: () => void;
  target?: React.RefObject<HTMLElement | null>;
  onDrop?: (x: number, y: number) => void;
  selected?: boolean;
  dim?: boolean;
  wrong?: boolean;
  badge?: number;
  size?: string;
  plateRef?: React.Ref<HTMLButtonElement>;
}> = ({ src, label, onPick, target, onDrop, selected, dim, wrong, badge, size = 'clamp(62px, 13.5vmin, 120px)', plateRef }) => {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean; mode?: 'drag' | 'scroll'; lx: number; v: number } | null>(null);
  const loop = React.useContext(LoopCtx);
  const wrongRef = useRef(wrong);
  wrongRef.current = wrong;
  const btnEl = useRef<HTMLButtonElement | null>(null);
  /** после выбора: если ингредиент подошёл (игра не пометила «не то») — полёт к цели и звёздочки */
  const celebrate = (at?: { x: number; y: number }) => {
    const r = target?.current?.getBoundingClientRect();
    if (!r) return;
    window.setTimeout(() => {
      if (wrongRef.current) return;
      const to = at ?? { x: r.left + r.width / 2, y: r.top + r.height * 0.45 };
      if (at) { sparkleBurst(to.x, to.y); return; }
      const b = btnEl.current?.getBoundingClientRect();
      if (!b) { sparkleBurst(to.x, to.y); return; }
      flyTo(src, b, to, b.width * 0.7, () => sparkleBurst(to.x, to.y));
    }, 40);
  };

  const down = (e: React.PointerEvent) => {
    if (dim) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    start.current = { x: e.clientX, y: e.clientY, moved: false, lx: e.clientX, v: 0 };
  };
  const move = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 12) {
      s.moved = true;
      // в ленте: вбок — листаем, вверх — тянем ингредиент
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      s.mode = loop && Math.abs(dx) > Math.abs(dy) * 0.9 ? 'scroll' : 'drag';
    }
    if (!s.moved) return;
    if (s.mode === 'scroll' && loop) {
      const d = e.clientX - s.lx;
      loop.scrollBy(-d);
      s.v = -d;
      s.lx = e.clientX;
      return;
    }
    if (target || onDrop) setDrag({ x: e.clientX, y: e.clientY });
  };
  const up = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    setDrag(null);
    if (!s) return;
    if (!s.moved) { onPick?.(); if (onPick) celebrate(); return; }
    if (s.mode === 'scroll') { loop?.fling(s.v); return; }
    const r = target?.current?.getBoundingClientRect();
    if (r && e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 20 && e.clientY < r.bottom + 20) {
      onDrop?.(e.clientX, e.clientY);
      if (onDrop) celebrate({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <>
      <button ref={(el) => {
          btnEl.current = el;
          if (loop && loop.copy !== 1) return;
          if (typeof plateRef === 'function') plateRef(el); else if (plateRef) (plateRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
        }} type="button" aria-label={label}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; setDrag(null); }}
        data-copy-btn={loop?.copy ?? 1}
        className={`relative shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
          dim ? 'opacity-35 scale-90' : selected ? 'scale-110 -translate-y-2' : 'active:scale-95'} ${wrong ? 'animate-[wiggle_0.4s]' : ''}`}
        style={{
          width: size, height: size, touchAction: 'none',
          background: 'radial-gradient(circle at 50% 45%, #ffffff 0 55%, #F1ECE4 56% 62%, #ffffff 63% 70%, #E7DFD3 71% 100%)',
          boxShadow: selected ? '0 0 0 5px #FFB800, 0 10px 18px rgba(0,0,0,0.25)' : '0 8px 16px rgba(0,0,0,0.22)',
        }}>
        <img src={src} alt="" draggable={false} className="w-[68%] h-[68%] object-contain pointer-events-none drop-shadow"
          style={{ opacity: drag ? 0.35 : 1 }} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-7 h-7 px-1 rounded-full bg-[#FF3B5C] text-white text-base font-bold flex items-center justify-center border-2 border-white">{badge}</span>
        )}
      </button>
      {drag && createPortal(
        <img src={src} alt="" draggable={false} className="fixed z-[60] pointer-events-none drop-shadow-2xl"
          style={{ left: drag.x, top: drag.y, width: `calc(${size} * 0.8)`, transform: 'translate(-50%,-60%) scale(1.15)' }} />,
        document.body,
      )}
    </>
  );
};

// ---------------------------------------------------------------- подсказка-жест

export type HintKind = 'tap' | 'drag' | 'circle' | 'swipe' | 'rub' | 'hold';

/**
 * Показывает, через сколько после начала шага (и после бездействия) включать подсказку.
 * Любое касание экрана прячет её и перезапускает таймер.
 */
export function useStepHint(stepKey: string, firstDelay = 2200, idleDelay = 7000, enabled = true): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!enabled) { setShow(false); return; }
    let t = window.setTimeout(() => setShow(true), firstDelay);
    const onDown = () => {
      setShow(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setShow(true), idleDelay);
    };
    document.addEventListener('pointerdown', onDown, true);
    setShow(false);
    return () => { window.clearTimeout(t); document.removeEventListener('pointerdown', onDown, true); };
  }, [stepKey, firstDelay, idleDelay, enabled]);
  return show;
}

const HAND = (
  <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]">
    <path d="M27 6c3 0 5 2 5 5v18l4-2c3-1 6 1 6 4l1-1c3-1 6 1 6 4l1-1c3-1 6 1 6 5v12c0 8-6 14-14 14H33c-6 0-10-3-13-8L8 37c-2-3 0-6 3-6 2 0 4 1 5 3l6 8V11c0-3 2-5 5-5z" fill="#FFE0BD" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    <path d="M27 6c3 0 5 2 5 5v18" fill="none" stroke="#E8A66B" strokeWidth="1.5" />
  </svg>
);

/**
 * Анимированная рука: двигается по траектории жеста над целью (и от тарелки к цели для drag).
 * Цель обводится пульсирующим кольцом.
 */
export const GestureHint: React.FC<{
  show: boolean;
  kind: HintKind;
  target: React.RefObject<Element | null>;
  from?: React.RefObject<Element | null>;
  itemSrc?: string;
}> = ({ show, kind, target, from, itemSrc }) => {
  const handRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLImageElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    let raf = 0;
    const t0 = performance.now();
    const period = kind === 'tap' ? 1200 : kind === 'hold' ? 2000 : 2200;
    const tick = (now: number) => {
      const tr = target.current?.getBoundingClientRect();
      const hand = handRef.current;
      if (!tr || !hand) { raf = requestAnimationFrame(tick); return; }
      const cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
      const R = Math.min(tr.width, tr.height) / 2;
      const t = ((now - t0) % period) / period;
      let x = cx, y = cy, scale = 1, opacity = 1, showItem = false;
      if (kind === 'tap' || kind === 'hold') {
        const press = kind === 'tap' ? Math.sin(t * Math.PI * 2) : t < 0.2 ? t / 0.2 : t > 0.85 ? (1 - t) / 0.15 : 1;
        scale = kind === 'tap' ? 1 - Math.max(0, press) * 0.18 : 1 - press * 0.15;
        y = cy + 6 - (kind === 'tap' ? Math.max(0, press) * 10 : 0);
      } else if (kind === 'drag' && from?.current) {
        const fr = from.current.getBoundingClientRect();
        const fx = fr.left + fr.width / 2, fy = fr.top + fr.height / 2;
        const k = t < 0.15 ? 0 : t > 0.8 ? 1 : (t - 0.15) / 0.65;
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        x = fx + (cx - fx) * e; y = fy + (cy - fy) * e - Math.sin(e * Math.PI) * 60;
        opacity = t > 0.9 ? (1 - t) / 0.1 : 1;
        showItem = t > 0.12 && t < 0.86;
      } else if (kind === 'circle') {
        const a = t * Math.PI * 2;
        x = cx + Math.cos(a) * R * 0.5; y = cy + Math.sin(a) * R * 0.5;
      } else if (kind === 'swipe') {
        const k = t < 0.7 ? t / 0.7 : 1;
        x = cx - R * 0.8 + k * R * 1.6; y = cy - R * 0.5 + k * R;
        opacity = t > 0.8 ? (1 - t) / 0.2 : 1;
      } else if (kind === 'rub') {
        x = cx + Math.sin(t * Math.PI * 6) * R * 0.45; y = cy - R * 0.35 + t * R * 0.7;
      }
      hand.style.transform = `translate(${x - 14}px, ${y - 6}px) scale(${scale})`;
      hand.style.opacity = String(opacity);
      const item = itemRef.current;
      if (item) {
        item.style.opacity = showItem ? '0.95' : '0';
        item.style.transform = `translate(${x - 34}px, ${y - 60}px)`;
      }
      const ring = ringRef.current;
      if (ring) {
        const pad = 10;
        ring.style.left = `${tr.left - pad}px`; ring.style.top = `${tr.top - pad}px`;
        ring.style.width = `${tr.width + pad * 2}px`; ring.style.height = `${tr.height + pad * 2}px`;
      }
      const trail = trailRef.current;
      if (trail) {
        if (kind === 'circle') {
          const r = R * 0.5;
          Object.assign(trail.style, { display: 'block', left: `${cx - r}px`, top: `${cy - r}px`, width: `${2 * r}px`, height: `${2 * r}px`, borderRadius: '50%', transform: 'none', borderWidth: '6px' });
        } else if (kind === 'swipe') {
          const len = Math.hypot(R * 1.6, R);
          const ang = Math.atan2(R, R * 1.6);
          Object.assign(trail.style, { display: 'block', left: `${cx - len / 2}px`, top: `${cy}px`, width: `${len}px`, height: '0px', borderRadius: '0', transform: `rotate(${ang}rad)`, borderWidth: '4px' });
        } else trail.style.display = 'none';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show, kind, target, from]);

  if (!show) return null;
  return createPortal(
    <div className="fixed inset-0 z-[55] pointer-events-none">
      <div ref={ringRef} className="absolute rounded-full border-[5px] border-[#FFB800] animate-ping-soft" />
      <div ref={trailRef} className="absolute border-dashed border-white/90" style={{ display: 'none' }} />
      {itemSrc && <img ref={itemRef} src={itemSrc} alt="" className="absolute left-0 top-0 w-[68px] h-[68px] object-contain opacity-0 drop-shadow-xl" />}
      <div ref={handRef} className="absolute left-0 top-0 w-20 h-20 sm:w-24 sm:h-24" style={{ opacity: 0 }}>{HAND}</div>
    </div>,
    document.body,
  );
};

// ---------------------------------------------------------------- бутылочка

/** Бутылочка сиропа нужного цвета (рисуем сами — цвет точно как у сиропа). */
const bottleCache: Record<string, string> = {};
export const bottleSrc = (c: string) => (bottleCache[c] ??= 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 160'><path d='M45 3h10l5 23H40z' fill='#fff' stroke='#cfcfcf' stroke-width='2'/>` +
  `<rect x='30' y='24' width='40' height='18' rx='6' fill='#fff' stroke='#cfcfcf' stroke-width='2'/>` +
  `<path d='M20 48q0-8 8-8h44q8 0 8 8v96q0 13-13 13H33q-13 0-13-13z' fill='${c}' stroke='rgba(0,0,0,.18)' stroke-width='2'/>` +
  `<rect x='28' y='54' width='9' height='84' rx='4.5' fill='#fff' opacity='.4'/>` +
  `<circle cx='57' cy='100' r='17' fill='#fff' opacity='.92'/><path d='M57 88c6 8 9 12 9 16a9 9 0 0 1-18 0c0-4 3-8 9-16z' fill='${c}'/></svg>`));

// ---------------------------------------------------------------- «что нужно»

export interface NeedItem { key: string; src: string; done: boolean; now?: boolean }

/**
 * Ряд «что нужно» над сценой: кружочки с картинками; нужное сейчас мигает жёлтым, сделанное — с зелёной галочкой.
 * ordered — между кружочками стрелочки (класть по порядку). Сам ужимается, если кружочков много.
 */
export const NeedRow: React.FC<{ items: NeedItem[]; ordered?: boolean; lead?: string }> = ({ items, ordered, lead }) => {
  const many = items.length + (lead ? 1 : 0) > 4;
  const size = many ? 'min(11vmin, 72px)' : 'min(14vmin, 88px)';
  return (
    <div className={`flex items-center justify-center ${many ? 'gap-[0.8vmin]' : 'gap-[2vmin]'} px-2 shrink-0`} aria-hidden>
      {lead && (
        <>
          <span className="rounded-full bg-white/95 shadow-lg border-4 border-white flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <img src={lead} alt="" className="w-[84%] h-[84%] object-contain" />
          </span>
          <span className="text-white font-black drop-shadow text-[min(6vmin,34px)]">=</span>
        </>
      )}
      {items.map((it, i) => (
        <React.Fragment key={it.key}>
          {ordered && i > 0 && <span className="text-white/90 font-black text-[min(4vmin,24px)] drop-shadow">›</span>}
          <span className={`relative rounded-full bg-white/95 shadow-lg border-4 flex items-center justify-center shrink-0 transition-all ${it.done ? 'border-[#10C97A]' : it.now !== false ? 'border-[#FFB800] animate-pulse' : 'border-white opacity-70'}`}
            style={{ width: size, height: size }}>
            <img src={it.src} alt="" className="w-[76%] h-[76%] object-contain" />
            {it.done && <span className="absolute -right-1 -top-1 w-[42%] h-[42%] rounded-full bg-[#10C97A] text-white font-black flex items-center justify-center text-[min(4.5vmin,22px)]">✓</span>}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
