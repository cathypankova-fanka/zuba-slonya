import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { P, Stove, useRub, useSteps } from './PlayKit';

/** Попкорн: зёрнышки в кастрюльку → включить плиту → ловить прыгающий попкорн → посыпать сахарком → угостить. */

const STEPS = ['kernels', 'fire', 'pop', 'shake', 'serve'] as const;
const VOICES = { kernels: 'pp_kernels', fire: 'pp_fire', pop: 'pp_pop', shake: 'pp_shake' };
const NEED = 10;

interface Fly { id: number; x0: number; vx: number; vy: number; t0: number; caught?: boolean }

export const PopcornMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [kernels, setKernels] = useState(false);
  const [fire, setFire] = useState(false);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [caught, setCaught] = useState(0);
  const [sugar, setSugar] = useState(0);
  const [shaker, setShaker] = useState<{ x: number; y: number } | null>(null);
  const [, setTick] = useState(0);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('cake', character.id), [servedKey, character.id]);
  const potRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLButtonElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const kernelPlate = useRef<HTMLButtonElement | null>(null);
  const idc = useRef(0);

  const restart = () => { setKernels(false); setFire(false); setFlies([]); setCaught(0); setSugar(0); restartSteps(); };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);

  const addKernels = () => { if (kernels || doneFx) return; soundEngine.playGamePop(soundEnabled, 2); setKernels(true); window.setTimeout(() => next(), 500); };
  const lightFire = () => { if (fire || doneFx || step !== 'fire') return; soundEngine.playGamePop(soundEnabled, 4); setFire(true); window.setTimeout(() => next(), 900); };

  // попкорн выпрыгивает из кастрюльки
  useEffect(() => {
    if (step !== 'pop' || doneFx) return;
    const iv = window.setInterval(() => {
      soundEngine.playGamePop(soundEnabled, 6 + Math.floor(Math.random() * 4));
      setFlies((f) => [...f.filter((q) => performance.now() - q.t0 < 2600 && !q.caught).slice(-10), {
        id: idc.current++, x0: 0.45 + Math.random() * 0.1, vx: (Math.random() - 0.5) * 0.5, vy: 1.15 + Math.random() * 0.35, t0: performance.now(),
      }]);
    }, 650);
    let raf = 0;
    const f = () => { setTick((t) => t + 1); raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => { window.clearInterval(iv); cancelAnimationFrame(raf); };
  }, [step, doneFx, soundEnabled]);

  const flyPos = (q: Fly) => {
    const t = (performance.now() - q.t0) / 1000;
    return { x: q.x0 + q.vx * t, y: 0.62 - q.vy * t + 0.9 * t * t };
  };
  const catchIt = (id: number) => {
    setFlies((f) => f.map((q) => (q.id === id ? { ...q, caught: true } : q)));
    soundEngine.playGameOk(soundEnabled);
    setCaught((c) => {
      const n = c + 1;
      if (n === NEED) window.setTimeout(() => next(), 400);
      return n;
    });
  };

  const shakeRub = useRub(step === 'shake' && !doneFx, (d, p) => {
    setShaker(p);
    if (d <= 0) return;
    setSugar((s) => {
      const n = Math.min(1, s + d * 0.3);
      if (Math.floor(n * 8) !== Math.floor(s * 8)) soundEngine.playGamePop(soundEnabled, 8);
      if (s < 1 && n >= 1) window.setTimeout(() => next(), 300);
      return n;
    });
  });

  // ---------- подсказки ----------
  const showGesture = useStepHint(step, 2400, 7000, step !== 'serve' && !doneFx);
  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = potRef;
  if (step === 'kernels') hintKind = 'drag';
  else if (step === 'fire') hintTarget = knobRef;
  else if (step === 'shake') { hintKind = 'rub'; hintTarget = bucketRef; }

  const tray = step === 'kernels'
    ? <Plate src={P('kernels')} label="Зёрнышки" plateRef={(el) => { kernelPlate.current = el; }} onPick={addKernels} target={potRef} onDrop={addKernels} />
    : undefined;

  const STOVE = 'min(60vmin, 520px)';
  const bucket = (w: string, ref?: React.Ref<HTMLDivElement>) => (
    <div ref={ref} className="relative" style={{ width: w, height: `calc(${w} * 1.02)` }}>
      <img src={P('popcorn_bucket')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ clipPath: caught < NEED && step === 'pop' ? `inset(${Math.max(0, 30 - caught * 3)}% 0 0 0)` : undefined }} />
      {sugar > 0 && Array.from({ length: Math.floor(sugar * 30) }).map((_, i) => (
        <span key={i} className="absolute w-[3%] h-[3%] rounded-sm bg-white pointer-events-none" style={{ left: `${15 + (i * 37) % 70}%`, top: `${4 + (i * 13) % 22}%`, boxShadow: '0 0 2px #ccc' }} />
      ))}
    </div>
  );

  return (
    <CookScreen stepKey={step === 'pop' ? 'fire' : step} stepIdx={idx} total={STEPS.length} done={doneFx}
      recipe={step !== 'serve' ? <img src={P('popcorn_bucket')} alt="" className="w-[70%] h-[70%] object-contain" /> : undefined}
      tray={tray}>
      {(step === 'kernels' || step === 'fire' || step === 'pop') && (
        <div className="relative flex items-end gap-[4vmin]">
          <Stove width={STOVE} on={fire} knob={
            <button ref={knobRef} type="button" aria-label="Включить плиту" onClick={lightFire}
              className={`absolute right-[5%] top-1/2 -translate-y-1/2 w-[15%] aspect-square rounded-full bg-[#E4E4E7] border-4 border-white shadow-lg transition-transform ${fire ? 'rotate-90' : step === 'fire' ? 'animate-pulse' : ''}`}>
              <span className="absolute left-1/2 top-[8%] -translate-x-1/2 w-[16%] h-[42%] bg-[#3F3F46] rounded" />
            </button>}>
            <div ref={potRef} className="relative w-[78%]">
              <img src="/assets/items/soup2/pot_open.webp" alt="" draggable={false} className={`w-full pointer-events-none ${step === 'pop' ? 'animate-[wiggle_0.3s_infinite]' : ''}`} />
              {kernels && <img src={P('kernels')} alt="" className="absolute left-[24%] top-[6%] w-[46%] pointer-events-none animate-pop-in" />}
            </div>
          </Stove>
          {step === 'pop' && (
            <div className="flex flex-col items-center gap-2">
              {bucket('min(22vmin, 190px)')}
              <div className="flex gap-1">{Array.from({ length: NEED }).map((_, k) => <span key={k} className={`w-3 h-3 rounded-full border-2 border-white ${k < caught ? 'bg-[#10C97A]' : 'bg-white/70'}`} />)}</div>
            </div>
          )}
          {step === 'pop' && flies.filter((q) => !q.caught).map((q) => {
            const p = flyPos(q);
            if (p.y > 1.1) return null;
            return (
              <button key={q.id} type="button" aria-label="Попкорн" onPointerDown={() => catchIt(q.id)}
                className="absolute w-[min(12vmin,100px)] h-[min(12vmin,100px)] -translate-x-1/2 -translate-y-1/2"
                style={{ left: `calc(${STOVE} * ${p.x})`, top: `calc(${STOVE} * ${p.y} * 0.8)` }}>
                <img src={P('popcorn')} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" style={{ transform: `rotate(${q.id * 70 + (performance.now() - q.t0) / 4}deg)` }} />
              </button>
            );
          })}
        </div>
      )}

      {step === 'shake' && (
        <div {...shakeRub} className="relative cursor-pointer p-[6vmin]">
          {bucket('min(46vmin, 400px)', bucketRef)}
          <div className="absolute pointer-events-none text-[11vmin] transition-all duration-75" style={{ left: `${(shaker?.x ?? 0.75) * 100}%`, top: `${(shaker?.y ?? 0.1) * 100}%`, transform: 'translate(-50%,-90%) rotate(160deg)' }}>🧂</div>
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart} dish={bucket('min(30vmin, 250px)')} />
      )}

      <GestureHint show={showGesture && step !== 'pop'} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? kernelPlate : undefined} itemSrc={hintKind === 'drag' ? P('kernels') : undefined} />
    </CookScreen>
  );
};
