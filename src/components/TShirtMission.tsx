import React, { useEffect, useRef, useState } from 'react';
import { STICKERS } from '../data/artTools';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { getStickerAssetUrl } from '../utils/itemAssets';
import { buildTShirtPath2D, TSHIRT_SVG_PATH } from '../utils/canvasRender';
import { sayRandom } from '../utils/voice';
import { ArtPalette, ArtTool, DoneButton, usePaint, usePhoto } from './ArtKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { HeroFace, say, useSteps } from './PlayKit';

/**
 * Футболка: выбрать цвет футболки → расписать кисточками и штампами → наклейки (тащить, нажать — больше) →
 * надеть на друга → показ на сцене и фото.
 */

const STEPS = ['base', 'paint', 'stickers', 'dress', 'show'] as const;
const VOICES = { base: 'ts_base', paint: 'ts_paint', stickers: 'ts_stickers', dress: 'ts_dress', show: 'ts_show' };
const BASES = ['#FFFFFF', '#FF7A9C', '#FFD93D', '#7DD3FC', '#86EFAC', '#C4B5FD', '#FDBA74', '#3B82F6', '#1E293B'];
const TOOLS: ArtTool[] = ['brush', 'heart', 'star', 'flower', 'butterfly', 'dots', 'sun', 'moon', 'cloud'];
const STICKER_IDS = ['whale', 'unicorn_face', 'dino', 'rocket', 'castle', 'kitty', 'puppy', 'bear', 'car', 'train', 'ufo', 'planet', 'rainbow', 'sun',
  'moon_sticker', 'star_sticker', 'heart_sticker', 'flower_sticker', 'butterfly_sticker', 'ladybug', 'bee', 'fish', 'octopus', 'penguin', 'turtle',
  'duckling', 'icecream', 'cupcake', 'donut', 'lollipop', 'strawberry', 'watermelon', 'cherry', 'balloon', 'music_note', 'magic_wand', 'fire_truck',
  'tractor', 'hot_air_balloon', 'pizza', 'crown', 'lion_sticker', 'panda_sticker', 'fox_sticker', 'frog_sticker', 'owl_sticker'].filter((id) => STICKERS.some((s) => s.id === id));
const SIZES = [1, 1.4, 1.8, 0.7];

const stkSrc = (id: string) => { const d = STICKERS.find((s) => s.id === id)!; return getStickerAssetUrl(d.id, d.svg); };
const bucketSrc = (c: string) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M18 34 L24 88 Q50 96 76 88 L82 34 Z' fill='#E5E7EB' stroke='#9CA3AF' stroke-width='3'/><ellipse cx='50' cy='34' rx='32' ry='10' fill='${c}' stroke='#9CA3AF' stroke-width='3'/><path d='M30 36 Q32 52 36 50 Q40 48 40 38' fill='${c}'/><path d='M60 37 Q62 60 67 57 Q71 54 70 37' fill='${c}'/></svg>`);
const clipShirt = (ctx: CanvasRenderingContext2D, w: number, h: number) => ctx.clip(buildTShirtPath2D(w, h));

interface Placed { uid: number; id: string; x: number; y: number; size: number; rot: number }

/** Футболка: основа (заливается снизу), роспись, наклейки — всё по контуру. */
const Shirt: React.FC<{ uid: string; color: string; fill?: number; art?: React.ReactNode; width: string; boxRef?: React.Ref<HTMLDivElement> }> = ({ uid, color, fill = 1, art, width, boxRef }) => (
  <div ref={boxRef} className="relative" style={{ width, aspectRatio: '3 / 4' }}>
    <svg viewBox="0 0 480 640" className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id={`${uid}-f`} x1="0" y1="1" x2="0" y2="0">
          <stop offset={Math.max(0, fill - 0.001)} stopColor={color} />
          <stop offset={Math.min(1, fill + 0.001)} stopColor="#FFFFFF" />
        </linearGradient>
        <clipPath id={`${uid}-c`} clipPathUnits="objectBoundingBox"><path d={TSHIRT_SVG_PATH} transform="scale(0.0020833 0.0015625)" /></clipPath>
      </defs>
      <path d={TSHIRT_SVG_PATH} fill={`url(#${uid}-f)`} stroke="rgba(36,33,29,.25)" strokeWidth="4" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.18))' }} />
      <path d="M 174 185 Q 240 240 306 185" fill="none" stroke="rgba(36,33,29,.18)" strokeWidth="5" strokeLinecap="round" />
    </svg>
    <div className="absolute inset-0" style={{ clipPath: `url(#${uid}-c)` }}>{art}</div>
  </div>
);

export const TShirtMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [runKey, setRunKey] = useState(0);
  const [base, setBase] = useState<string | null>(null);
  const [fill, setFill] = useState(0);
  const [color, setColor] = useState('#FF3B5C');
  const [tool, setTool] = useState<ArtTool>('brush');
  const [artShot, setArtShot] = useState('');
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [worn, setWorn] = useState(false);
  const shirtRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const photoRef = useRef<HTMLButtonElement>(null);
  const shirtPlate = useRef<HTMLButtonElement | null>(null);
  const firstPlate = useRef<HTMLButtonElement | null>(null);
  const finished = useRef(false);
  const uidRef = useRef(0);
  const drag = useRef<{ uid: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const paint = usePaint({ color, tool, soundEnabled, active: step === 'paint', brush: 0.045, clip: clipShirt });
  const photo = usePhoto(soundEnabled);

  useEffect(() => { finished.current = false; }, [step]);
  useEffect(() => {
    if (step === 'show') soundEngine.playGameReward(soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, runKey]);
  useEffect(() => {
    if (!photo.taken) return;
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 1200);
    return () => window.clearTimeout(t);
  }, [photo.taken, soundEnabled]);

  const restart = () => {
    setRunKey((k) => k + 1); setBase(null); setFill(0); setArtShot(''); setPlaced([]); setWorn(false); paint.clear(); photo.reset(); restartSteps();
  };

  // основа: выбранная краска заливает футболку снизу вверх
  const pickBase = (c: string) => {
    if (doneFx || finished.current) return;
    finished.current = true;
    setBase(c); soundEngine.playGameOk(soundEnabled);
    let v = 0;
    const t = window.setInterval(() => {
      v = Math.min(1, v + 0.05); setFill(v);
      if (Math.random() < 0.3) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(v * 6));
      if (v >= 1) { window.clearInterval(t); next(); }
    }, 40);
  };

  const local = (cx: number, cy: number) => {
    const r = shirtRef.current!.getBoundingClientRect();
    return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height };
  };
  const addSticker = (id: string, p?: { x: number; y: number }) => {
    if (step !== 'stickers' || doneFx) return;
    soundEngine.playGamePop(soundEnabled, 5 + (placed.length % 5));
    const pos = p ?? { x: 0.35 + Math.random() * 0.3, y: 0.45 + Math.random() * 0.35 };
    setPlaced((ps) => [...ps, { uid: uidRef.current++, id, x: pos.x, y: pos.y, size: 1, rot: Math.random() * 30 - 15 }]);
  };
  const stickerDown = (e: React.PointerEvent, s: Placed) => {
    if (step !== 'stickers') return;
    e.stopPropagation();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    drag.current = { uid: s.uid, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, moved: false };
  };
  const stickerMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
    d.moved = true;
    const r = shirtRef.current!.getBoundingClientRect();
    const x = Math.min(0.95, Math.max(0.05, d.ox + (e.clientX - d.sx) / r.width));
    const y = Math.min(0.95, Math.max(0.3, d.oy + (e.clientY - d.sy) / r.height));
    setPlaced((ps) => ps.map((p) => (p.uid === d.uid ? { ...p, x, y } : p)));
  };
  const stickerUp = () => {
    const d = drag.current; drag.current = null;
    if (!d || d.moved) return;
    // нажали — наклейка меняет размер
    soundEngine.playGamePop(soundEnabled, 8);
    setPlaced((ps) => ps.map((p) => (p.uid === d.uid ? { ...p, size: SIZES[(SIZES.indexOf(p.size) + 1) % SIZES.length] } : p)));
  };

  const goNext = () => {
    if (finished.current || doneFx) return;
    finished.current = true;
    if (step === 'paint') setArtShot(paint.snapshot());
    next();
  };
  const wear = () => {
    if (step !== 'dress' || worn) return;
    setWorn(true); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 700);
  };

  const art = (live: boolean) => <>
    {step === 'paint' && live
      ? <canvas ref={paint.canvasRef} className="absolute inset-0 w-full h-full" />
      : artShot && <img src={artShot} alt="" draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />}
    {placed.map((s) => (
      <img key={s.uid} src={stkSrc(s.id)} alt="" draggable={false}
        onPointerDown={live ? (e) => stickerDown(e, s) : undefined} onPointerMove={live ? stickerMove : undefined} onPointerUp={live ? stickerUp : undefined}
        className={`absolute ${live && step === 'stickers' ? 'cursor-grab' : 'pointer-events-none'}`}
        style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${22 * s.size}%`, transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, transition: 'width .2s', touchAction: 'none', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.2))' }} />
    ))}
  </>;

  const ready = step === 'paint' ? paint.activity >= 6 : step === 'stickers' ? placed.length >= 2 : false;
  const hintOn = useStepHint(`${step}-${ready}-${photo.taken}`, 2400, 7000, !doneFx && !photo.taken && !(step === 'dress' && worn));
  let hintKind: HintKind = 'rub';
  let hintTarget: React.RefObject<Element | null> = shirtRef;
  let hintFrom: React.RefObject<Element | null> | undefined;
  if (step === 'base') { hintKind = 'tap'; hintTarget = firstPlate; }
  if (step === 'stickers') { hintKind = 'drag'; hintFrom = firstPlate; }
  if (ready) { hintKind = 'tap'; hintTarget = doneRef; hintFrom = undefined; }
  if (step === 'dress') { hintKind = 'drag'; hintTarget = heroRef; hintFrom = shirtPlate; }
  if (step === 'show') { hintKind = 'tap'; hintTarget = photoRef; }

  const tray = step === 'base'
    ? BASES.map((c, i) => <Plate key={c} src={bucketSrc(c)} label="" selected={base === c} plateRef={i === 0 ? (el) => { firstPlate.current = el; } : undefined} onPick={() => pickBase(c)} />)
    : step === 'paint'
      ? <ArtPalette color={color} onColor={setColor} tool={tool} onTool={setTool} tools={TOOLS} soundEnabled={soundEnabled} />
      : step === 'stickers'
        ? <LoopScroller>{STICKER_IDS.map((id, i) => <Plate key={id} src={stkSrc(id)} label="" plateRef={i === 0 ? (el) => { firstPlate.current = el; } : undefined}
            onPick={() => addSticker(id)} target={shirtRef} onDrop={(x, y) => addSticker(id, local(x, y))} />)}</LoopScroller>
        : step === 'dress' && !worn
          ? [<Plate key="shirt" src={'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 640'><path d='${TSHIRT_SVG_PATH}' fill='${base ?? '#fff'}' stroke='#555' stroke-width='6'/></svg>`)} label=""
              plateRef={(el) => { shirtPlate.current = el; }} target={heroRef} onDrop={wear} onPick={wear} />]
          : undefined;

  const W = step === 'paint' ? 'min(38vh, 340px, calc(100vw - 110px))' : 'min(44vh, 400px, calc(100vw - 110px))';
  const shirtNode = (uid: string, width: string, live = false) => <Shirt uid={uid} color={base ?? '#FFFFFF'} fill={step === 'base' ? fill : 1} width={width} boxRef={live ? shirtRef : undefined} art={art(live)} />;

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'stickers'}
      bg="radial-gradient(circle at 50% 35%, #FFFDF5 0%, #FDF2E1 55%, #F8D9B5 100%)" tray={tray}>
      {(step === 'base' || step === 'paint' || step === 'stickers') && (
        <div className="flex items-center gap-[3vmin]">
          <div {...(step === 'paint' ? paint.bind : {})}>{shirtNode('main', W, true)}</div>
          {step !== 'base' && <DoneButton ref={doneRef} show={ready} onClick={goNext} />}
        </div>
      )}

      {(step === 'dress' || step === 'show') && (
        <div className="relative flex items-center gap-[3vmin]">
          {step === 'show' && <>
            <div className="fixed left-0 top-0 bottom-0 w-[13vw] pointer-events-none" style={{ background: 'repeating-linear-gradient(90deg,#B91C1C 0 3vw,#DC2626 3vw 6vw)', boxShadow: '8px 0 20px rgba(0,0,0,.3)' }} />
            <div className="fixed right-0 top-0 bottom-0 w-[13vw] pointer-events-none" style={{ background: 'repeating-linear-gradient(90deg,#DC2626 0 3vw,#B91C1C 3vw 6vw)', boxShadow: '-8px 0 20px rgba(0,0,0,.3)' }} />
          </>}
          <div className={`transition-transform duration-500 ${photo.taken ? 'rotate-[-4deg] p-[1.6vmin] pb-[5vmin] bg-white shadow-2xl rounded-lg' : ''}`}>
            <div ref={heroRef} className={`flex flex-col items-center ${step === 'show' && !photo.taken ? 'animate-[bob_1.2s_ease-in-out_infinite]' : ''}`}>
              <div className="relative z-10"><HeroFace hero={character} emotion={step === 'show' ? 'joy' : undefined} size="min(26vh, 230px)" /></div>
              <div style={{ marginTop: 'calc(min(34vh, 300px) * -0.46)' }}>
                {worn
                  ? <div className="animate-pop-in">{shirtNode('worn', 'min(34vh, 300px)')}</div>
                  : <svg viewBox="0 0 480 640" style={{ width: 'min(34vh, 300px)' }}><path d={TSHIRT_SVG_PATH} fill="rgba(255,255,255,.5)" stroke="#D6A86B" strokeWidth="6" strokeDasharray="18 14" /></svg>}
              </div>
            </div>
          </div>
          {step === 'show' && (
            <div className="flex flex-col items-center gap-[3vmin]">
              {!photo.taken
                ? <button ref={photoRef} type="button" aria-label="Фото" onClick={() => { photo.shoot(); say('fm_photo', soundEnabled); }}
                    className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                    style={{ width: 'min(14vmin, 112px)', height: 'min(14vmin, 112px)', fontSize: 'min(8vmin, 64px)' }}>📸</button>
                : <>
                  <div className="text-[6vmin] animate-bounce">👏</div>
                  <button type="button" aria-label="Ещё раз" onClick={restart}
                    className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
                </>}
            </div>
          )}
        </div>
      )}
      {photo.overlay}
      <GestureHint show={hintOn} kind={hintKind} target={hintTarget} from={hintFrom} />
    </CookScreen>
  );
};
