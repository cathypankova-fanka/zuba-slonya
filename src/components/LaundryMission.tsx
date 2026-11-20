import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { Celebrate, P, say, shuffle, useSteps } from './PlayKit';

/** Стирка: грязные вещички в машинку → порошок → кнопка → крутится → развесить на верёвке. */

const STEPS = ['load', 'soap', 'start', 'spin', 'hang', 'done'] as const;
const VOICES = { load: 'ld_load', soap: 'ld_soap', start: 'ld_start', spin: 'ld_spin', hang: 'ld_hang' };
const CLOTHES = [
  { id: 'sock', name: 'Носочек' }, { id: 'tshirt', name: 'Футболочка' }, { id: 'dress', name: 'Платьице' },
  { id: 'pants', name: 'Штанишки' }, { id: 'towel', name: 'Полотенчико' }, { id: 'hat', name: 'Шапочка' }, { id: 'sweater', name: 'Свитерок' },
];
const N = 4;

const Dirty: React.FC<{ id: string; clean?: boolean; className?: string; style?: React.CSSProperties }> = ({ id, clean, className = '', style }) => (
  <div className={`relative ${className}`} style={style}>
    <img src={P(id)} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
    {!clean && [0, 1, 2].map((k) => <span key={k} className="absolute rounded-full pointer-events-none" style={{ left: `${25 + k * 18}%`, top: `${30 + (k % 2) * 22}%`, width: '20%', height: '16%', background: 'rgba(110,70,30,.55)', filter: 'blur(1px)' }} />)}
  </div>
);
const dirtySrc = (id: string) => P(id);

export const LaundryMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [runKey, setRunKey] = useState(0);
  const set = useMemo(() => shuffle(CLOTHES).slice(0, N), [runKey]);
  const [inside, setInside] = useState<string[]>([]);
  const [soap, setSoap] = useState(false);
  const [hung, setHung] = useState<string[]>([]);
  const [spinAngle, setSpinAngle] = useState(0);
  const washerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLButtonElement | null>(null);

  const restart = () => { setInside([]); setSoap(false); setHung([]); setRunKey((k) => k + 1); restartSteps(); };

  const load = (id: string) => {
    if (doneFx || inside.includes(id)) return;
    soundEngine.playGamePop(soundEnabled, 3 + inside.length);
    const n = [...inside, id]; setInside(n);
    if (n.length === N) window.setTimeout(() => next(), 500);
  };
  const addSoap = () => { if (soap || doneFx) return; soundEngine.playGamePop(soundEnabled, 7); setSoap(true); window.setTimeout(() => next(), 600); };
  const press = () => { if (step !== 'start' || doneFx) return; soundEngine.playGameOk(soundEnabled); next(); };
  useEffect(() => {
    if (step !== 'spin') return;
    let raf = 0; const t0 = performance.now();
    const f = (now: number) => {
      const t = (now - t0) / 1000;
      setSpinAngle(t * 540);
      if (Math.random() < 0.05) soundEngine.playGamePop(soundEnabled, 1);
      if (t < 3.6) raf = requestAnimationFrame(f); else next();
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const hang = (id: string) => {
    if (doneFx || hung.includes(id)) return;
    soundEngine.playGamePop(soundEnabled, 5 + hung.length);
    const n = [...hung, id]; setHung(n);
    if (n.length === N) window.setTimeout(() => { say('ld_ok', soundEnabled); next(); }, 700);
  };

  const showGesture = useStepHint(step, 2400, 7000, step !== 'spin' && step !== 'done' && !doneFx);
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = washerRef;
  let hintItem: string | undefined;
  hintFrom.current = null;
  const nextLoad = set.find((c) => !inside.includes(c.id));
  const nextHang = set.find((c) => !hung.includes(c.id));
  if (step === 'load' && nextLoad) { hintItem = dirtySrc(nextLoad.id); hintFrom.current = plateEls.current[nextLoad.id] ?? null; }
  else if (step === 'soap') { hintItem = P('detergent'); hintFrom.current = plateEls.current.soap ?? null; }
  else if (step === 'start') { hintKind = 'tap'; hintTarget = btnRef; }
  else if (step === 'hang' && nextHang) { hintTarget = lineRef; hintItem = P(nextHang.id); hintFrom.current = plateEls.current[`h_${nextHang.id}`] ?? null; }

  const pRef = (k: string) => (el: HTMLButtonElement | null) => { plateEls.current[k] = el; };
  const tray =
    step === 'load' ? set.map((c) => <Plate key={c.id} src={dirtySrc(c.id)} label={c.name} plateRef={pRef(c.id)} onPick={() => load(c.id)} target={washerRef} onDrop={() => load(c.id)} dim={inside.includes(c.id)} />)
    : step === 'soap' ? <Plate src={P('detergent')} label="Порошок" plateRef={pRef('soap')} onPick={addSoap} target={washerRef} onDrop={addSoap} />
    : step === 'hang' ? set.map((c) => <Plate key={c.id} src={P(c.id)} label={c.name} plateRef={pRef(`h_${c.id}`)} onPick={() => hang(c.id)} target={lineRef} onDrop={() => hang(c.id)} dim={hung.includes(c.id)} />)
    : undefined;

  const WASH = 'min(52vmin, 440px)';
  const washed = idx >= 4;
  return (
    <CookScreen stepKey={step === 'hang' || step === 'done' ? step : 'wash'} stepIdx={idx} total={STEPS.length} done={doneFx}
      bg="linear-gradient(#E0F2FE 0%, #F8FAFC 62%, #CBD5E1 63%, #94A3B8 100%)" tray={tray}>
      {(step === 'load' || step === 'soap' || step === 'start' || step === 'spin') && (
        <div ref={washerRef} className={`relative ${step === 'spin' ? 'animate-[wiggle_0.2s_infinite]' : ''}`} style={{ width: WASH, height: `calc(${WASH} * 1.148)` }}>
          <img src={P('washer')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          {/* барабан за стеклом */}
          <div className="absolute rounded-full overflow-hidden pointer-events-none" style={{ left: '22%', top: '33%', width: '52%', height: '45%' }}>
            <div className="absolute inset-0" style={{ transform: `rotate(${spinAngle}deg)` }}>
              {inside.map((id, i) => <Dirty key={id} id={id} clean={step === 'spin' && spinAngle > 1200} className="absolute animate-pop-in" style={{ width: '46%', height: '46%', left: `${[8, 46, 10, 44][i]}%`, top: `${[10, 12, 48, 46][i]}%` }} />)}
            </div>
            {soap && <img src={P('foam')} alt="" className="absolute inset-x-0 bottom-0 w-full animate-pop-in" style={{ opacity: step === 'spin' ? 0.85 : 0.7 }} />}
            <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.35), rgba(120,170,220,.15) 60%)' }} />
          </div>
          <button ref={btnRef} type="button" aria-label="Кнопка стиралки" onClick={press}
            className={`absolute rounded-full border-[5px] border-white shadow-xl ${step === 'start' ? 'bg-[#22C55E] animate-pulse' : 'bg-[#86EFAC]'}`}
            style={{ right: '8%', top: '6%', width: '16%', aspectRatio: '1' }} />
        </div>
      )}

      {(step === 'hang') && (
        <div ref={lineRef} className="relative w-[min(90vmin,800px)] h-[min(40vmin,340px)]">
          <div className="absolute left-0 right-0 top-[12%] h-[6px] rounded-full bg-[#7C5A3A]" style={{ boxShadow: '0 3px 4px rgba(0,0,0,.2)' }} />
          <div className="absolute left-0 top-[4%] w-[3%] h-[96%] bg-[#A16207] rounded" />
          <div className="absolute right-0 top-[4%] w-[3%] h-[96%] bg-[#A16207] rounded" />
          {hung.map((id, i) => (
            <div key={id} className="absolute animate-pop-in" style={{ left: `${8 + i * 22}%`, top: '10%', width: '20%' }}>
              <img src={P('peg')} alt="" className="absolute left-[40%] -top-[8%] w-[16%] z-10" />
              <img src={P(id)} alt="" className="w-full origin-top" style={{ animation: 'bob 2.4s ease-in-out infinite', animationDelay: `${i * 0.3}s` }} />
            </div>
          ))}
          {washed && <span className="absolute right-[6%] top-[-14%] text-[10vmin]">☀️</span>}
        </div>
      )}

      {step === 'done' && (
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="flex gap-[1vmin]">{set.map((c) => <img key={c.id} src={P(c.id)} alt="" className="w-[9vmin] h-[9vmin] object-contain" />)}</div>
        </Celebrate>
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFrom : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
