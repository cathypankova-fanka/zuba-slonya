import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { P, shuffle, useSteps } from './PlayKit';

/** Фруктовые шашлычки: выбрать узор → нарезать банан и киви → нанизать по порядку → угостить. */

const PIECES = [
  { id: 'strawberry', name: 'Клубничка', src: P('strawberry') },
  { id: 'banana', name: 'Бананчик', src: P('banana_slice') },
  { id: 'grape', name: 'Виноградинка', src: P('grape') },
  { id: 'kiwi', name: 'Киви', src: P('kiwi_slice') },
  { id: 'pineapple', name: 'Ананасик', src: P('pineapple') },
  { id: 'orange', name: 'Апельсинчик', src: P('orange_slice') },
  { id: 'apple', name: 'Яблочко', src: P('apple') },
  { id: 'blueberry', name: 'Черничка', src: P('blueberry') },
  { id: 'melon', name: 'Дынька', src: P('melon') },
];
const piece = (id: string) => PIECES.find((p) => p.id === id)!;
const PATTERNS = [
  ['strawberry', 'banana', 'grape', 'strawberry', 'banana', 'grape'],
  ['kiwi', 'pineapple', 'kiwi', 'pineapple', 'blueberry'],
  ['melon', 'strawberry', 'banana', 'kiwi', 'grape'],
  ['orange', 'apple', 'blueberry', 'orange', 'apple'],
];
const STEPS = ['pick', 'cut', 'build', 'serve'] as const;
const VOICES = { pick: 'sk_pick', cut: 'sk_cut', build: 'sk_build' };
const CHOPS = 3;

const Skewer: React.FC<{ items: string[]; ghost?: string[]; w: string }> = ({ items, ghost, w }) => {
  const all = ghost ?? items;
  return (
    <div className="relative" style={{ width: w, aspectRatio: "3.6" }}>
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[7%] rounded-full" style={{ background: 'linear-gradient(#E9C79A,#C9965C)' }} />
      {all.map((id, i) => {
        const placed = i < items.length;
        return (
          <img key={i} src={piece(id).src} alt="" draggable={false}
            className={`absolute top-1/2 -translate-y-1/2 object-contain pointer-events-none ${placed ? 'animate-pop-in' : ''}`}
            style={{ left: `${8 + i * (84 / all.length)}%`, width: `${84 / all.length}%`, height: '100%', opacity: placed ? 1 : 0.28, filter: placed ? 'drop-shadow(0 4px 4px rgba(0,0,0,.25))' : 'grayscale(0.3)' }} />
        );
      })}
    </div>
  );
};

export const SkewersMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [pattern, setPattern] = useState<string[]>(PATTERNS[0]);
  const [cuts, setCuts] = useState<Record<string, number>>({ banana: 0, kiwi: 0 });
  const [hit, setHit] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('icecream', character.id), [servedKey, character.id]);
  const skewerRef = useRef<HTMLDivElement>(null);
  const chopEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const chopTarget = useRef<HTMLButtonElement | null>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLButtonElement | null>(null);

  const restart = () => { setCuts({ banana: 0, kiwi: 0 }); setItems([]); restartSteps(); };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);

  const chop = (id: string) => {
    if (doneFx || (cuts[id] ?? 0) >= CHOPS) return;
    soundEngine.playEraseSwoosh?.(soundEnabled);
    soundEngine.playGamePop(soundEnabled, 3 + (cuts[id] ?? 0));
    setHit(id); window.setTimeout(() => setHit(null), 250);
    const n = { ...cuts, [id]: (cuts[id] ?? 0) + 1 }; setCuts(n);
    if (Object.values(n).every((v) => v >= CHOPS)) window.setTimeout(() => next(), 600);
  };
  const add = (id: string) => {
    if (doneFx || items.length >= pattern.length) return;
    if (pattern[items.length] !== id) { soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600); return; }
    soundEngine.playGamePop(soundEnabled, 4 + items.length);
    const n = [...items, id]; setItems(n);
    if (n.length === pattern.length) window.setTimeout(() => next('sk_ok'), 500);
  };

  const shelf = useMemo(() => shuffle(PIECES), [pattern]);
  const showGesture = useStepHint(`${step}`, 2400, 7000, step !== 'pick' && step !== 'serve' && !doneFx);
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = skewerRef;
  let hintItem: string | undefined;
  hintFrom.current = null;
  if (step === 'cut') {
    hintKind = 'tap';
    chopTarget.current = chopEls.current[(cuts.banana ?? 0) < CHOPS ? 'banana' : 'kiwi'] ?? null;
    hintTarget = chopTarget;
  } else if (step === 'build') {
    const want = pattern[items.length];
    if (want) { hintItem = piece(want).src; hintFrom.current = plateEls.current[want] ?? null; }
  }

  const tray = step === 'build' ? <LoopScroller>{shelf.map((p) => (
    <Plate key={p.id} src={p.src} label={p.name} plateRef={(el) => { plateEls.current[p.id] = el; }} onPick={() => add(p.id)} target={skewerRef} onDrop={() => add(p.id)} wrong={wrong === p.id} />
  ))}</LoopScroller> : undefined;

  const W = 'min(92vmin, 820px)';
  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'build'}
      recipe={step !== 'pick' && step !== 'serve' ? <div className="w-[88%]"><Skewer items={pattern} w="100%" /></div> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className="flex flex-col gap-[2.5vmin]">
          {PATTERNS.map((p, i) => (
            <button key={i} type="button" aria-label={`шашлычок ${i + 1}`} onClick={() => { setPattern(p); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-full bg-white/90 shadow-xl px-[3vmin] py-[1vmin] active:scale-95 transition-transform">
              <Skewer items={p} w="min(64vmin, 560px)" />
            </button>
          ))}
        </div>
      )}

      {step === 'cut' && (
        <div className="relative" style={{ width: 'min(84vmin, 740px)' }}>
          <img src="/assets/items/soup2/board.webp" alt="" draggable={false} className="w-full pointer-events-none drop-shadow-xl" />
          <div className="absolute inset-0 flex items-center justify-center gap-[6vmin]">
            {(['banana', 'kiwi'] as const).map((id) => {
              const c = cuts[id] ?? 0;
              const done = c >= CHOPS;
              return (
                <button key={id} ref={(el) => { chopEls.current[id] = el; }} type="button" aria-label={id === 'banana' ? 'Бананчик' : 'Киви'} onPointerDown={() => chop(id)}
                  className={`relative w-[34%] aspect-square flex items-center justify-center ${hit === id ? 'chop-hit' : ''}`}>
                  {done
                    ? <div className="flex flex-wrap justify-center animate-pop-in">{[0, 1, 2, 3].map((k) => <img key={k} src={id === 'banana' ? P('banana_slice') : P('kiwi_slice')} alt="" className="w-[44%] object-contain" />)}</div>
                    : <img src={id === 'banana' ? P('banana') : P('kiwi')} alt="" draggable={false} className="w-[90%] h-[90%] object-contain pointer-events-none drop-shadow-lg" />}
                  {!done && [...Array(c)].map((_, k) => <span key={k} className="absolute top-[18%] bottom-[18%] w-[5px] rounded bg-[#5B3A1E]/70" style={{ left: `${30 + k * 20}%`, transform: 'rotate(10deg)' }} />)}
                  {!done && <img src="/assets/items/soup2/knife.webp" alt="" className="absolute w-[70%] pointer-events-none transition-all duration-150" style={{ right: '-20%', top: hit === id ? '-6%' : '-50%', transform: `rotate(${hit === id ? 50 : 20}deg)` }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'build' && <div ref={skewerRef} className="py-[4vmin]"><Skewer items={items} ghost={pattern} w={W} /></div>}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart} dish={<Skewer items={items} w="min(56vmin, 480px)" />} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFrom : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
