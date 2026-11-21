import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { getWashMessAssetUrl } from '../utils/itemAssets';
import { sayRandom } from '../utils/voice';
import { DoneButton, usePhoto } from './ArtKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { BlowBadge, HeroFace, P, say, useHold, useSteps } from './PlayKit';
import { useBlow } from '../utils/useBlow';

/**
 * Купание: сам пачкаешь друга (грязь, варенье, краска) → выбираешь пену и намыливаешь → бросаешь игрушки в ванну →
 * водишь душем → вытираешь полотенцем → сушишь феном → фото.
 */

const STEPS = ['dirty', 'soap', 'toys', 'shower', 'towel', 'dry', 'done'] as const;
const VOICES = { dirty: 'bw_dirty2', soap: 'bw_soap2', toys: 'bw_toys', shower: 'bw_shower2', towel: 'bw_towel', dry: 'bw_dry', done: 'bw_done' };
const MESS = ['mud', 'jam', 'paint'] as const;
type Mess = (typeof MESS)[number];
const FOAMS = [
  { id: 'white', c: '#FFFFFF' }, { id: 'pink', c: '#F9A8D4' }, { id: 'blue', c: '#7DD3FC' },
  { id: 'yellow', c: '#FDE047' }, { id: 'mint', c: '#86EFAC' }, { id: 'lilac', c: '#C4B5FD' },
];
const TOYS = ['duckling', 'whale', 'fish', 'sailboat', 'octopus', 'turtle', 'penguin', 'starfish_sticker', 'crab_sticker', 'seahorse_sticker', 'jellyfish_sticker', 'frog_sticker'];
const accSrc = (id: string) => `/assets/items/accessories/${id}.webp`;

interface Spot { x: number; y: number; r: number; kind: Mess; dirt: number; rot: number }
interface Foam { x: number; y: number; r: number; c: string; o: number }
interface Drop { x: number; y: number; o: number }
interface Toy { uid: number; id: string; x: number; jump: number }

const foamIcon = (c: string) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='18' y='44' width='64' height='40' rx='16' fill='${c}' stroke='#94A3B8' stroke-width='3'/>${[[30, 36, 14], [52, 28, 18], [72, 38, 12], [42, 22, 9]].map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${c}' stroke='#CBD5E1' stroke-width='3'/>`).join('')}<ellipse cx='38' cy='58' rx='10' ry='5' fill='#fff' opacity='.7'/></svg>`);
const messIcon = (k: Mess) => getWashMessAssetUrl(k) ?? '';

const Dryer: React.FC<{ on: boolean; size: string }> = ({ on, size }) => (
  <svg viewBox="0 0 120 120" style={{ width: size, height: size }} className={on ? 'animate-[wiggle_0.15s_infinite]' : ''}>
    <rect x="44" y="58" width="22" height="50" rx="8" fill="#F472B6" stroke="#BE185D" strokeWidth="4" />
    <rect x="14" y="20" width="76" height="44" rx="22" fill="#F9A8D4" stroke="#BE185D" strokeWidth="4" />
    <rect x="84" y="28" width="22" height="28" rx="6" fill="#FBCFE8" stroke="#BE185D" strokeWidth="4" />
    <circle cx="38" cy="42" r="10" fill="#FDF2F8" stroke="#BE185D" strokeWidth="3" />
    {on && [0, 1, 2].map((k) => <path key={k} d={`M110 ${32 + k * 10} q8 -4 16 0`} stroke="#93C5FD" strokeWidth="4" fill="none" strokeLinecap="round" />)}
  </svg>
);

export const BathMission: React.FC<{ character: CharacterItem; soundEnabled: boolean; onNewRound?: () => void }> = ({ character, soundEnabled, onNewRound }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [spots, setSpots] = useState<Spot[]>([]);
  const spotsRef = useRef<Spot[]>([]);
  const [foam, setFoam] = useState<Foam[]>([]);
  const foamRef = useRef<Foam[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const dropsRef = useRef<Drop[]>([]);
  const [toys, setToys] = useState<Toy[]>([]);
  const [mess, setMess] = useState<Mess>('mud');
  const [foamColor, setFoamColor] = useState(FOAMS[1].c);
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null);
  const [showerX, setShowerX] = useState(0.5);
  const [dryLeft, setDryLeft] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const dryerRef = useRef<HTMLButtonElement>(null);
  const photoRef = useRef<HTMLButtonElement>(null);
  const firstPlate = useRef<HTMLButtonElement | null>(null);
  const finished = useRef(false);
  const lastFoam = useRef<{ x: number; y: number } | null>(null);
  const uid = useRef(0);
  const showerXRef = useRef(0.5);
  const photo = usePhoto(soundEnabled);
  const S = 'min(50vh, 440px)';

  const setS = (s: Spot[]) => { spotsRef.current = s; setSpots(s); };
  const setF = (f: Foam[]) => { foamRef.current = f; setFoam(f); };
  const setD = (d: Drop[]) => { dropsRef.current = d; setDrops(d); };

  useEffect(() => { finished.current = false; lastFoam.current = null; }, [step]);
  useEffect(() => {
    // после душа на друге остаются капельки там, где была пена
    if (step === 'towel') {
      const src = foamRef.current.length ? foamRef.current : [{ x: 0.5, y: 0.5 } as Foam];
      setD(Array.from({ length: 7 }, (_, i) => { const f = src[(i * 7) % src.length]; return { x: Math.min(0.85, Math.max(0.15, f.x + (Math.random() - 0.5) * 0.15)), y: Math.min(0.8, Math.max(0.15, f.y + (Math.random() - 0.5) * 0.15)), o: 1 }; }));
      setF([]);
    }
    if (step === 'done') soundEngine.playGameReward(soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  useEffect(() => {
    if (!photo.taken) return;
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 1200);
    return () => window.clearTimeout(t);
  }, [photo.taken, soundEnabled]);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = heroRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const splat = (p: { x: number; y: number }, kind = mess) => {
    if (step !== 'dirty' || doneFx || spotsRef.current.length >= 12) return;
    soundEngine.playGameChomp?.(soundEnabled);
    soundEngine.playGamePop(soundEnabled, 1 + (spotsRef.current.length % 4));
    setS([...spotsRef.current, { x: p.x, y: p.y, r: 0.1 + Math.random() * 0.05, kind, dirt: 1, rot: Math.random() * 360 }]);
  };

  const rub = (e: React.PointerEvent) => {
    if (doneFx || finished.current) return;
    const p = local(e);
    setFinger(p);
    if (step === 'soap') {
      // пена появляется там, где трём, а грязь под ней пропадает
      const lf = lastFoam.current;
      if (!lf || Math.hypot(lf.x - p.x, lf.y - p.y) > 0.05) {
        lastFoam.current = p;
        setF([...foamRef.current.slice(-70), { x: p.x, y: p.y, r: 0.07 + Math.random() * 0.05, c: foamColor, o: 1 }]);
        if (Math.random() < 0.3) soundEngine.playGamePop(soundEnabled, 6 + Math.floor(Math.random() * 4));
      }
      setS(spotsRef.current.map((s) => (Math.hypot(s.x - p.x, s.y - p.y) < s.r + 0.08 ? { ...s, dirt: Math.max(0, s.dirt - 0.07) } : s)));
    } else if (step === 'towel') {
      let changed = false;
      const n = dropsRef.current.map((d) => { if (d.o > 0 && Math.hypot(d.x - p.x, d.y - p.y) < 0.14) { changed = true; return { ...d, o: Math.max(0, d.o - 0.12) }; } return d; });
      if (!changed) return;
      setD(n);
      if (Math.random() < 0.25) soundEngine.playEraseSwoosh?.(soundEnabled);
      if (n.every((d) => d.o <= 0)) { finished.current = true; next(); }
    }
  };

  // душ: держишь палец на друге — вода льётся там, где палец
  const shower = useHold(step === 'shower' && !doneFx, (dt) => {
    if (finished.current) return;
    const n = foamRef.current.map((f) => (Math.abs(f.x - showerXRef.current) < 0.22 ? { ...f, o: Math.max(0, f.o - dt * 1.4) } : f));
    setF(n);
    setS(spotsRef.current.map((s) => ({ ...s, dirt: 0 })));
    if (n.every((f) => f.o <= 0.02)) { finished.current = true; shower.stop(); next(); }
  });
  useEffect(() => { if (shower.holding) { const t = window.setInterval(() => soundEngine.playGamePop(soundEnabled, 1), 240); return () => window.clearInterval(t); } return undefined; }, [shower.holding, soundEnabled]);

  // подуть в микрофон — пена разлетается и тает (в шаге «душ» так тоже можно смыть всю пену)
  const mic = useBlow((step === 'soap' || step === 'toys' || step === 'shower') && !doneFx, (lv) => {
    if (finished.current || !foamRef.current.length) return;
    const n = foamRef.current.map((f) => ({ ...f, y: f.y - lv * 0.012, x: f.x + (f.x - 0.5) * lv * 0.02, o: Math.max(0, f.o - lv * 0.025) }));
    setF(n);
    if (Math.random() < 0.08) soundEngine.playGamePop(soundEnabled, 8);
    if (step === 'shower' && n.every((f) => f.o <= 0.02)) { setS(spotsRef.current.map((x) => ({ ...x, dirt: 0 }))); finished.current = true; next(); }
  });

  // фен
  const dryer = useHold(step === 'dry' && !doneFx, (dt) => {
    if (finished.current) return;
    setDryLeft((v) => {
      const nv = Math.max(0, v - dt / 2.6);
      if (nv <= 0 && !finished.current) { finished.current = true; window.setTimeout(() => next(), 50); }
      return nv;
    });
  });
  useEffect(() => { if (dryer.holding) { const t = window.setInterval(() => soundEngine.playGamePop(soundEnabled, 0), 120); return () => window.clearInterval(t); } return undefined; }, [dryer.holding, soundEnabled]);

  const addToy = (id: string) => {
    if (step !== 'toys' || doneFx) return;
    soundEngine.playGamePop(soundEnabled, 3);
    window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 1), 120);
    setToys((t) => [...t.slice(-6), { uid: uid.current++, id, x: 0.12 + Math.random() * 0.76, jump: 0 }]);
  };
  const poke = (u: number) => {
    soundEngine.playGamePop(soundEnabled, 9);
    setToys((t) => t.map((q) => (q.uid === u ? { ...q, jump: q.jump + 1 } : q)));
  };

  const goNext = () => { if (finished.current || doneFx) return; finished.current = true; next(); };
  const restart = () => { if (onNewRound) { onNewRound(); return; } setS([]); setF([]); setD([]); setToys([]); setDryLeft(1); photo.reset(); setRunKey((k) => k + 1); restartSteps(); };

  const clean = spots.every((s) => s.dirt <= 0);
  const ready = step === 'dirty' ? spots.length >= 3 : step === 'soap' ? clean && foam.length >= 6 : step === 'toys' ? toys.length >= 1 : false;
  const hintOn = useStepHint(`${step}-${ready}-${photo.taken}`, 2400, 7000, !doneFx && !photo.taken);
  let hintKind: HintKind = 'rub';
  let hintTarget: React.RefObject<Element | null> = heroRef;
  let hintFrom: React.RefObject<Element | null> | undefined;
  if (step === 'dirty') { hintKind = 'tap'; }
  if (step === 'toys') { hintKind = 'drag'; hintFrom = firstPlate; }
  if (step === 'shower') { hintKind = 'hold'; }
  if (step === 'dry') { hintKind = 'hold'; hintTarget = dryerRef; }
  if (ready) { hintKind = 'tap'; hintTarget = doneRef; hintFrom = undefined; }
  if (step === 'done') { hintKind = 'tap'; hintTarget = photoRef; }

  const tray = step === 'dirty'
    ? MESS.map((k, i) => <Plate key={k} src={messIcon(k)} label="" selected={mess === k} plateRef={i === 0 ? (el) => { firstPlate.current = el; } : undefined}
        onPick={() => { setMess(k); soundEngine.playGamePop(soundEnabled, 4); }} target={heroRef} onDrop={(x, y) => { setMess(k); splat(local({ clientX: x, clientY: y }), k); }} />)
    : step === 'soap'
      ? FOAMS.map((f) => <Plate key={f.id} src={foamIcon(f.c)} label="" selected={foamColor === f.c} onPick={() => { setFoamColor(f.c); soundEngine.playGamePop(soundEnabled, 6); }} />)
      : step === 'toys'
        ? <LoopScroller>{TOYS.map((id, i) => <Plate key={id} src={accSrc(id)} label="" plateRef={i === 0 ? (el) => { firstPlate.current = el; } : undefined} onPick={() => addToy(id)} target={heroRef} onDrop={() => addToy(id)} />)}</LoopScroller>
        : undefined;

  const inTub = step !== 'dirty' && step !== 'done';
  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'toys'}
      bg="linear-gradient(#E0F2FE 0%, #F0F9FF 55%, #BAE6FD 56%, #7DD3FC 100%)" tray={tray}>
      <div className="relative flex items-center gap-[4vmin]">
        <div className={`relative transition-transform duration-500 ${photo.taken ? 'rotate-[-4deg] p-[1.6vmin] pb-[5vmin] bg-white shadow-2xl rounded-lg' : ''}`}>
          <div ref={heroRef} className="relative" style={{ width: S, height: S, touchAction: 'none' }}
            onPointerDown={(e) => {
              try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
              if (step === 'dirty') { splat(local(e)); return; }
              if (step === 'shower') { const p = local(e); showerXRef.current = p.x; setShowerX(p.x); shower.bind.onPointerDown(e); return; }
              rub(e);
            }}
            onPointerMove={(e) => {
              if (step === 'shower') { const p = local(e); showerXRef.current = p.x; setShowerX(p.x); return; }
              if (e.buttons || e.pointerType === 'touch') rub(e);
            }}
            onPointerUp={() => { setFinger(null); lastFoam.current = null; }} onPointerCancel={() => setFinger(null)}>
            <HeroFace hero={character} size={S}
              emotion={step === 'done' ? 'joy' : step === 'dirty' && spots.length > 3 ? 'surprised' : step === 'dry' && dryer.holding ? 'laugh' : step === 'toys' && toys.length ? 'joy' : undefined}
              className={step === 'done' && !photo.taken ? 'animate-[bob_1.2s_ease-in-out_infinite]' : step === 'dry' && dryer.holding ? 'animate-[r-jelly_0.4s_infinite]' : ''}>
              {spots.map((s, i) => (
                <div key={i} className="absolute pointer-events-none" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.r * 200}%`, transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, opacity: s.dirt }}>
                  <img src={messIcon(s.kind)} alt="" draggable={false} className="w-full animate-pop-in" />
                </div>
              ))}
              {foam.map((f, i) => (
                <div key={i} className="absolute rounded-full pointer-events-none" style={{
                  left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.r * 200}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)', opacity: f.o,
                  background: `radial-gradient(circle at 35% 30%, #fff 0 18%, ${f.c} 45%, ${f.c} 70%, rgba(255,255,255,.6) 100%)`, boxShadow: 'inset -3px -4px 6px rgba(0,0,0,.08)' }} />
              ))}
              {drops.map((d, i) => d.o > 0 && <span key={i} className="absolute pointer-events-none" style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, fontSize: `calc(${S} * 0.07)`, opacity: d.o, transform: 'translate(-50%,-50%)' }}>💧</span>)}
              {step === 'dry' && <div className="absolute inset-0 pointer-events-none bg-[#7DD3FC]" style={{ opacity: dryLeft * 0.25 }} />}
              {step === 'done' && [0, 1, 2, 3, 4].map((k) => <span key={k} className="absolute pointer-events-none animate-pulse" style={{ left: `${12 + k * 18}%`, top: `${15 + (k % 2) * 55}%`, fontSize: `calc(${S} * 0.09)`, animationDelay: `${k * 0.2}s` }}>✨</span>)}
            </HeroFace>
            {/* ванна и игрушки */}
            {inTub && (
              <svg viewBox="0 0 400 120" className="absolute left-[-10%] w-[120%] pointer-events-none" style={{ bottom: '-18%' }}>
                <path d="M10 10 H390 Q384 100 300 112 H100 Q16 100 10 10 Z" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="6" />
                {[60, 120, 200, 280, 340].map((x, k) => <circle key={k} cx={x} cy={8} r={18 + (k % 2) * 8} fill="#F0F9FF" stroke="#E0F2FE" strokeWidth="3" />)}
              </svg>
            )}
            {inTub && toys.map((t) => (
              <button key={t.uid} type="button" aria-label="игрушка" onPointerDown={(e) => { e.stopPropagation(); poke(t.uid); }}
                className="absolute z-10" style={{ left: `${t.x * 100}%`, bottom: '-4%', width: '20%', transform: 'translateX(-50%)' }}>
                <img key={t.jump} src={accSrc(t.id)} alt="" draggable={false} className={`w-full pointer-events-none ${t.jump ? '' : 'animate-pop-in'}`}
                  style={{ animation: t.jump ? 'r-hop 0.6s' : undefined }} />
              </button>
            ))}
            {/* душ над головой — идёт за пальцем */}
            {step === 'shower' && (
              <div className="absolute pointer-events-none transition-[left] duration-100" style={{ left: `${showerX * 100}%`, top: '-16%', transform: 'translateX(-50%)' }}>
                <div style={{ fontSize: `calc(${S} * 0.2)`, transform: 'scaleX(-1)' }}>🚿</div>
              </div>
            )}
            {step === 'shower' && shower.holding && [0, 1, 2, 3, 4, 5].map((k) => (
              <span key={k} className="absolute top-[4%] w-[1.2vmin] rounded-full bg-[#38BDF8]/70 pointer-events-none"
                style={{ left: `calc(${showerX * 100}% + ${(k - 2.5) * 3}%)`, height: '30%', animation: `rainfall 0.5s linear ${k * 0.08}s infinite` }} />
            ))}
            {finger && (step === 'soap' || step === 'towel') && (
              <img src={step === 'soap' ? P('foam') : P('towel')} alt="" draggable={false} className="absolute pointer-events-none z-20"
                style={{ left: `${finger.x * 100}%`, top: `${finger.y * 100}%`, width: '26%', transform: 'translate(-40%,-60%)' }} />
            )}
            {step === 'dirty' && <img src={messIcon(mess)} alt="" className="absolute right-[-8%] top-[-6%] w-[22%] pointer-events-none animate-bounce" />}
          </div>
        </div>
        <div className="flex flex-col items-center gap-[3vmin]" style={{ width: 'min(16vmin, 130px)' }}>
          {(step === 'dirty' || step === 'soap' || step === 'toys') && <DoneButton ref={doneRef} show={ready} onClick={goNext} />}
          {(step === 'soap' || step === 'toys' || step === 'shower') && <BlowBadge status={mic.status} level={mic.level} />}
          {step === 'dry' && (
            <button ref={dryerRef} type="button" aria-label="Фен" {...dryer.bind} className="active:scale-95 transition-transform" style={{ ...dryer.bind.style }}>
              <Dryer on={dryer.holding} size="min(18vmin, 150px)" />
            </button>
          )}
          {step === 'done' && (!photo.taken
            ? <button ref={photoRef} type="button" aria-label="Фото" onClick={() => { photo.shoot(); say('fm_photo', soundEnabled); }}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                style={{ width: 'min(14vmin, 112px)', height: 'min(14vmin, 112px)', fontSize: 'min(8vmin, 64px)' }}>📸</button>
            : <button type="button" aria-label="Ещё раз" onClick={restart}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>)}
        </div>
      </div>
      {photo.overlay}
      <GestureHint show={hintOn} kind={hintKind} target={hintTarget} from={hintFrom} />
      <span className="hidden">{runKey}</span>
    </CookScreen>
  );
};
