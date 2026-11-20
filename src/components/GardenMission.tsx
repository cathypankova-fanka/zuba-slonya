import React, { useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { Celebrate, P, say, shuffle, useHold, useSteps } from './PlayKit';

/** Садик: выкопать 3 ямки → посадить семечки → полить из лейки (держать) → цветы растут → собрать букет в вазу. */

const STEPS = ['dig', 'seed', 'water', 'vase', 'done'] as const;
const VOICES = { dig: 'gd_dig', seed: 'gd_seed', water: 'gd_water', vase: 'gd_vase' };
const FLOWERS = ['tulip', 'sunflower', 'daisy', 'rose'];
const N = 3;

export const GardenMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [runKey, setRunKey] = useState(0);
  const kinds = useMemo(() => shuffle(FLOWERS).slice(0, N), [runKey]);
  const [dug, setDug] = useState<number[]>([0, 0, 0]);
  const [seeded, setSeeded] = useState<boolean[]>([false, false, false]);
  const [grow, setGrow] = useState(0);
  const [picked, setPicked] = useState<boolean[]>([false, false, false]);
  const [shovelAt, setShovelAt] = useState<number | null>(null);
  const spotEls = useRef<(HTMLButtonElement | null)[]>([]);
  const bedRef = useRef<HTMLDivElement>(null);
  const vaseRef = useRef<HTMLDivElement>(null);
  const seedPlate = useRef<HTMLButtonElement | null>(null);
  const hintSpot = useRef<HTMLButtonElement | null>(null);
  const saidGrow = useRef(false);

  const restart = () => { setDug([0, 0, 0]); setSeeded([false, false, false]); setGrow(0); setPicked([false, false, false]); saidGrow.current = false; setRunKey((k) => k + 1); restartSteps(); };

  const tapSpot = (i: number) => {
    if (doneFx) return;
    if (step === 'dig' && dug[i] < 2) {
      setShovelAt(i); window.setTimeout(() => setShovelAt(null), 300);
      soundEngine.playGamePop(soundEnabled, 2 + dug[i]);
      const n = dug.map((v, k) => (k === i ? v + 1 : v)); setDug(n);
      if (n.every((v) => v >= 2)) window.setTimeout(() => next(), 500);
    } else if (step === 'seed') plant(i);
    else if (step === 'vase' && !picked[i]) {
      soundEngine.playGameOk(soundEnabled);
      const n = picked.map((v, k) => (k === i ? true : v)); setPicked(n);
      if (n.every(Boolean)) window.setTimeout(() => { say('gd_ok', soundEnabled); next(); }, 700);
    }
  };
  const plant = (i: number) => {
    if (i < 0 || seeded[i]) return;
    soundEngine.playGamePop(soundEnabled, 5);
    const n = seeded.map((v, k) => (k === i ? true : v)); setSeeded(n);
    if (n.every(Boolean)) window.setTimeout(() => next(), 500);
  };
  const dropSeed = (x: number) => {
    let best = -1, bd = 1e9;
    spotEls.current.forEach((el, i) => { const r = el?.getBoundingClientRect(); if (r && !seeded[i]) { const d = Math.abs(r.left + r.width / 2 - x); if (d < bd) { bd = d; best = i; } } });
    plant(best);
  };

  const water = useHold(step === 'water' && grow < 1 && !doneFx, (dt) => {
    setGrow((g) => {
      const n = Math.min(1, g + dt / 3.2);
      if (n > 0.35 && !saidGrow.current) { saidGrow.current = true; say('gd_grow', soundEnabled); }
      if (Math.floor(n * 6) !== Math.floor(g * 6)) soundEngine.playGamePop(soundEnabled, 3 + Math.floor(n * 5));
      if (g < 1 && n >= 1) window.setTimeout(() => next(), 600);
      return n;
    });
  });

  const plantImg = (i: number) => {
    if (step === 'dig') return dug[i] >= 2 ? P('hole') : null;
    if (!seeded[i]) return P('hole');
    if (grow < 0.3) return P('hole');
    if (grow < 0.62) return P('sprout');
    if (grow < 0.95) return P('bud');
    return P(kinds[i]);
  };

  const showGesture = useStepHint(`${step}`, 2400, 7000, step !== 'done' && !doneFx && !water.holding);
  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = hintSpot;
  const firstIdx = step === 'dig' ? dug.findIndex((v) => v < 2) : step === 'seed' ? seeded.findIndex((v) => !v) : picked.findIndex((v) => !v);
  hintSpot.current = firstIdx >= 0 ? spotEls.current[firstIdx] ?? null : null;
  if (step === 'seed') hintKind = 'drag';
  else if (step === 'water') { hintKind = 'hold'; hintTarget = bedRef; }

  const W = 'min(26vmin, 230px)';
  return (
    <CookScreen stepKey={step === 'done' ? 'done' : 'garden'} stepIdx={idx} total={STEPS.length} done={doneFx}
      bg="linear-gradient(#9BE3FF 0%, #D8F5FF 45%, #8FD46A 46%, #5FB23F 100%)"
      tray={step === 'seed' ? <Plate src={P('seeds')} label="Семечки" plateRef={(el) => { seedPlate.current = el; }}
        onPick={() => plant(seeded.findIndex((v) => !v))} target={bedRef} onDrop={(x) => dropSeed(x)} /> : undefined}>
      {step !== 'done' ? (
        <div className="flex items-end gap-[4vmin]">
          <div ref={bedRef} {...(step === 'water' ? water.bind : {})} className="relative rounded-[3rem] px-[3vmin] pt-[16vmin] pb-[2vmin] flex items-end gap-[3vmin]"
            style={{ background: 'linear-gradient(#8B5A2B, #6B4220)', boxShadow: 'inset 0 8px 0 #A06A35, 0 12px 20px rgba(0,0,0,.25)', ...(step === 'water' ? water.bind.style : {}) }}>
            {[0, 1, 2].map((i) => {
              const src = plantImg(i);
              const gone = picked[i];
              return (
                <button key={i} ref={(el) => { spotEls.current[i] = el; }} type="button" aria-label="Грядка" onClick={() => tapSpot(i)}
                  className="relative flex items-end justify-center" style={{ width: W, height: `calc(${W} * 1.25)` }}>
                  {!src && <span className="absolute bottom-[6%] w-[70%] h-[16%] rounded-[50%] bg-[#5A3618] border-4 border-dashed border-[#C69C6D]" />}
                  {src && !gone && <img key={src} src={src} alt="" draggable={false} className="w-full object-contain pointer-events-none animate-pop-in" style={{ maxHeight: '100%' }} />}
                  {step === 'seed' && seeded[i] && grow === 0 && <img src={P('seeds')} alt="" className="absolute bottom-[16%] w-[34%] pointer-events-none animate-pop-in" />}
                  {shovelAt === i && <img src={P('shovel')} alt="" className="absolute -top-[10%] right-[-10%] w-[60%] pointer-events-none" style={{ transform: 'rotate(-30deg)' }} />}
                </button>
              );
            })}
            {step === 'water' && (
              <div className="absolute -top-[2vmin] pointer-events-none transition-all duration-300" style={{ left: `${10 + grow * 55}%`, width: 'min(22vmin, 190px)', transform: water.holding ? 'rotate(-28deg)' : 'rotate(0deg)' }}>
                <img src={P('watering_can')} alt="" className="w-full" />
                {water.holding && [0, 1, 2, 3, 4].map((k) => <span key={k} className="absolute w-[6%] h-[10%] rounded-full bg-sky-300 animate-bounce" style={{ left: `${-4 + k * 4}%`, top: `${40 + k * 12}%`, animationDelay: `${k * 0.1}s` }} />)}
              </div>
            )}
          </div>
          {step === 'vase' && (
            <div ref={vaseRef} className="relative" style={{ width: 'min(20vmin, 170px)' }}>
              {kinds.map((k, i) => picked[i] && <img key={k} src={P(k)} alt="" className="absolute bottom-[55%] w-[70%] animate-pop-in" style={{ left: `${-5 + i * 20}%`, transform: `rotate(${(i - 1) * 18}deg)`, clipPath: 'inset(0 0 22% 0)' }} />)}
              <img src={P('vase')} alt="" className="relative w-full" />
            </div>
          )}
        </div>
      ) : (
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="relative" style={{ width: 'min(16vmin, 140px)' }}>
            {kinds.map((k, i) => <img key={k} src={P(k)} alt="" className="absolute bottom-[55%] w-[70%]" style={{ left: `${-5 + i * 20}%`, transform: `rotate(${(i - 1) * 18}deg)`, clipPath: 'inset(0 0 22% 0)' }} />)}
            <img src={P('vase')} alt="" className="relative w-full" />
          </div>
        </Celebrate>
      )}
      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? seedPlate : undefined} itemSrc={hintKind === 'drag' ? P('seeds') : undefined} />
    </CookScreen>
  );
};
