import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { FACE_ART_MASKS, faceArtMaskToDataUrl } from '../data/faceArtMasks';
import { soundEngine } from '../utils/soundEngine';
import { getFaceMaskAssetUrl, getWashMessAssetUrl } from '../utils/itemAssets';
import { sayRandom } from '../utils/voice';
import { CookScreen, GestureHint, Plate, useStepHint } from './CookKit';
import { shuffle, useReveal, useSteps } from './PlayKit';

/** Аквагрим «Волшебное зеркало»: выбрать узор → умыть личико губкой → раскрасить пальчиком → блёстки → зеркало. */

const STEPS = ['pick', 'wash', 'paint', 'sparkle', 'mirror'] as const;
const VOICES = { pick: 'fm_pick', wash: 'fm_wash', paint: 'fm_paint', sparkle: 'fm_sparkle', mirror: 'fm_mirror' };
const SPARKLES = ['star_sticker', 'heart_sticker', 'flower_sticker', 'earring_gem', 'butterfly_sticker', 'rainbow'].map((id) => ({ id, src: `/assets/items/accessories/${id}.webp` }));
const SPARKLE_GOAL = 5;
const BG = 'radial-gradient(circle at 50% 35%, #FFF7FB 0%, #FCE7F3 50%, #E9D5FF 100%)';

const maskSrc = (id: string) => {
  const def = FACE_ART_MASKS.find((m) => m.id === id)!;
  return getFaceMaskAssetUrl(def.id, def.svg);
};

interface Spot { x: number; y: number; r: number; o: number }
interface Placed { id: number; src: string; x: number; y: number; rot: number }

export const FaceMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [runKey, setRunKey] = useState(0);
  const choices = useMemo(() => shuffle(FACE_ART_MASKS).slice(0, 6), [runKey]);
  const [maskId, setMaskId] = useState(choices[0].id);
  const def = FACE_ART_MASKS.find((m) => m.id === maskId)!;
  const anchor = character.faceMaskAnchor;
  const makeSpots = (): Spot[] => Array.from({ length: 5 }, () => ({
    x: 0.25 + Math.random() * 0.5, y: anchor.y - 0.15 + Math.random() * 0.3, r: 0.1 + Math.random() * 0.04, o: 1,
  }));
  const [spots, setSpots] = useState<Spot[]>(makeSpots);
  const spotsRef = useRef(spots);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [sparkle, setSparkle] = useState(SPARKLES[0]);
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rv = useReveal(maskSrc(def.id), step === 'paint', { fallback: faceArtMaskToDataUrl(def.svg) });
  const painted = rv.pct;
  const finished = useRef(false);
  const pid = useRef(0);

  const restart = () => {
    const ns = makeSpots(); spotsRef.current = ns;
    setRunKey((k) => k + 1); setSpots(ns); setPlaced([]); finished.current = false; restartSteps();
  };
  useEffect(() => { setMaskId(choices[0].id); }, [choices]);

  useEffect(() => { if (step === 'paint') finished.current = false; }, [step]);

  const local = (e: React.PointerEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const rubAt = (e: React.PointerEvent) => {
    if (doneFx) return;
    const p = local(e, stageRef.current!);
    setFinger(p);
    if (step === 'wash') {
      if (spotsRef.current.every((s) => s.o <= 0)) return;
      let changed = false;
      const ns = spotsRef.current.map((s) => {
        if (s.o <= 0 || Math.hypot(s.x - p.x, (s.y - p.y) * 1.33) > s.r + 0.06) return s;
        changed = true;
        return { ...s, o: Math.max(0, s.o - 0.09) };
      });
      if (changed) {
        spotsRef.current = ns;
        setSpots(ns);
        if (Math.random() < 0.3) soundEngine.playEraseSwoosh?.(soundEnabled);
        if (ns.every((s) => s.o <= 0)) next();
      }
    } else if (step === 'paint' && !finished.current) {
      const pct = rv.reveal(rv.at(e));
      if (Math.random() < 0.15) soundEngine.playGamePop(soundEnabled, 3 + Math.floor(Math.random() * 5));
      if (pct > 0.75) {
        finished.current = true;
        rv.fill();
        next();
      }
    }
  };
  const tapSparkle = (e: React.PointerEvent) => {
    if (step !== 'sparkle' || doneFx || placed.length >= SPARKLE_GOAL) return;
    const p = local(e, stageRef.current!);
    soundEngine.playGamePop(soundEnabled, 6 + placed.length);
    const n = [...placed, { id: pid.current++, src: sparkle.src, x: p.x, y: p.y, rot: Math.random() * 40 - 20 }];
    setPlaced(n);
    if (n.length >= SPARKLE_GOAL) window.setTimeout(() => next(), 500);
  };

  useEffect(() => {
    if (step !== 'mirror') return;
    soundEngine.playGameReward(soundEnabled);
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 3200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, runKey]);

  const H = 'min(60vh, 540px)';
  const showMask = step === 'sparkle' || step === 'mirror';
  const mirror = step === 'mirror';
  const stage = (
    <div ref={stageRef} className="relative overflow-hidden select-none"
      style={{ height: H, aspectRatio: '3 / 4', borderRadius: mirror ? '50% / 46%' : '2rem', background: character.accentBg, touchAction: 'none',
        border: mirror ? '14px solid #F5C451' : '6px solid #fff', boxShadow: mirror ? '0 0 0 6px #B7791F, 0 20px 40px rgba(120,60,20,.35), inset 0 0 30px rgba(255,255,255,.6)' : '0 16px 30px rgba(0,0,0,.18)' }}
      onPointerDown={(e) => { try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ } if (step === 'sparkle') tapSparkle(e); else rubAt(e); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') rubAt(e); }}
      onPointerUp={() => setFinger(null)} onPointerCancel={() => setFinger(null)}>
      <img src={character.imageSrc} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      {/* грязные пятнышки */}
      {step === 'wash' && spots.map((s, i) => (
        <img key={i} src={getWashMessAssetUrl('mud') ?? ''} alt="" draggable={false} className="absolute pointer-events-none"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.r * 200}%`, transform: 'translate(-50%,-50%)', opacity: s.o, transition: 'opacity .15s' }} />
      ))}
      {/* узор */}
      <div ref={rv.boxRef} className="absolute pointer-events-none"
        style={{ left: '50%', top: `${anchor.y * 100}%`, width: `${def.baseWidthRatio * anchor.scale * 100}%`, aspectRatio: `${def.aspectRatio}`, transform: 'translate(-50%,-50%)' }}>
        {step === 'paint' && <img src={maskSrc(def.id)} alt="" draggable={false} className="absolute inset-0 w-full h-full" style={{ opacity: 0.22, filter: 'grayscale(1)' }} />}
        {step === 'paint' && <canvas ref={rv.canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.92 }} />}
        {showMask && <img src={maskSrc(def.id)} alt="" draggable={false} className="absolute inset-0 w-full h-full" style={{ opacity: 0.92 }} />}
      </div>
      {/* блёстки */}
      {placed.map((s) => (
        <img key={s.id} src={s.src} alt="" draggable={false} className="absolute pointer-events-none animate-pop-in"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: '14%', transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))' }} />
      ))}
      {/* губка / кисточка под пальцем */}
      {finger && (step === 'wash' || step === 'paint') && (
        <span className="absolute pointer-events-none" style={{ left: `${finger.x * 100}%`, top: `${finger.y * 100}%`, transform: 'translate(-30%,-70%)', fontSize: `calc(${H} * 0.13)` }}>{step === 'wash' ? '🧽' : '🖌️'}</span>
      )}
      {mirror && [0, 1, 2, 3, 4, 5].map((k) => (
        <span key={k} className="absolute pointer-events-none animate-pulse" style={{ left: `${10 + (k * 37) % 80}%`, top: `${8 + (k * 23) % 80}%`, fontSize: `calc(${H} * 0.06)`, animationDelay: `${k * 0.2}s` }}>✨</span>
      ))}
    </div>
  );

  const hint = useStepHint(`${step}`, 2400, 7000, step !== 'pick' && step !== 'mirror' && !doneFx);
  const tray = step === 'sparkle'
    ? SPARKLES.map((s) => <Plate key={s.id} src={s.src} label="" selected={sparkle.id === s.id} onPick={() => { setSparkle(s); soundEngine.playGamePop(soundEnabled, 5); }} />)
    : undefined;

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} bg={BG}
      recipe={step !== 'pick' && step !== 'mirror' ? <img src={maskSrc(def.id)} alt="" className="w-[86%] object-contain" /> : undefined}
      tray={tray}>
      {step === 'pick' ? (
        <div className="grid grid-cols-3 gap-[3vmin]">
          {choices.map((m) => (
            <button key={m.id} type="button" aria-label={m.name}
              onClick={() => { setMaskId(m.id); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-[2rem] bg-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 'min(26vmin, 220px)', height: 'min(22vmin, 186px)', background: m.previewBg }}>
              <img src={maskSrc(m.id)} alt="" draggable={false} className="w-[86%] h-[86%] object-contain pointer-events-none" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-[2vmin]">
          {stage}
          {step === 'paint' && (
            <div className="h-[1.6vmin] w-[40vmin] rounded-full bg-white/70 overflow-hidden"><div className="h-full rounded-full bg-[#EC4899] transition-all" style={{ width: `${Math.min(100, painted / 0.75 * 100)}%` }} /></div>
          )}
          {mirror && (
            <button type="button" aria-label="Ещё раз" onClick={restart}
              className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
          )}
        </div>
      )}
      <GestureHint show={hint} kind={step === 'sparkle' ? 'tap' : 'rub'} target={stageRef} />
    </CookScreen>
  );
};
