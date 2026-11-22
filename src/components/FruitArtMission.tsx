import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, NeedRow, Plate, sparkleBurst, useStepHint } from './CookKit';
import { DoneButton } from './ArtKit';
import { P, useSteps } from './PlayKit';

/**
 * Фруктовые картинки: выбрать картинку → помыть фрукты (тереть под водичкой) → почистить (провести вниз по кожуре) →
 * порезать / разделить на дольки (тук-тук) → выложить на тарелке мордочку как на образце (можно и по-своему).
 */

const F = (n: string) => `/assets/items/play/fa_${n}.webp`;
const STEPS = ['pick', 'wash', 'peel', 'cut', 'arrange', 'serve'] as const;
const VOICES = { pick: 'fa_pick', wash: 'fa_wash', peel: 'fa_peel', cut: 'fa_cut', arrange: 'fa_arrange' };

type FruitId = 'orange' | 'banana' | 'kiwi' | 'apple' | 'strawberry' | 'blueberry' | 'grape';
type PieceId = 'orange_seg' | 'banana_round' | 'kiwi_round' | 'apple_wedge' | 'strawberry_half' | 'blueberry' | 'grape';
const FRUITS: Record<FruitId, { whole: string; peeled?: string; peeledFilter?: string; piece: PieceId; per: number; name: string }> = {
  orange: { whole: F('orange'), peeled: F('orange_peeled'), piece: 'orange_seg', per: 8, name: 'Апельсин' },
  banana: { whole: F('banana'), peeled: F('banana_peeled'), piece: 'banana_round', per: 6, name: 'Банан' },
  kiwi: { whole: F('kiwi'), peeled: F('kiwi'), peeledFilter: 'hue-rotate(55deg) saturate(2.2) brightness(1.25)', piece: 'kiwi_round', per: 4, name: 'Киви' },
  apple: { whole: F('apple'), piece: 'apple_wedge', per: 6, name: 'Яблоко' },
  strawberry: { whole: F('strawberry'), piece: 'strawberry_half', per: 2, name: 'Клубника' },
  blueberry: { whole: P('blueberry'), piece: 'blueberry', per: 1, name: 'Черника' },
  grape: { whole: P('grape'), piece: 'grape', per: 1, name: 'Виноград' },
};
const PIECES: Record<PieceId, { src: string; w: number; name: string; fruit: FruitId }> = {
  orange_seg: { src: F('orange_seg'), w: 0.27, name: 'Долька апельсина', fruit: 'orange' },
  banana_round: { src: F('banana_round'), w: 0.17, name: 'Кружочек банана', fruit: 'banana' },
  kiwi_round: { src: F('kiwi_round'), w: 0.25, name: 'Кружочек киви', fruit: 'kiwi' },
  apple_wedge: { src: F('apple_wedge'), w: 0.28, name: 'Долька яблока', fruit: 'apple' },
  strawberry_half: { src: F('strawberry_half'), w: 0.19, name: 'Половинка клубники', fruit: 'strawberry' },
  blueberry: { src: P('blueberry'), w: 0.11, name: 'Черничка', fruit: 'blueberry' },
  grape: { src: P('grape'), w: 0.13, name: 'Виноградинка', fruit: 'grape' },
};

interface Slot { p: PieceId; x: number; y: number; r?: number; s?: number }
interface Pic { id: string; name: string; slots: Slot[] }
const ring = (p: PieceId, n: number, cx: number, cy: number, rad: number, s = 1, outward = true, from = 0, to = Math.PI * 2): Slot[] =>
  Array.from({ length: n }, (_, i) => {
    const a = from + ((to - from) * i) / (to - from >= Math.PI * 2 - 0.01 ? n : Math.max(1, n - 1));
    return { p, x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, r: outward ? (a * 180) / Math.PI + 90 : 0, s };
  });
const PICS: Pic[] = [
  { id: 'cat', name: 'Котик', slots: [
    { p: 'apple_wedge', x: 0.27, y: 0.2, r: -35 }, { p: 'apple_wedge', x: 0.73, y: 0.2, r: 35, s: 1 },
    { p: 'kiwi_round', x: 0.36, y: 0.42 }, { p: 'kiwi_round', x: 0.64, y: 0.42 },
    { p: 'blueberry', x: 0.36, y: 0.42, s: 0.9 }, { p: 'blueberry', x: 0.64, y: 0.42, s: 0.9 },
    { p: 'strawberry_half', x: 0.5, y: 0.56, r: 180, s: 0.75 },
    { p: 'orange_seg', x: 0.5, y: 0.7, r: 90, s: 0.95 },
    { p: 'banana_round', x: 0.26, y: 0.6, s: 0.8 }, { p: 'banana_round', x: 0.74, y: 0.6, s: 0.8 },
  ] },
  { id: 'sun', name: 'Солнышко', slots: [
    ...ring('orange_seg', 8, 0.5, 0.5, 0.33, 0.9),
    { p: 'banana_round', x: 0.5, y: 0.5, s: 1.8 },
    { p: 'blueberry', x: 0.44, y: 0.46 }, { p: 'blueberry', x: 0.56, y: 0.46 },
    { p: 'strawberry_half', x: 0.5, y: 0.57, r: 180, s: 0.6 },
  ] },
  { id: 'flower', name: 'Цветочек', slots: [
    ...ring('strawberry_half', 6, 0.5, 0.36, 0.15, 1),
    { p: 'kiwi_round', x: 0.5, y: 0.36, s: 0.85 },
    { p: 'banana_round', x: 0.5, y: 0.6, s: 0.75 }, { p: 'banana_round', x: 0.5, y: 0.7, s: 0.75 }, { p: 'banana_round', x: 0.5, y: 0.8, s: 0.75 },
    { p: 'apple_wedge', x: 0.38, y: 0.72, r: -60, s: 0.85 }, { p: 'apple_wedge', x: 0.62, y: 0.76, r: 60, s: 0.85 },
  ] },
  { id: 'owl', name: 'Совушка', slots: [
    { p: 'grape', x: 0.3, y: 0.2 }, { p: 'grape', x: 0.7, y: 0.2 },
    { p: 'kiwi_round', x: 0.37, y: 0.38, s: 1.05 }, { p: 'kiwi_round', x: 0.63, y: 0.38, s: 1.05 },
    { p: 'blueberry', x: 0.37, y: 0.38 }, { p: 'blueberry', x: 0.63, y: 0.38 },
    { p: 'orange_seg', x: 0.5, y: 0.52, r: 90, s: 0.6 },
    { p: 'apple_wedge', x: 0.22, y: 0.62, r: 25, s: 1.1 }, { p: 'apple_wedge', x: 0.78, y: 0.62, r: -25, s: 1.1 },
    { p: 'banana_round', x: 0.43, y: 0.67, s: 0.8 }, { p: 'banana_round', x: 0.57, y: 0.67, s: 0.8 }, { p: 'banana_round', x: 0.5, y: 0.78, s: 0.8 },
  ] },
  { id: 'fish', name: 'Рыбка', slots: [
    { p: 'orange_seg', x: 0.3, y: 0.5, r: 0, s: 1.1 }, { p: 'orange_seg', x: 0.42, y: 0.42, r: 0 }, { p: 'orange_seg', x: 0.42, y: 0.58, r: 0 },
    { p: 'orange_seg', x: 0.54, y: 0.42, r: 0 }, { p: 'orange_seg', x: 0.54, y: 0.58, r: 0 }, { p: 'orange_seg', x: 0.64, y: 0.5, r: 0 },
    { p: 'apple_wedge', x: 0.8, y: 0.42, r: 40 }, { p: 'apple_wedge', x: 0.8, y: 0.58, r: 140 },
    { p: 'blueberry', x: 0.27, y: 0.46 },
    { p: 'grape', x: 0.16, y: 0.32, s: 0.7 }, { p: 'grape', x: 0.12, y: 0.2, s: 0.55 },
  ] },
  { id: 'smile', name: 'Смайлик', slots: [
    ...ring('grape', 5, 0.5, 0.32, 0.26, 0.9, false, Math.PI * 1.15, Math.PI * 1.85),
    { p: 'kiwi_round', x: 0.37, y: 0.42 }, { p: 'kiwi_round', x: 0.63, y: 0.42 },
    { p: 'blueberry', x: 0.37, y: 0.42 }, { p: 'blueberry', x: 0.63, y: 0.42 },
    { p: 'strawberry_half', x: 0.5, y: 0.54, r: 180, s: 0.7 },
    ...ring('orange_seg', 3, 0.5, 0.52, 0.18, 0.75, true, Math.PI * 0.3, Math.PI * 0.7),
  ] },
];

/** какие фрукты нужны для картинки (сколько штук) */
const fruitsFor = (pic: Pic) => {
  const cnt: Partial<Record<FruitId, number>> = {};
  pic.slots.forEach((s) => { const f = PIECES[s.p].fruit; cnt[f] = (cnt[f] ?? 0) + 1; });
  return (Object.keys(cnt) as FruitId[]).map((f) => ({ f, pieces: cnt[f]!, n: Math.ceil(cnt[f]! / FRUITS[f].per) }));
};

interface Placed { p: PieceId; x: number; y: number; r: number; s: number; slot?: number }

/** тарелка с кусочками (ghost — бледный образец) */
const FruitPlate: React.FC<{ size: string; placed: Placed[]; ghost?: Slot[]; boxRef?: React.Ref<HTMLDivElement>; onGrab?: (i: number, e: React.PointerEvent) => void; dragging?: number | null }> = ({ size, placed, ghost, boxRef, onGrab, dragging }) => (
  <div ref={boxRef} className="relative shrink-0 rounded-full" style={{ width: size, height: size, background: 'radial-gradient(circle at 50% 45%, #FFFFFF 0 60%, #F1F5F9 66%, #FFFFFF 72%, #E2E8F0 100%)', boxShadow: '0 14px 26px rgba(0,0,0,.22)' }}>
    {ghost?.map((g, i) => (
      <img key={`g${i}`} src={PIECES[g.p].src} alt="" draggable={false} className="absolute pointer-events-none"
        style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, width: `${PIECES[g.p].w * (g.s ?? 1) * 100}%`, transform: `translate(-50%,-50%) rotate(${g.r ?? 0}deg)`, opacity: 0.22, filter: 'grayscale(.4)' }} />
    ))}
    {placed.map((q, i) => (
      <span key={i} className={`absolute ${onGrab ? 'cursor-grab touch-none' : 'pointer-events-none'}`} onPointerDown={onGrab ? (e) => onGrab(i, e) : undefined}
        style={{ left: `${q.x * 100}%`, top: `${q.y * 100}%`, width: `${PIECES[q.p].w * q.s * 100}%`, transform: `translate(-50%,-50%) rotate(${q.r}deg) scale(${dragging === i ? 1.18 : 1})`, transition: dragging === i ? 'none' : 'transform .15s', zIndex: dragging === i ? 10 : q.p === 'blueberry' ? 3 : q.p === 'kiwi_round' || q.p === 'banana_round' ? 2 : 1 }}>
        <img src={PIECES[q.p].src} alt="" draggable={false} className="block w-full animate-pop-in" style={{ filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.25))' }} />
      </span>
    ))}
  </div>
);

const picPlaced = (pic: Pic): Placed[] => pic.slots.map((s) => ({ p: s.p, x: s.x, y: s.y, r: s.r ?? 0, s: s.s ?? 1 }));

export const FruitArtMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [pic, setPic] = useState<Pic>(PICS[0]);
  const need = useMemo(() => fruitsFor(pic), [pic]);
  const [dirt, setDirt] = useState<Record<string, number>>({});
  const [peelIdx, setPeelIdx] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [strips, setStrips] = useState<number[]>([]);
  const [cutIdx, setCutIdx] = useState(0);
  const [chops, setChops] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('cake', character.id), [servedKey, character.id]);
  const basinRef = useRef<HTMLDivElement>(null);
  const fruitRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const swipe = useRef<number | null>(null);
  const bid = useRef(0);

  // фрукты по одному (каждый экземпляр)
  const items = useMemo(() => need.flatMap(({ f, n }) => Array.from({ length: n }, (_, k) => `${f}#${k}`)), [need]);
  const toPeel = useMemo(() => items.filter((it) => FRUITS[it.split('#')[0] as FruitId].peeled), [items]);
  const toCut = useMemo(() => items.filter((it) => { const f = it.split('#')[0] as FruitId; return f !== 'blueberry' && f !== 'grape'; }), [items]);

  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);
  useEffect(() => { if (step === 'wash') setDirt(Object.fromEntries(items.map((it) => [it, 1]))); }, [step, items]);
  // пропускаем шаги, если чистить/резать нечего
  useEffect(() => { if (step === 'peel' && toPeel.length === 0 && !doneFx) next(); }, [step, toPeel.length, doneFx, next]);

  const restart = () => { setDirt({}); setPeelIdx(0); setStrokes(0); setStrips([]); setCutIdx(0); setChops(0); setPlaced([]); restartSteps(); };

  // ---------- мыть ----------
  const washMove = (e: React.PointerEvent) => {
    if (step !== 'wash' || doneFx || e.buttons === 0 && e.pointerType === 'mouse') return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-fruit]') as HTMLElement | null;
    const r = basinRef.current?.getBoundingClientRect();
    if (r && Math.random() < 0.35) {
      const b = { id: bid.current++, x: e.clientX - r.left, y: e.clientY - r.top };
      setBubbles((bs) => [...bs.slice(-14), b]);
    }
    if (!el) return;
    const key = el.dataset.fruit!;
    setDirt((d) => {
      if ((d[key] ?? 0) <= 0) return d;
      const nv = Math.max(0, (d[key] ?? 1) - 0.045);
      if (nv === 0) { const rr = el.getBoundingClientRect(); sparkleBurst(rr.left + rr.width / 2, rr.top + rr.height / 2, 12); soundEngine.playGameOk(soundEnabled); }
      else if (Math.random() < 0.15) soundEngine.playGamePop(soundEnabled, 2);
      const nd = { ...d, [key]: nv };
      if (Object.values(nd).every((v) => v <= 0)) window.setTimeout(() => next(), 600);
      return nd;
    });
  };

  // ---------- чистить: каждое движение вниз снимает одну полоску кожуры (там, где ведёшь пальцем) ----------
  const peelN = (f?: FruitId) => (f === 'kiwi' ? 4 : 5);
  const peelDown = (e: React.PointerEvent) => { swipe.current = e.clientY; };
  const peelMove = (e: React.PointerEvent) => {
    if (step !== 'peel' || doneFx || swipe.current == null) return;
    const f = toPeel[peelIdx]?.split('#')[0] as FruitId | undefined;
    const N = peelN(f);
    if (strips.length >= N) return;
    if (e.clientY - swipe.current > 40) {
      swipe.current = null;
      const r = fruitRef.current?.getBoundingClientRect();
      let k = r ? Math.min(N - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * N))) : 0;
      if (strips.includes(k)) { // эта полоска уже снята — берём ближайшую
        const rest = Array.from({ length: N }, (_, i) => i).filter((i) => !strips.includes(i));
        k = rest.sort((a, b) => Math.abs(a - k) - Math.abs(b - k))[0];
      }
      const ns = [...strips, k];
      setStrips(ns);
      setStrokes(ns.length);
      soundEngine.playGamePop(soundEnabled, 2 + ns.length);
      if (ns.length >= N) {
        if (r) sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
        soundEngine.playGameOk(soundEnabled);
        window.setTimeout(() => {
          if (peelIdx + 1 >= toPeel.length) next();
          else { setPeelIdx((i) => i + 1); setStrokes(0); setStrips([]); }
        }, 900);
      }
    }
  };

  // ---------- резать: тук-тук ----------
  const CHOPS = 3;
  const chop = () => {
    if (step !== 'cut' || doneFx || chops >= CHOPS) return;
    const n = chops + 1;
    setChops(n);
    soundEngine.playClack(soundEnabled, 6 + n * 2);
    if (n >= CHOPS) {
      const r = fruitRef.current?.getBoundingClientRect();
      if (r) sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 14);
      soundEngine.playGameOk(soundEnabled);
      window.setTimeout(() => {
        if (cutIdx + 1 >= toCut.length) next();
        else { setCutIdx((i) => i + 1); setChops(0); }
      }, 1100);
    }
  };

  // ---------- выкладывать ----------
  const filled = new Set(placed.map((q) => q.slot).filter((s) => s !== undefined));
  const left = (p: PieceId) => pic.slots.filter((s) => s.p === p).length + 4 - placed.filter((q) => q.p === p).length; // +4 запасных — можно и своё
  const put = (p: PieceId, at?: { x: number; y: number }) => {
    if (doneFx || left(p) <= 0) return;
    let best = -1, bd = at ? 0.16 : Infinity;
    pic.slots.forEach((s, i) => {
      if (s.p !== p || filled.has(i)) return;
      const d = at ? Math.hypot(s.x - at.x, s.y - at.y) : i;
      if (d < bd) { bd = d; best = i; }
    });
    const slot = best >= 0 ? pic.slots[best] : null;
    const q: Placed = slot
      ? { p, x: slot.x, y: slot.y, r: slot.r ?? 0, s: slot.s ?? 1, slot: best }
      : { p, x: at?.x ?? 0.3 + Math.random() * 0.4, y: at?.y ?? 0.3 + Math.random() * 0.4, r: Math.random() * 360, s: 1 };
    soundEngine.playGamePop(soundEnabled, 4 + (placed.length % 5));
    setPlaced((pl) => [...pl, q]);
  };
  const dropAt = (p: PieceId) => (cx: number, cy: number) => {
    const r = plateRef.current?.getBoundingClientRect();
    if (!r) return put(p);
    const x = (cx - r.left) / r.width, y = (cy - r.top) / r.height;
    if (Math.hypot(x - 0.5, y - 0.5) > 0.5) return;
    put(p, { x, y });
  };
  // уже положенный кусочек можно двигать по тарелке; утащил за край — вернулся на полочку
  const [moving, setMoving] = useState<number | null>(null);
  const grab = (i: number, e: React.PointerEvent) => {
    if (step !== 'arrange' || doneFx) return;
    e.preventDefault();
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setMoving(i);
    setPlaced((pl) => pl.map((q, k) => (k === i ? { ...q, slot: undefined } : q)));
  };
  const plateXY = (e: React.PointerEvent) => {
    const r = plateRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const moveGrab = (e: React.PointerEvent) => {
    if (moving == null) return;
    const { x, y } = plateXY(e);
    setPlaced((pl) => pl.map((q, k) => (k === moving ? { ...q, x, y } : q)));
  };
  const dropGrab = (e: React.PointerEvent) => {
    if (moving == null) return;
    const i = moving; setMoving(null);
    const { x, y } = plateXY(e);
    if (Math.hypot(x - 0.5, y - 0.5) > 0.55) { // за край — убираем обратно
      soundEngine.playGamePop(soundEnabled, 1);
      setPlaced((pl) => pl.filter((_, k) => k !== i));
      return;
    }
    setPlaced((pl) => {
      const q = pl[i];
      const taken = new Set(pl.map((z, k) => (k === i ? undefined : z.slot)).filter((v) => v !== undefined));
      let best = -1, bd = 0.16;
      pic.slots.forEach((sl, k) => { if (sl.p === q.p && !taken.has(k)) { const d = Math.hypot(sl.x - x, sl.y - y); if (d < bd) { bd = d; best = k; } } });
      const sl = best >= 0 ? pic.slots[best] : null;
      soundEngine.playGamePop(soundEnabled, 5);
      return pl.map((z, k) => (k === i ? (sl ? { ...z, x: sl.x, y: sl.y, r: sl.r ?? 0, s: sl.s ?? 1, slot: best } : { ...z, x, y }) : z));
    });
  };
  const allFilled = filled.size >= pic.slots.length;
  const finish = () => { if (doneFx || filled.size < Math.ceil(pic.slots.length * 0.6)) return; next('fa_ok'); };

  // ---------- подсказки ----------
  const pieceTypes = useMemo(() => Array.from(new Set(pic.slots.map((s) => s.p))), [pic]);
  const nextSlot = pic.slots.findIndex((_, i) => !filled.has(i));
  const showGesture = useStepHint(`${step}-${peelIdx}-${cutIdx}`, 2600, 7000, step !== 'pick' && step !== 'serve' && !doneFx);
  let hintKind: HintKind = 'rub';
  let hintTarget: React.RefObject<Element | null> = basinRef;
  let hintItem: string | undefined;
  const fromRef = useRef<Element | null>(null);
  fromRef.current = null;
  if (step === 'peel') { hintKind = 'swipe'; hintTarget = fruitRef; }
  else if (step === 'cut') { hintKind = 'tap'; hintTarget = fruitRef; }
  else if (step === 'arrange') {
    if (allFilled) { hintKind = 'tap'; hintTarget = doneRef; }
    else if (nextSlot >= 0) { hintKind = 'drag'; hintTarget = plateRef; hintItem = PIECES[pic.slots[nextSlot].p].src; fromRef.current = plateEls.current[pic.slots[nextSlot].p] ?? null; }
  }

  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const PLATE = portrait ? 'min(88vw, 50vh, 560px)' : 'min(62vmin, 560px)';
  const BIG = portrait ? 'min(62vw, 34vh, 380px)' : 'min(44vmin, 380px)';

  const tray = step === 'arrange' ? <LoopScroller>{pieceTypes.map((p) => (
    <Plate key={p} src={PIECES[p].src} label={PIECES[p].name} plateRef={(el) => { plateEls.current[p] = el; }}
      target={plateRef} onDrop={dropAt(p)} badge={Math.max(0, left(p))} dim={left(p) <= 0} />
  ))}</LoopScroller> : step === 'cut' || step === 'peel' ? <div className="h-[min(14vmin,110px)]" aria-hidden /> : undefined;

  const cur = step === 'peel' ? toPeel[peelIdx] : step === 'cut' ? toCut[cutIdx] : undefined;
  const curF = cur ? (cur.split('#')[0] as FruitId) : undefined;
  const fruitImg = (f: FruitId, peeled: boolean, extra?: React.CSSProperties) => (
    <img src={peeled && FRUITS[f].peeled ? FRUITS[f].peeled! : FRUITS[f].whole} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none"
      style={{ filter: peeled && FRUITS[f].peeledFilter ? FRUITS[f].peeledFilter : undefined, ...extra }} />
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'arrange'}
      recipe={step !== 'pick' && step !== 'serve' ? <div className="w-[86%]"><FruitPlate size="100%" placed={picPlaced(pic)} /></div> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className={`grid ${portrait ? 'grid-cols-2' : 'grid-cols-3 pr-[min(15vmin,140px)]'} gap-[3vmin] px-3`}>
          {PICS.map((p) => (
            <button key={p.id} type="button" aria-label={p.name} onClick={() => { if (doneFx) return; setPic(p); next(); }}
              className="rounded-[2rem] bg-white/70 shadow-xl p-[1.5vmin] active:scale-95 transition-transform flex justify-center">
              <FruitPlate size={portrait ? 'min(36vw, 18vh)' : 'min(24vmin, 210px)'} placed={picPlaced(p)} />
            </button>
          ))}
        </div>
      )}

      {step === 'wash' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          <NeedRow items={items.map((it) => ({ key: it, src: FRUITS[it.split('#')[0] as FruitId].whole, done: (dirt[it] ?? 1) <= 0 }))} />
          <div ref={basinRef} onPointerMove={washMove} onPointerDown={washMove} className="relative rounded-[2.5rem] overflow-hidden" style={{ width: portrait ? 'min(90vw, 520px)' : 'min(80vmin, 620px)', aspectRatio: '1.5', background: 'linear-gradient(#BAE6FD, #38BDF8 70%, #0EA5E9)', boxShadow: 'inset 0 10px 20px rgba(255,255,255,.6), 0 14px 26px rgba(0,0,0,.25)', touchAction: 'none' }}>
            {/* струя воды из крана */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[8%] h-full pointer-events-none" style={{ background: 'linear-gradient(rgba(255,255,255,.75), rgba(255,255,255,.1))', animation: 'drip .6s linear infinite' }} />
            <div className="absolute inset-[6%] flex flex-wrap items-center justify-center gap-[3%]">
              {items.map((it) => {
                const f = it.split('#')[0] as FruitId;
                const d = dirt[it] ?? 1;
                const small = f === 'blueberry' || f === 'grape';
                return (
                  <div key={it} data-fruit={it} className={`relative ${d <= 0 ? 'animate-[wiggle_0.4s]' : ''}`} style={{ width: small ? '15%' : '24%', aspectRatio: '1' }}>
                    {fruitImg(f, false)}
                    {/* грязь пятнышками */}
                    {[0, 1, 2, 3].map((k) => <span key={k} className="absolute rounded-full pointer-events-none" style={{ left: `${18 + (k * 23) % 60}%`, top: `${20 + (k * 31) % 55}%`, width: '26%', height: '22%', background: 'radial-gradient(circle, rgba(120,72,30,.85), rgba(120,72,30,0) 70%)', opacity: d }} />)}
                    {d <= 0 && <span className="absolute -top-1 -right-1 text-[min(5vmin,24px)]">✨</span>}
                  </div>
                );
              })}
            </div>
            {bubbles.map((b) => <span key={b.id} className="absolute rounded-full border-2 border-white bg-white/50 pointer-events-none" style={{ left: b.x, top: b.y, width: 18, height: 18, transform: 'translate(-50%,-50%)', animation: 'bubble-pop .7s ease-out forwards' }} />)}
          </div>
        </div>
      )}

      {step === 'peel' && curF && (
        <div className="flex flex-col items-center gap-[3vmin]">
          <NeedRow items={toPeel.map((it, i) => ({ key: it, src: FRUITS[it.split('#')[0] as FruitId].whole, done: i < peelIdx || (i === peelIdx && strokes >= peelN(FRUITS[it.split('#')[0] as FruitId] ? (it.split('#')[0] as FruitId) : undefined)), now: i === peelIdx }))} />
          <div ref={fruitRef} key={cur} onPointerDown={peelDown} onPointerMove={peelMove} onPointerUp={() => { swipe.current = null; }}
            className="relative animate-pop-in" style={{ width: BIG, height: BIG, touchAction: 'none' }}>
            {/* под кожурой — очищенный фрукт */}
            {fruitImg(curF, true)}
            {/* кожура полосками: снятые улетают вниз */}
            {Array.from({ length: peelN(curF) }).map((_, k) => {
              const N = peelN(curF), off = strips.includes(k);
              return (
                <div key={k} className="absolute inset-0 pointer-events-none" style={{
                  clipPath: `inset(0 ${100 - ((k + 1) / N) * 100}% 0 ${(k / N) * 100}%)`,
                  transform: off ? `translateY(70%) rotate(${k % 2 ? 22 : -22}deg)` : 'none', opacity: off ? 0 : 1,
                  transition: 'transform .8s cubic-bezier(.5,0,.8,.6), opacity .8s ease-in', transformOrigin: '50% 0%',
                }}>
                  {fruitImg(curF, false)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 'cut' && curF && (
        <div className="flex flex-col items-center gap-[3vmin]">
          <NeedRow items={toCut.map((it, i) => ({ key: it, src: PIECES[FRUITS[it.split('#')[0] as FruitId].piece].src, done: i < cutIdx || (i === cutIdx && chops >= CHOPS), now: i === cutIdx }))} />
          {/* разделочная доска */}
          <div className="relative rounded-[2rem] flex items-center justify-center" style={{ width: portrait ? 'min(88vw, 480px)' : 'min(70vmin, 560px)', aspectRatio: '1.4', background: 'linear-gradient(#E7B984, #C98B4F)', boxShadow: 'inset 0 -8px 0 rgba(0,0,0,.12), 0 14px 22px rgba(0,0,0,.25)' }}>
            <div ref={fruitRef} key={cur} onPointerDown={(e) => { e.preventDefault(); chop(); }} className="relative w-[55%] aspect-square cursor-pointer touch-none animate-pop-in">
              {chops < CHOPS && (
                <>
                  {fruitImg(curF, true, { clipPath: `inset(0 ${chops * 20}% 0 0)` })}
                  <span key={chops} className="absolute -top-[26%] text-[min(16vmin,110px)] pointer-events-none" style={{ right: `${chops * 20 - 8}%`, animation: chops ? 'chop-hit .3s ease-out' : undefined }}>🔪</span>
                </>
              )}
              {/* кусочки разлетаются веером */}
              {chops > 0 && Array.from({ length: chops >= CHOPS ? Math.min(FRUITS[curF].per, 8) : chops * 2 }).map((_, k, arr) => {
                const a = (k / Math.max(1, arr.length)) * Math.PI * 2;
                const rad = chops >= CHOPS ? 34 : 14;
                return <img key={k} src={PIECES[FRUITS[curF].piece].src} alt="" className="absolute pointer-events-none" style={{ left: `${50 + Math.cos(a) * rad}%`, top: `${50 + Math.sin(a) * rad}%`, width: `${PIECES[FRUITS[curF].piece].w * 170}%`, transform: `translate(-50%,-50%) rotate(${(a * 180) / Math.PI + 90}deg)`, transition: 'all .5s cubic-bezier(.3,1.4,.5,1)', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.25))' }} />;
              })}
            </div>
          </div>
        </div>
      )}

      {step === 'arrange' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          <div onPointerMove={moveGrab} onPointerUp={dropGrab} onPointerCancel={dropGrab}>
            <FruitPlate size={PLATE} placed={placed} ghost={pic.slots.filter((_, i) => !filled.has(i))} boxRef={plateRef} onGrab={grab} dragging={moving} />
          </div>
          <DoneButton ref={doneRef} show={filled.size >= Math.ceil(pic.slots.length * 0.6)} onClick={finish} />
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={<FruitPlate size="min(34vmin, 260px)" placed={placed} />} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? fromRef : undefined} itemSrc={hintKind === 'drag' ? hintItem : undefined} />
    </CookScreen>
  );
};
