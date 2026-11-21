import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STICKERS, stickerToDataUrl } from '../data/artTools';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { getStickerAssetUrl } from '../utils/itemAssets';
import { TSHIRT_SVG_PATH } from '../utils/canvasRender';
import { sayRandom } from '../utils/voice';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { HeroFace, say, shuffle, useReveal, useSteps } from './PlayKit';

/** Футболка: выбрать образец → покрасить нужной краской → нарисовать картинку пальчиком → наклейки → надеть на друга → показ. */

const STEPS = ['pick', 'color', 'picture', 'stamps', 'dress', 'show'] as const;
const VOICES = { pick: 'ts_pick', color: 'ts_color', picture: 'ts_pic', stamps: 'ts_stamps', dress: 'ts_dress', show: 'ts_show' };
const PAINTS = ['#FF7A9C', '#FFD93D', '#7DD3FC', '#86EFAC', '#C4B5FD', '#FDBA74'];
const DESIGNS = [
  { color: '#FDBA74', pic: 'whale', stamps: ['fish', 'starfish_sticker', 'cloud_sticker'] },
  { color: '#FF7A9C', pic: 'unicorn_face', stamps: ['heart_sticker', 'star_sticker', 'rainbow'] },
  { color: '#86EFAC', pic: 'dino', stamps: ['leaf', 'sun', 'ladybug'] },
  { color: '#FFD93D', pic: 'rocket', stamps: ['star_sticker', 'moon_sticker', 'planet'] },
  { color: '#C4B5FD', pic: 'castle', stamps: ['crown', 'heart_sticker', 'butterfly_sticker'] },
  { color: '#7DD3FC', pic: 'kitty', stamps: ['paw', 'fish', 'flower_sticker'] },
];
type Design = (typeof DESIGNS)[number];
const STAMP_GOAL = 4;

const stk = (id: string) => STICKERS.find((s) => s.id === id) ?? STICKERS.find((s) => s.id === 'star_sticker')!;
const stkSrc = (id: string) => { const d = stk(id); return getStickerAssetUrl(d.id, d.svg); };
const bucketSrc = (c: string) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M18 34 L24 88 Q50 96 76 88 L82 34 Z' fill='#E5E7EB' stroke='#9CA3AF' stroke-width='3'/><ellipse cx='50' cy='34' rx='32' ry='10' fill='${c}' stroke='#9CA3AF' stroke-width='3'/><path d='M30 36 Q32 52 36 50 Q40 48 40 38' fill='${c}'/><path d='M60 37 Q62 60 67 57 Q71 54 70 37' fill='${c}'/></svg>`);

/** Футболка: заливка снизу вверх (fill 0..1), картинка в центре, наклейки — всё обрезано по контуру. */
const Shirt: React.FC<{ uid: string; color: string; fill?: number; pic?: React.ReactNode; stamps?: { id: number; src: string; x: number; y: number; rot: number }[]; children?: React.ReactNode; width: string; boxRef?: React.Ref<HTMLDivElement> }> = ({ uid, color, fill = 1, pic, stamps = [], children, width, boxRef }) => (
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
    <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `url(#${uid}-c)` }}>
      {pic}
      {stamps.map((s) => (
        <img key={s.id} src={s.src} alt="" draggable={false} className="absolute animate-pop-in"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: '15%', transform: `translate(-50%,-50%) rotate(${s.rot}deg)` }} />
      ))}
    </div>
    {children}
  </div>
);

/** Коробка картинки на футболке (по центру груди). */
const PicBox: React.FC<{ id: string; boxRef?: React.Ref<HTMLDivElement>; children?: React.ReactNode }> = ({ id, boxRef, children }) => (
  <div ref={boxRef} className="absolute" style={{ left: '50%', top: '60%', width: '52%', aspectRatio: `${stk(id).aspectRatio}`, transform: 'translate(-50%,-50%)' }}>{children}</div>
);

export const TShirtMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [runKey, setRunKey] = useState(0);
  const choices = useMemo(() => shuffle(DESIGNS).slice(0, 4), [runKey]);
  const [design, setDesign] = useState<Design>(choices[0]);
  const [paint, setPaint] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [fill, setFill] = useState(0);
  const fillRef = useRef(0);
  const [stampId, setStampId] = useState(design.stamps[0]);
  const [stamps, setStamps] = useState<{ id: number; src: string; x: number; y: number; rot: number }[]>([]);
  const [worn, setWorn] = useState(false);
  const shirtRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const paintEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintRef = useRef<HTMLElement | null>(null);
  const shirtPlate = useRef<HTMLButtonElement | null>(null);
  const finished = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const sid = useRef(0);
  const d = stk(design.pic);
  const rv = useReveal(stkSrc(design.pic), step === 'picture', { fallback: stickerToDataUrl(d.svg), radius: 0.16 });

  useEffect(() => { finished.current = false; last.current = null; }, [step]);
  useEffect(() => { if (step === 'show') { soundEngine.playGameReward(soundEnabled); const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 3500); return () => window.clearTimeout(t); } return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, runKey]);

  const restart = () => {
    setRunKey((k) => k + 1); setPaint(null); setFill(0); fillRef.current = 0; setStamps([]); setWorn(false); restartSteps();
  };
  const pickPaint = (c: string) => {
    if (doneFx) return;
    if (c !== design.color) { soundEngine.playGameFail(soundEnabled); say('ts_wrong', soundEnabled); setWrong(c); window.setTimeout(() => setWrong(null), 600); return; }
    soundEngine.playGameOk(soundEnabled); setPaint(c);
  };
  const local = (e: React.PointerEvent) => {
    const r = shirtRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const onMove = (e: React.PointerEvent, down = false) => {
    if (doneFx || finished.current) return;
    if (!down && !(e.buttons || e.pointerType === 'touch')) return;
    const p = local(e);
    if (step === 'color' && paint) {
      if (last.current) {
        const dd = Math.hypot(p.x - last.current.x, p.y - last.current.y);
        const v = Math.min(1, fillRef.current + dd * 0.22);
        fillRef.current = v; setFill(v);
        if (Math.random() < 0.12) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(v * 6));
        if (v >= 1) { finished.current = true; next(); }
      }
      last.current = p;
    } else if (step === 'picture') {
      const v = rv.reveal(rv.at(e));
      if (Math.random() < 0.15) soundEngine.playGamePop(soundEnabled, 3 + Math.floor(Math.random() * 5));
      if (v > 0.75) { finished.current = true; rv.fill(); next(); }
    } else if (step === 'stamps' && down && stamps.length < STAMP_GOAL) {
      soundEngine.playGamePop(soundEnabled, 5 + stamps.length);
      const n = [...stamps, { id: sid.current++, src: stkSrc(stampId), x: p.x, y: p.y, rot: Math.random() * 40 - 20 }];
      setStamps(n);
      if (n.length >= STAMP_GOAL) { finished.current = true; window.setTimeout(() => next(), 500); }
    }
  };
  const wear = () => {
    if (step !== 'dress' || worn) return;
    setWorn(true); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 600);
  };

  const picNode = (live: boolean) => (
    <PicBox id={design.pic} boxRef={live ? rv.boxRef : undefined}>
      {live ? <>
        <img src={stkSrc(design.pic)} alt="" draggable={false} className="absolute inset-0 w-full h-full" style={{ opacity: 0.25, filter: 'grayscale(1)' }} />
        <canvas ref={rv.canvasRef} className="absolute inset-0 w-full h-full" />
      </> : <img src={stkSrc(design.pic)} alt="" draggable={false} className="absolute inset-0 w-full h-full" />}
    </PicBox>
  );
  const afterPic = step === 'stamps' || step === 'dress' || step === 'show';
  const finishedShirt = (uid: string, width: string) => (
    <Shirt uid={uid} color={design.color} width={width} pic={picNode(false)} stamps={stamps} />
  );

  const hintOn = useStepHint(`${step}-${paint ?? ''}`, 2400, 7000, step !== 'pick' && step !== 'show' && !doneFx);
  let hintKind: HintKind = 'rub';
  hintRef.current = shirtRef.current;
  if (step === 'color' && !paint) { hintKind = 'tap'; hintRef.current = paintEls.current[design.color] ?? null; }
  if (step === 'stamps') hintKind = 'tap';
  if (step === 'dress') { hintKind = 'drag'; hintRef.current = heroRef.current; }

  const tray = step === 'color'
    ? PAINTS.map((c) => <Plate key={c} src={bucketSrc(c)} label="" selected={paint === c} wrong={wrong === c} plateRef={(el) => { paintEls.current[c] = el; }} onPick={() => pickPaint(c)} />)
    : step === 'stamps'
      ? [...new Set([...design.stamps, 'heart_sticker', 'star_sticker'])].map((id) => <Plate key={id} src={stkSrc(id)} label="" selected={stampId === id} onPick={() => { setStampId(id); soundEngine.playGamePop(soundEnabled, 5); }} />)
      : step === 'dress' && !worn
        ? [<Plate key="shirt" src={'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 640'><path d='${TSHIRT_SVG_PATH}' fill='${design.color}' stroke='#555' stroke-width='6'/></svg>`)} label=""
            plateRef={(el) => { shirtPlate.current = el; }} target={heroRef} onDrop={wear} onPick={wear} />]
        : undefined;

  const W = 'min(44vh, 400px)';
  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx}
      bg="radial-gradient(circle at 50% 35%, #FFFDF5 0%, #FDF2E1 55%, #F8D9B5 100%)"
      recipe={step !== 'pick' && step !== 'show' ? <div className="w-[80%]">{finishedShirt('rc', '100%')}</div> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className="grid grid-cols-2 gap-[3vmin]">
          {choices.map((ds, i) => (
            <button key={ds.pic} type="button" aria-label={`футболка ${i + 1}`}
              onClick={() => { setDesign(ds); setStampId(ds.stamps[0]); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-[2rem] bg-white/85 shadow-xl p-[1.5vmin] active:scale-95 transition-transform">
              <Shirt uid={`pk${i}`} color={ds.color} width="min(20vh, 180px)" pic={<PicBox id={ds.pic}><img src={stkSrc(ds.pic)} alt="" className="w-full h-full" /></PicBox>}
                stamps={ds.stamps.map((s, k) => ({ id: k, src: stkSrc(s), x: [0.3, 0.7, 0.5][k], y: [0.42, 0.42, 0.86][k], rot: 0 }))} />
            </button>
          ))}
        </div>
      )}

      {(step === 'color' || step === 'picture' || step === 'stamps') && (
        <div style={{ touchAction: 'none' }}
          onPointerDown={(e) => { try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ } last.current = null; onMove(e, true); }}
          onPointerMove={(e) => onMove(e)} onPointerUp={() => { last.current = null; }}>
          <Shirt uid="main" color={paint ?? design.color} fill={step === 'color' ? fill : 1} width={W} boxRef={shirtRef}
            pic={step === 'picture' ? picNode(true) : afterPic ? picNode(false) : undefined} stamps={stamps} />
        </div>
      )}

      {(step === 'dress' || step === 'show') && (
        <div className="relative flex flex-col items-center">
          {step === 'show' && <>
            <div className="fixed left-0 top-0 bottom-0 w-[14vw] pointer-events-none" style={{ background: 'repeating-linear-gradient(90deg,#B91C1C 0 3vw,#DC2626 3vw 6vw)', boxShadow: '8px 0 20px rgba(0,0,0,.3)' }} />
            <div className="fixed right-0 top-0 bottom-0 w-[14vw] pointer-events-none" style={{ background: 'repeating-linear-gradient(90deg,#DC2626 0 3vw,#B91C1C 3vw 6vw)', boxShadow: '-8px 0 20px rgba(0,0,0,.3)' }} />
          </>}
          <div ref={heroRef} className={`flex flex-col items-center ${step === 'show' ? 'animate-[bob_1.2s_ease-in-out_infinite]' : ''}`}>
            <div className="relative z-10"><HeroFace hero={character} emotion={step === 'show' ? 'joy' : undefined} size="min(28vh, 250px)" /></div>
            <div style={{ marginTop: 'calc(min(36vh, 320px) * -0.46)' }}>
              {worn
                ? <div className="animate-pop-in">{finishedShirt('worn', 'min(36vh, 320px)')}</div>
                : <svg viewBox="0 0 480 640" style={{ width: 'min(36vh, 320px)' }}><path d={TSHIRT_SVG_PATH} fill="rgba(255,255,255,.5)" stroke="#D6A86B" strokeWidth="6" strokeDasharray="18 14" /></svg>}
            </div>
          </div>
          {step === 'show' && <>
            <div className="text-[6vmin] mt-[1vmin]">👏 ⭐⭐⭐ 👏</div>
            <button type="button" aria-label="Ещё раз" onClick={restart}
              className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
          </>}
        </div>
      )}
      <GestureHint show={hintOn} kind={hintKind} target={hintRef} from={step === 'dress' ? shirtPlate : undefined} />
    </CookScreen>
  );
};
