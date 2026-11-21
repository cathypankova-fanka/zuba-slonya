import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { sayRandom } from '../utils/voice';
import { DoneButton, usePhoto } from './ArtKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { HeroFace, P, say, useSteps } from './PlayKit';

/**
 * Свой домик: выбрать обои → расставить мебель → расставить игрушки (всё можно таскать; вынес за комнату — убрал) →
 * гость заходит в комнату, радуется, фото.
 */

const STEPS = ['wall', 'furniture', 'toys', 'guest'] as const;
const VOICES = { wall: 'hs_wall', furniture: 'hs_furniture', toys: 'hs_toys', guest: 'hs_guest' };
const H = (n: string) => `/assets/items/house/${n}.webp`;
const A = (n: string) => `/assets/items/accessories/${n}.webp`;

type Kind = 'floor' | 'wall' | 'rug';
interface Item { id: string; src: string; w: number; kind: Kind }
const FURNITURE: Item[] = [
  { id: 'sofa', src: H('sofa'), w: 0.32, kind: 'floor' }, { id: 'armchair', src: H('armchair'), w: 0.17, kind: 'floor' },
  { id: 'table', src: H('table'), w: 0.18, kind: 'floor' }, { id: 'chair', src: H('chair'), w: 0.11, kind: 'floor' },
  { id: 'wardrobe', src: H('wardrobe'), w: 0.2, kind: 'floor' }, { id: 'bookshelf', src: H('bookshelf'), w: 0.19, kind: 'floor' },
  { id: 'bed', src: P('bed'), w: 0.3, kind: 'floor' }, { id: 'toychest', src: H('toychest'), w: 0.15, kind: 'floor' },
  { id: 'plant', src: H('plant'), w: 0.1, kind: 'floor' }, { id: 'lamp', src: P('lamp_on'), w: 0.09, kind: 'floor' },
  { id: 'rug', src: H('rug'), w: 0.34, kind: 'rug' }, { id: 'window', src: H('window'), w: 0.2, kind: 'wall' },
  { id: 'painting', src: H('painting'), w: 0.15, kind: 'wall' }, { id: 'clock', src: H('clock'), w: 0.1, kind: 'wall' },
];
const TOYS: Item[] = [
  'duckling', 'car', 'train', 'soccer_ball', 'balloon', 'rocket', 'drum', 'guitar', 'dino', 'unicorn_face', 'bear', 'kitty', 'puppy', 'castle', 'gift', 'trophy',
].map((id) => ({ id, src: A(id), w: id === 'balloon' ? 0.09 : 0.1, kind: 'floor' as Kind }))
  .concat([{ id: 'teddy', src: P('teddy_happy'), w: 0.11, kind: 'floor' }, { id: 'vase', src: P('vase'), w: 0.07, kind: 'floor' }, { id: 'book', src: P('book'), w: 0.08, kind: 'floor' }]);

const WALLS = [
  { id: 'pink', bg: 'repeating-linear-gradient(90deg,#FBCFE8 0 4%,#FCE7F3 4% 8%)' },
  { id: 'blue', bg: 'radial-gradient(circle,#BFDBFE 0 18%,transparent 19%) 0 0/7% 9%, #E0F2FE' },
  { id: 'yellow', bg: 'radial-gradient(circle,#FDE68A 0 14%,transparent 15%) 0 0/8% 10%, #FEF9C3' },
  { id: 'mint', bg: 'repeating-linear-gradient(45deg,#BBF7D0 0 3%,#DCFCE7 3% 6%)' },
  { id: 'lilac', bg: 'repeating-linear-gradient(0deg,#DDD6FE 0 6%,#EDE9FE 6% 12%)' },
  { id: 'peach', bg: 'radial-gradient(circle,#FED7AA 0 12%,transparent 13%) 0 0/6% 8%, #FFF7ED' },
];
const wallIcon = (bg: string) => bg; // для плитки-образца

interface Placed { uid: number; item: Item; x: number; y: number; wiggle: number }

export const HouseMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [wall, setWall] = useState(WALLS[0]);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [lampOn, setLampOn] = useState(true);
  const roomRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const photoRef = useRef<HTMLButtonElement>(null);
  const firstPlate = useRef<HTMLButtonElement | null>(null);
  const uid = useRef(0);
  const drag = useRef<{ uid: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const finished = useRef(false);
  const photo = usePhoto(soundEnabled);

  useEffect(() => { finished.current = false; }, [step]);
  useEffect(() => {
    if (step !== 'guest') return;
    soundEngine.playGameReward(soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  useEffect(() => {
    if (!photo.taken) return;
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 1200);
    return () => window.clearTimeout(t);
  }, [photo.taken, soundEnabled]);

  const clampY = (it: Item, y: number) => (it.kind === 'wall' ? Math.min(0.5, Math.max(0.14, y)) : it.kind === 'rug' ? Math.min(0.9, Math.max(0.72, y)) : Math.min(0.98, Math.max(0.66, y)));
  const local = (cx: number, cy: number) => {
    const r = roomRef.current!.getBoundingClientRect();
    return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height };
  };
  const add = (it: Item, p?: { x: number; y: number }) => {
    if (doneFx || (step !== 'furniture' && step !== 'toys')) return;
    soundEngine.playCakePlace?.(soundEnabled);
    // нажали на предмет в ленте — ставим на самое свободное место
    const free = () => {
      let best = { x: 0.5, y: 0.8 }, bestD = -1;
      for (let k = 0; k < 24; k++) {
        const c = { x: 0.12 + Math.random() * 0.76, y: it.kind === 'wall' ? 0.22 + Math.random() * 0.2 : it.kind === 'rug' ? 0.8 : 0.7 + Math.random() * 0.24 };
        const d = Math.min(9, ...placed.filter((q) => (q.item.kind === 'wall') === (it.kind === 'wall')).map((q) => Math.hypot(q.x - c.x, (q.y - c.y) * 1.5)));
        if (d > bestD) { bestD = d; best = c; }
      }
      return best;
    };
    const pos = p ?? free();
    setPlaced((ps) => [...ps, { uid: uid.current++, item: it, x: Math.min(0.92, Math.max(0.08, pos.x)), y: clampY(it, pos.y), wiggle: 0 }]);
  };
  const down = (e: React.PointerEvent, p: Placed) => {
    if (step !== 'furniture' && step !== 'toys') { tapItem(p); return; }
    e.stopPropagation();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    drag.current = { uid: p.uid, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
    d.moved = true;
    const r = roomRef.current!.getBoundingClientRect();
    setPlaced((ps) => ps.map((q) => (q.uid === d.uid ? { ...q, x: d.ox + (e.clientX - d.sx) / r.width, y: d.oy + (e.clientY - d.sy) / r.height } : q)));
  };
  const up = () => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const p = placed.find((q) => q.uid === d.uid); if (!p) return;
    if (!d.moved) { tapItem(p); return; }
    // вынесли за комнату — убираем
    if (p.x < -0.02 || p.x > 1.02 || p.y < -0.02 || p.y > 1.08) {
      soundEngine.playEraseSwoosh?.(soundEnabled);
      setPlaced((ps) => ps.filter((q) => q.uid !== d.uid));
      return;
    }
    soundEngine.playGamePop(soundEnabled, 4);
    setPlaced((ps) => ps.map((q) => (q.uid === d.uid ? { ...q, x: Math.min(0.94, Math.max(0.06, q.x)), y: clampY(q.item, q.y) } : q)));
  };
  const tapItem = (p: Placed) => {
    if (p.item.id === 'lamp') setLampOn((v) => !v);
    soundEngine.playGamePop(soundEnabled, 3 + (p.uid % 6));
    setPlaced((ps) => ps.map((q) => (q.uid === p.uid ? { ...q, wiggle: q.wiggle + 1 } : q)));
  };

  const goNext = () => { if (finished.current || doneFx) return; finished.current = true; next(); };
  const restart = () => { setPlaced([]); setWall(WALLS[0]); photo.reset(); restartSteps(); };

  const ready = step === 'wall' ? true : step === 'furniture' ? placed.some((p) => FURNITURE.includes(p.item)) : step === 'toys' ? placed.some((p) => !FURNITURE.includes(p.item)) : false;
  const hintOn = useStepHint(`${step}-${ready}-${photo.taken}`, 2600, 8000, !doneFx && !photo.taken);
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = roomRef;
  let from: React.RefObject<Element | null> | undefined = firstPlate;
  if (step === 'wall') { hintKind = 'tap'; hintTarget = firstPlate; from = undefined; }
  if (ready && step !== 'wall') { hintKind = 'tap'; hintTarget = doneRef; from = undefined; }
  if (step === 'guest') { hintKind = 'tap'; hintTarget = photoRef; from = undefined; }

  const tray = step === 'wall'
    ? WALLS.map((w, i) => (
        <button key={w.id} ref={i === 0 ? (el) => { firstPlate.current = el; } : undefined} type="button" aria-label="обои"
          onClick={() => { setWall(w); soundEngine.playGamePop(soundEnabled, 5); }}
          className={`rounded-[1.6rem] border-[5px] border-white shadow-lg transition-transform active:scale-90 ${wall.id === w.id ? 'ring-[6px] ring-[#F59E0B] scale-110' : ''}`}
          style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', background: wallIcon(w.bg) }} />
      ))
    : step === 'furniture' || step === 'toys'
      ? <LoopScroller>{(step === 'furniture' ? FURNITURE : TOYS).map((it, i) => (
          <Plate key={it.id} src={it.src} label="" plateRef={i === 0 ? (el) => { firstPlate.current = el; } : undefined}
            onPick={() => add(it)} target={roomRef} onDrop={(x, y) => add(it, local(x, y))} />
        ))}</LoopScroller>
      : undefined;

  const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth * 1.2;
  // телефон вертикально: комната квадратная во всю ширину
  const R = portrait ? 'min(56vh, 500px, calc(100vw - 40px))' : 'min(56vh, 500px, calc((100vw - 40px) * 0.75))';
  const sorted = [...placed].sort((a, b) => (a.item.kind === 'rug' ? -1 : b.item.kind === 'rug' ? 1 : a.item.kind === 'wall' ? -1 : b.item.kind === 'wall' ? 1 : a.y - b.y));
  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'furniture' || step === 'toys'}
      bg="radial-gradient(circle at 50% 30%, #FFFDF5 0%, #FDE7C8 60%, #F5C98F 100%)" tray={tray}>
      <div className="flex items-center gap-[3vmin] max-sm:portrait:flex-col">
        <div className={`transition-transform duration-500 ${photo.taken ? 'rotate-[-3deg] p-[1.6vmin] pb-[5vmin] bg-white shadow-2xl rounded-lg' : ''}`}>
          <div ref={roomRef} className="relative overflow-hidden rounded-[1.6rem] shadow-2xl select-none" style={{ height: R, aspectRatio: portrait ? '1 / 1' : '4 / 3', touchAction: 'none', border: '8px solid #FFFFFF' }}
            onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            {/* стена и пол */}
            <div className="absolute inset-x-0 top-0 h-[60%] transition-all duration-500" style={{ background: wall.bg }} />
            <div className="absolute inset-x-0 top-[58%] h-[3%] bg-white/90 shadow" />
            <div className="absolute inset-x-0 bottom-0 h-[40%]" style={{ background: 'repeating-linear-gradient(90deg,#D6A36B 0 12%,#C98F52 12% 12.6%,#DDB07C 12.6% 24%)' }} />
            {!lampOn && <div className="absolute inset-0 bg-[#1E1B4B]/45 pointer-events-none z-[60] transition-opacity" />}
            {sorted.map((p) => {
              const s = p.item.kind === 'floor' ? 1.15 + (p.y - 0.64) * 1.6 : 1.3;
              const ty = p.item.kind === 'floor' ? -100 : -50;
              return (
                <img key={`${p.uid}-${p.wiggle}`} src={p.item.id === 'lamp' && !lampOn ? P('lamp_off') : p.item.src} alt="" draggable={false}
                  onPointerDown={(e) => down(e, p)}
                  className={`absolute ${p.wiggle ? 'r-jelly' : 'animate-pop-in'} ${step === 'furniture' || step === 'toys' ? 'cursor-grab' : ''}`}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.item.w * s * 100}%`, transform: `translate(-50%, ${ty}%)`, zIndex: p.item.kind === 'rug' ? 1 : p.item.kind === 'wall' ? 2 : 10 + Math.round(p.y * 40),
                    filter: p.item.kind === 'rug' ? undefined : 'drop-shadow(0 6px 5px rgba(0,0,0,.22))', touchAction: 'none', animationDuration: p.wiggle ? '0.5s' : undefined }} />
              );
            })}
            {step === 'guest' && (
              <div className="absolute left-1/2 bottom-[6%] -translate-x-1/2 z-[55] animate-pop-in">
                <div className={photo.taken ? '' : 'animate-[bob_1.2s_ease-in-out_infinite]'}>
                  <HeroFace hero={character} emotion="joy" size={`calc(${R} * 0.34)`} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-[3vmin]" style={{ width: 'min(14vmin, 112px)' }}>
          {step !== 'guest' && <DoneButton ref={doneRef} show={ready} onClick={goNext} />}
          {step === 'guest' && (!photo.taken
            ? <button ref={photoRef} type="button" aria-label="Фото" onClick={() => { photo.shoot(); say('fm_photo', soundEnabled); }}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                style={{ width: 'min(14vmin, 112px)', height: 'min(14vmin, 112px)', fontSize: 'min(8vmin, 64px)' }}>📸</button>
            : <button type="button" aria-label="Ещё раз" onClick={restart}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>)}
        </div>
      </div>
      {photo.overlay}
      <GestureHint show={hintOn} kind={hintKind} target={hintTarget} from={from} />
    </CookScreen>
  );
};
