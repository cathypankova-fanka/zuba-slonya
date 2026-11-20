import React, { useMemo, useRef, useState } from 'react';
import { CharacterItem, CHARACTERS } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { getDrinkRecipeAssetUrl } from '../utils/itemAssets';
import { CookScreen, GestureHint, LoopScroller, Plate, useStepHint } from './CookKit';
import { Celebrate, HeroFace, P, say, shuffle } from './PlayKit';

/** Пикник: у трёх гостей заказы-облачка, раздай каждому то, что он хочет. */

const FOODS = [
  { id: 'pancake', name: 'Блинчик', src: P('pancake') },
  { id: 'cookie', name: 'Печенька', src: P('cookie_star') },
  { id: 'popcorn', name: 'Попкорн', src: P('popcorn_bucket') },
  { id: 'strawberry', name: 'Клубничка', src: P('strawberry') },
  { id: 'banana', name: 'Бананчик', src: P('banana') },
  { id: 'apple', name: 'Яблочко', src: P('apple') },
  { id: 'grape', name: 'Виноградинка', src: P('grape') },
  { id: 'juice', name: 'Сок', src: getDrinkRecipeAssetUrl('juice_orange') ?? '' },
  { id: 'cocktail', name: 'Коктейль', src: getDrinkRecipeAssetUrl('cocktail_berry') ?? '' },
  { id: 'cake', name: 'Тортик', src: '/assets/cake/cakes/pink.webp' },
  { id: 'cookie_bear', name: 'Печенька-мишка', src: P('cookie_bear') },
  { id: 'melon', name: 'Дынька', src: P('melon') },
];
const food = (id: string) => FOODS.find((f) => f.id === id)!;

interface Guest { hero: CharacterItem; wants: string[]; got: string[]; mood: 'wait' | 'happy' | 'angry' }

const makeGuests = (exceptId: string): Guest[] => {
  const heroes = shuffle(CHARACTERS.filter((c) => c.id !== exceptId)).slice(0, 3);
  const foods = shuffle(FOODS.map((f) => f.id));
  return heroes.map((hero, i) => ({ hero, wants: foods.slice(i * 2, i * 2 + 2), got: [], mood: 'wait' }));
};

export const PicnicMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [guests, setGuests] = useState<Guest[]>(() => makeGuests(character.id));
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const guestEls = useRef<(HTMLDivElement | null)[]>([]);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLButtonElement | null>(null);
  const hintTarget = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);
  if (!started.current) { started.current = true; window.setTimeout(() => say('pn_start', soundEnabled), 400); }

  const give = (fid: string, gi: number) => {
    const g = guests[gi];
    if (!g || g.mood === 'happy' || done) return;
    if (!g.wants.includes(fid) || g.got.includes(fid)) {
      soundEngine.playGameFail(soundEnabled);
      say('pn_wrong', soundEnabled);
      setGuests((gs) => gs.map((q, i) => (i === gi ? { ...q, mood: 'angry' } : q)));
      window.setTimeout(() => setGuests((gs) => gs.map((q, i) => (i === gi && q.mood === 'angry' ? { ...q, mood: 'wait' } : q))), 1200);
      return;
    }
    soundEngine.playGameChomp(soundEnabled);
    const ng = guests.map((q, i) => {
      if (i !== gi) return q;
      const got = [...q.got, fid];
      return { ...q, got, mood: got.length === q.wants.length ? 'happy' as const : q.mood };
    });
    setGuests(ng);
    if (ng[gi].mood === 'happy') {
      soundEngine.playGameOk(soundEnabled);
      say('pn_ok', soundEnabled);
      if (ng.every((q) => q.mood === 'happy')) window.setTimeout(() => { setDone(true); say('pn_done', soundEnabled); }, 1800);
    }
  };
  const dropAt = (fid: string, x: number, y: number) => {
    const gi = guestEls.current.findIndex((el) => {
      const r = el?.getBoundingClientRect();
      return r && x > r.left - 20 && x < r.right + 20 && y > r.top - 20 && y < r.bottom + 20;
    });
    if (gi >= 0) give(fid, gi);
  };
  const restart = () => { setGuests(makeGuests(character.id)); setDone(false); setRunKey((k) => k + 1); window.setTimeout(() => say('pn_start', soundEnabled), 300); };

  const shelf = useMemo(() => shuffle(FOODS), [runKey]);
  const gi = guests.findIndex((g) => g.mood !== 'happy');
  const want = gi >= 0 ? guests[gi].wants.find((w) => !guests[gi].got.includes(w)) : undefined;
  hintFrom.current = want ? plateEls.current[want] ?? null : null;
  hintTarget.current = gi >= 0 ? guestEls.current[gi] ?? null : null;
  const showGesture = useStepHint(`pn-${guests.map((g) => g.got.length).join('')}`, 3500, 8000, !done);
  const happyCount = guests.filter((g) => g.mood === 'happy').length;

  return (
    <CookScreen stepKey={done ? 'done' : 'play'} stepIdx={happyCount} total={3}
      bg="linear-gradient(#BDE7FF 0%, #E6F7FF 30%, #9BD66B 31%, #6FBF4A 100%)"
      tray={done ? undefined : <LoopScroller>{shelf.map((f) => (
        <Plate key={f.id} src={f.src} label={f.name} plateRef={(el) => { plateEls.current[f.id] = el; }}
          onPick={() => { const i = guests.findIndex((g) => g.mood !== 'happy' && g.wants.includes(f.id) && !g.got.includes(f.id)); give(f.id, i >= 0 ? i : Math.max(0, gi)); }}
          target={{ current: document.body } as React.RefObject<HTMLElement>} onDrop={(x, y) => dropAt(f.id, x, y)} />
      ))}</LoopScroller>}
      trayLoop>
      {!done ? (
        <div className="relative w-full flex items-end justify-center gap-[4vmin]">
          {/* плед */}
          <div className="absolute left-[6%] right-[6%] bottom-[-6vmin] h-[22vmin] rounded-[3rem] -z-0"
            style={{ background: 'repeating-conic-gradient(#EF4444 0 25%, #FFFFFF 0 50%) 0 0 / 7vmin 7vmin', transform: 'perspective(600px) rotateX(55deg)', boxShadow: '0 10px 20px rgba(0,0,0,.2)' }} />
          {guests.map((g, i) => (
            <div key={g.hero.id} ref={(el) => { guestEls.current[i] = el; }} className="relative z-10 flex flex-col items-center gap-[1.5vmin]">
              {/* облачко-заказ */}
              <div className={`relative bg-white rounded-[2rem] shadow-xl px-[1.5vmin] py-[1vmin] flex gap-[1vmin] ${g.mood === 'happy' ? 'opacity-0 scale-75' : ''} transition-all duration-500`}>
                {g.wants.map((w) => (
                  <div key={w} className="relative" style={{ width: 'min(10vmin, 86px)', height: 'min(10vmin, 86px)' }}>
                    <img src={food(w).src} alt="" className={`w-full h-full object-contain ${g.got.includes(w) ? 'opacity-30' : ''}`} />
                    {g.got.includes(w) && <span className="absolute inset-0 flex items-center justify-center text-[6vmin]">✅</span>}
                  </div>
                ))}
                <span className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-6 h-6 bg-white rotate-45" />
              </div>
              <HeroFace hero={g.hero} emotion={g.mood === 'happy' ? 'joy' : g.mood === 'angry' ? 'angry' : 'curious'} size="min(24vmin, 210px)"
                className={g.mood === 'happy' ? 'animate-bounce' : g.mood === 'angry' ? 'animate-[wiggle_0.4s]' : ''} />
            </div>
          ))}
        </div>
      ) : (
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="flex gap-[2vmin]">{guests.map((g) => <HeroFace key={g.hero.id} hero={g.hero} emotion="joy" size="min(12vmin, 100px)" />)}</div>
        </Celebrate>
      )}
      <GestureHint show={showGesture && !done && !!want} kind="drag" target={hintTarget} from={hintFrom} itemSrc={want ? food(want).src : undefined} />
    </CookScreen>
  );
};
