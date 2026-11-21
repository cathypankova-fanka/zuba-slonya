import React, { useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { HeroFace, P, say, useRub, useSteps } from './PlayKit';

/** Уложи спать: почистить зубки → пижамка → сказка (листать) → выключить свет → спокойной ночи. */

const STEPS = ['teeth', 'pajamas', 'book', 'lamp', 'night'] as const;
const VOICES = { teeth: 'bt_teeth', pajamas: 'bt_pajamas', book: 'bt_book', lamp: 'bt_lamp' };
const PAGES = [['🐻', '🌲', '🍯'], ['🐰', '🥕', '🌼'], ['🦉', '🌙', '⭐'], ['😴', '💤', '🛏️']];

export const BedtimeMission: React.FC<{ character: CharacterItem; soundEnabled: boolean; onNewRound?: () => void }> = ({ character, soundEnabled, onNewRound }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [brush, setBrush] = useState(0);
  const [bp, setBp] = useState<{ x: number; y: number } | null>(null);
  const [pj, setPj] = useState(false);
  const [page, setPage] = useState(0);
  const [dark, setDark] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLButtonElement>(null);
  const lampRef = useRef<HTMLButtonElement>(null);
  const pjPlate = useRef<HTMLButtonElement | null>(null);

  const restart = () => { if (onNewRound) { onNewRound(); return; } setBrush(0); setPj(false); setPage(0); setDark(false); restartSteps(); };

  const rub = useRub(step === 'teeth' && !doneFx, (d, p) => {
    setBp(p);
    if (d <= 0 || p.y < 0.35) return;
    setBrush((b) => {
      const n = Math.min(1, b + d * 0.32);
      if (Math.floor(n * 10) !== Math.floor(b * 10)) soundEngine.playGamePop(soundEnabled, 6 + (Math.floor(n * 10) % 3));
      if (b < 1 && n >= 1) { setBp(null); window.setTimeout(() => next(), 300); }
      return n;
    });
  });
  const wearPj = () => { if (pj || doneFx) return; soundEngine.playGamePop(soundEnabled, 5); setPj(true); window.setTimeout(() => next(), 700); };
  const flip = () => {
    if (doneFx) return;
    soundEngine.playEraseSwoosh?.(soundEnabled);
    const n = page + 1; setPage(n);
    if (n >= PAGES.length - 1) window.setTimeout(() => next(), 900);
  };
  const lampOff = () => {
    if (dark || doneFx) return;
    setDark(true); soundEngine.playGamePop(soundEnabled, 1);
    window.setTimeout(() => { say('bt_night', soundEnabled); next(); }, 600);
  };

  const showGesture = useStepHint(`${step}-${page}`, 2400, 7000, step !== 'night' && !doneFx);
  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = heroRef;
  if (step === 'teeth') { hintKind = 'rub'; hintTarget = rub.ref; }
  else if (step === 'pajamas') hintKind = 'drag';
  else if (step === 'book') hintTarget = bookRef;
  else if (step === 'lamp') hintTarget = lampRef;

  const HERO = 'min(52vmin, 440px)';
  const bg = dark || step === 'night'
    ? 'radial-gradient(circle at 70% 20%, #3B3F8F 0%, #1B1D4A 55%, #0E0F2E 100%)'
    : 'linear-gradient(#C7B8F5 0%, #E9DDFB 55%, #D9C3A5 56%, #C9AE8A 100%)';

  const heroWithPj = (size: string, emotion: string) => (
    <HeroFace hero={character} emotion={emotion} size={size}>
      {pj && <img src={P('pajamas')} alt="" className="absolute left-[8%] bottom-[-28%] w-[84%] pointer-events-none animate-pop-in" />}
    </HeroFace>
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} bg={bg}
      tray={step === 'pajamas' && !pj ? <Plate src={P('pajamas')} label="Пижамка" plateRef={(el) => { pjPlate.current = el; }} onPick={wearPj} target={heroRef} onDrop={wearPj} /> : undefined}>
      {step === 'teeth' && (
        <div {...rub} className="relative cursor-pointer">
          {heroWithPj(HERO, 'laugh')}
          {Array.from({ length: Math.floor(brush * 14) }).map((_, i) => (
            <span key={i} className="absolute rounded-full bg-white/90 border border-sky-100 pointer-events-none animate-pop-in"
              style={{ left: `${32 + (i * 29) % 38}%`, top: `${58 + (i * 17) % 18}%`, width: `${5 + (i % 3) * 2}%`, height: `${5 + (i % 3) * 2}%` }} />
          ))}
          <img src={P('toothbrush')} alt="" draggable={false} className="absolute w-[34%] pointer-events-none transition-all duration-75"
            style={{ left: `${(bp?.x ?? 0.78) * 100}%`, top: `${(bp?.y ?? 0.7) * 100}%`, transform: `translate(-30%,-50%) rotate(${bp ? Math.sin(brush * 60) * 15 : 0}deg)` }} />
          <div className="absolute -bottom-[5vmin] left-[15%] right-[15%] h-3 rounded-full bg-white/60 overflow-hidden"><div className="h-full bg-[#38BDF8]" style={{ width: `${brush * 100}%` }} /></div>
        </div>
      )}

      {step === 'pajamas' && <div ref={heroRef}>{heroWithPj(HERO, pj ? 'joy' : 'curious')}</div>}

      {step === 'book' && (
        <div className="flex items-center gap-[4vmin]">
          {heroWithPj('min(30vmin, 260px)', 'joy')}
          <button ref={bookRef} type="button" aria-label="Листать сказку" onClick={flip}
            className="relative flex rounded-2xl shadow-2xl active:scale-95 transition-transform" style={{ width: 'min(56vmin, 480px)', height: 'min(38vmin, 320px)', perspective: '900px' }}>
            {[0, 1].map((side) => (
              <div key={side} className={`flex-1 bg-[#FFFBEB] ${side ? 'rounded-r-2xl' : 'rounded-l-2xl'} border-4 border-[#93C5FD] flex flex-wrap items-center justify-center content-center gap-2 text-[9vmin]`}>
                {PAGES[Math.min(page, PAGES.length - 1)].slice(side ? 1 : 0, side ? 3 : 1).map((e, i) => <span key={`${page}-${i}`} className="animate-pop-in">{e}</span>)}
              </div>
            ))}
            <div key={page} className="absolute right-0 top-0 w-1/2 h-full bg-[#FEF3C7] rounded-r-2xl origin-left pointer-events-none" style={{ animation: page > 0 ? 'pageflip 0.6s ease-in forwards' : 'none', opacity: 0 }} />
          </button>
        </div>
      )}

      {(step === 'lamp' || step === 'night') && (
        <div className="relative flex items-end gap-[3vmin]">
          <div className="relative" style={{ width: 'min(64vmin, 560px)' }}>
            <img src={P('bed')} alt="" draggable={false} className="w-full pointer-events-none" style={{ filter: dark ? 'brightness(.55) saturate(.8)' : undefined }} />
            <div className="absolute" style={{ left: '20%', top: '12%' }}>
              <HeroFace hero={character} emotion={dark ? 'sleepy' : 'joy'} size="min(19vmin, 165px)" />
            </div>
            <img src={P('blanket')} alt="" className="absolute pointer-events-none" style={{ left: '22%', top: '38%', width: '62%', filter: dark ? 'brightness(.6)' : undefined }} />
            {dark && <div className="absolute left-[34%] top-[0%] text-[7vmin] animate-pulse">💤</div>}
          </div>
          <button ref={lampRef} type="button" aria-label="Лампа" onClick={lampOff} className="relative active:scale-95 transition-transform" style={{ width: 'min(20vmin, 170px)' }}>
            {!dark && <div className="absolute -inset-[40%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,226,140,.75), transparent 65%)' }} />}
            <img src={P('lamp_off')} alt="" draggable={false} className="relative w-full pointer-events-none" style={{ filter: dark ? 'brightness(.5)' : 'brightness(1.08)' }} />
          </button>
          {dark && (
            <>
              <img src={P('moon')} alt="" className="absolute -top-[22vmin] right-[-6vmin] w-[16vmin] animate-pop-in" />
              {[0, 1, 2, 3, 4, 5].map((k) => <span key={k} className="absolute text-[4vmin] animate-pulse" style={{ left: `${(k * 19) % 100}%`, top: `${-18 - (k * 7) % 14}vmin`, animationDelay: `${k * 0.3}s` }}>⭐</span>)}
            </>
          )}
        </div>
      )}

      {step === 'night' && (
        <button type="button" aria-label="Ещё раз" onClick={restart}
          className="absolute bottom-[6vmin] left-1/2 -translate-x-1/2 rounded-full bg-white/90 shadow-xl flex items-center justify-center active:scale-90"
          style={{ width: 'min(14vmin, 110px)', height: 'min(14vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? pjPlate : undefined} itemSrc={hintKind === 'drag' ? P('pajamas') : undefined} />
    </CookScreen>
  );
};
