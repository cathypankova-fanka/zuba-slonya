import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { getWashMessAssetUrl } from '../utils/itemAssets';
import { sayRandom } from '../utils/voice';
import { CookScreen, GestureHint, HintKind, useStepHint } from './CookKit';
import { HeroFace, P, useHold, useSteps } from './PlayKit';

/** Купание: испачкаться в лужице → намылить пятнышки → смыть душем → вытереть полотенцем → чистенький герой. */

const STEPS = ['dirty', 'soap', 'shower', 'towel', 'done'] as const;
const VOICES = { dirty: 'bw_dirty', soap: 'bw_soap', shower: 'bw_shower', towel: 'bw_towel', done: 'bw_done' };
const MESS = ['mud', 'jam', 'paint'] as const;
const SPLASHES = 5;

interface Spot { x: number; y: number; r: number; kind: (typeof MESS)[number]; dirt: number; foam: number; wet: number }

export const BathMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [spots, setSpots] = useState<Spot[]>([]);
  const ref = useRef<Spot[]>([]);
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null);
  const [runKey, setRunKey] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const puddleRef = useRef<HTMLButtonElement>(null);
  const showerRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const set = (s: Spot[]) => { ref.current = s; setSpots(s); };

  useEffect(() => { finished.current = false; }, [step]);
  useEffect(() => {
    if (step !== 'done') return;
    soundEngine.playGameReward(soundEnabled);
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 3000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, runKey]);

  const splash = () => {
    if (step !== 'dirty' || doneFx || ref.current.length >= SPLASHES) return;
    soundEngine.playGameChomp?.(soundEnabled);
    soundEngine.playGamePop(soundEnabled, 1 + ref.current.length);
    const kind = MESS[ref.current.length % MESS.length];
    const n = [...ref.current, { x: 0.2 + Math.random() * 0.6, y: 0.22 + Math.random() * 0.45, r: 0.12 + Math.random() * 0.05, kind, dirt: 1, foam: 0, wet: 0 }];
    set(n);
    if (n.length >= SPLASHES) { finished.current = true; window.setTimeout(() => next(), 600); }
  };

  const shower = useHold(step === 'shower' && !doneFx, (dt) => {
    if (finished.current) return;
    const n = ref.current.map((s) => ({ ...s, foam: Math.max(0, s.foam - dt * 0.45), wet: Math.min(1, s.wet + dt * 0.6) }));
    set(n);
    if (n.every((s) => s.foam <= 0)) { finished.current = true; shower.stop(); next(); }
  });
  useEffect(() => { if (shower.holding) { const t = window.setInterval(() => soundEngine.playGamePop(soundEnabled, 1), 260); return () => window.clearInterval(t); } return undefined; }, [shower.holding, soundEnabled]);

  const rub = (e: React.PointerEvent) => {
    if (doneFx || finished.current || (step !== 'soap' && step !== 'towel')) return;
    const r = heroRef.current!.getBoundingClientRect();
    const p = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    setFinger(p);
    let changed = false;
    const n = ref.current.map((s) => {
      if (Math.hypot(s.x - p.x, s.y - p.y) > s.r + 0.08) return s;
      if (step === 'soap' && s.dirt > 0) { changed = true; const dirt = Math.max(0, s.dirt - 0.08); return { ...s, dirt, foam: Math.min(1, 1 - dirt) }; }
      if (step === 'towel' && s.wet > 0) { changed = true; return { ...s, wet: Math.max(0, s.wet - 0.1) }; }
      return s;
    });
    if (!changed) return;
    set(n);
    if (Math.random() < 0.25) soundEngine.playEraseSwoosh?.(soundEnabled);
    if (step === 'soap' && n.every((s) => s.dirt <= 0)) { finished.current = true; next(); }
    if (step === 'towel' && n.every((s) => s.wet <= 0)) { finished.current = true; next(); }
  };

  const restart = () => { set([]); setRunKey((k) => k + 1); restartSteps(); };

  const hintOn = useStepHint(`${step}`, 2400, 7000, step !== 'done' && !doneFx);
  let hintKind: HintKind = 'rub';
  let hintTarget: React.RefObject<Element | null> = heroRef;
  if (step === 'dirty') { hintKind = 'tap'; hintTarget = puddleRef; }
  if (step === 'shower') { hintKind = 'hold'; hintTarget = showerRef; }

  const S = 'min(52vh, 460px)';
  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx}
      bg="linear-gradient(#E0F2FE 0%, #F0F9FF 55%, #BAE6FD 56%, #7DD3FC 100%)">
      <div className="relative flex items-end gap-[4vmin]">
        {step === 'dirty' && (
          <button ref={puddleRef} type="button" aria-label="Лужица" onPointerDown={splash}
            className="relative active:scale-90 transition-transform" style={{ width: 'min(26vmin, 220px)' }}>
            <svg viewBox="0 0 200 90" className="w-full"><path d="M20 50 Q10 20 60 22 Q90 6 130 18 Q190 16 182 50 Q196 80 140 80 Q100 92 60 82 Q4 84 20 50 Z" fill="#8B5A2B" /><ellipse cx="80" cy="40" rx="30" ry="8" fill="#A97142" opacity=".7" /></svg>
            <span className="absolute -top-[5vmin] left-1/2 -translate-x-1/2 text-[7vmin]">🥾</span>
          </button>
        )}
        {step === 'shower' && (
          <button ref={showerRef} type="button" aria-label="Душ" {...shower.bind}
            className={`absolute left-1/2 -translate-x-1/2 z-20 transition-transform ${shower.holding ? 'scale-110' : ''}`}
            style={{ ...shower.bind.style, top: 'calc(-1 * min(14vh, 120px))', fontSize: 'min(16vh, 130px)', transform: 'translateX(-50%) scaleX(-1)' }}>🚿</button>
        )}
        <div ref={heroRef} className="relative" style={{ width: S, height: S, touchAction: 'none' }}
          onPointerDown={(e) => { try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ } rub(e); }}
          onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') rub(e); }}
          onPointerUp={() => setFinger(null)} onPointerCancel={() => setFinger(null)}>
          <HeroFace hero={character} emotion={step === 'done' ? 'joy' : step === 'dirty' && spots.length > 2 ? 'surprised' : undefined} size={S}
            className={step === 'done' ? 'animate-[bob_1.2s_ease-in-out_infinite]' : ''}>
            {spots.map((s, i) => (
              <React.Fragment key={i}>
                <div className="absolute pointer-events-none" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.r * 200}%`, transform: 'translate(-50%,-50%)', opacity: s.dirt }}>
                  <img src={getWashMessAssetUrl(s.kind) ?? ''} alt="" draggable={false} className="w-full animate-pop-in" />
                </div>
                {s.foam > 0 && <img src={P('foam')} alt="" draggable={false} className="absolute pointer-events-none"
                  style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.r * 260}%`, transform: 'translate(-50%,-50%)', opacity: s.foam }} />}
                {s.wet > 0 && [0, 1, 2].map((k) => <span key={k} className="absolute pointer-events-none" style={{ left: `${(s.x + (k - 1) * 0.05) * 100}%`, top: `${(s.y + (k % 2) * 0.05) * 100}%`, fontSize: `calc(${S} * 0.06)`, opacity: s.wet }}>💧</span>)}
              </React.Fragment>
            ))}
            {step === 'done' && [0, 1, 2, 3, 4].map((k) => <span key={k} className="absolute pointer-events-none animate-pulse" style={{ left: `${12 + k * 18}%`, top: `${15 + (k % 2) * 55}%`, fontSize: `calc(${S} * 0.09)`, animationDelay: `${k * 0.2}s` }}>✨</span>)}
          </HeroFace>
          {/* ванна спереди */}
          {step !== 'dirty' && step !== 'done' && (
            <svg viewBox="0 0 400 120" className="absolute left-[-10%] w-[120%] pointer-events-none" style={{ bottom: '-18%' }}>
              <path d="M10 10 H390 Q384 100 300 112 H100 Q16 100 10 10 Z" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="6" />
              {[60, 120, 200, 280, 340].map((x, k) => <circle key={k} cx={x} cy={8} r={18 + (k % 2) * 8} fill="#F0F9FF" stroke="#E0F2FE" strokeWidth="3" />)}
            </svg>
          )}
          {/* душ: струйки */}
          {shower.holding && [0, 1, 2, 3, 4, 5, 6].map((k) => (
            <span key={k} className="absolute top-0 w-[1.2vmin] rounded-full bg-[#38BDF8]/70 pointer-events-none"
              style={{ left: `${30 + k * 6}%`, height: '30%', animation: `rainfall 0.5s linear ${k * 0.07}s infinite` }} />
          ))}
          {finger && (step === 'soap' || step === 'towel') && (
            <img src={step === 'soap' ? P('foam') : P('towel')} alt="" draggable={false} className="absolute pointer-events-none"
              style={{ left: `${finger.x * 100}%`, top: `${finger.y * 100}%`, width: '28%', transform: 'translate(-40%,-60%)' }} />
          )}
          {step === 'soap' && !finger && <span className="absolute right-[-6%] bottom-[8%] text-[9vmin] pointer-events-none">🧼</span>}
        </div>
        {step === 'done' && (
          <button type="button" aria-label="Ещё раз" onClick={restart}
            className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
        )}
      </div>
      <GestureHint show={hintOn} kind={hintKind} target={hintTarget} />
    </CookScreen>
  );
};
