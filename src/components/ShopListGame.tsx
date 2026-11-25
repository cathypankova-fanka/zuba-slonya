import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { GROCERY, Good, goodById } from '../data/shopGoods';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { CookScreen, GestureHint, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, randomHero, say, shuffle } from './PlayKit';

/**
 * «Покупатель со списком»: приходит герой со списком-картинкой (2 яблока, 1 молоко…).
 * Ребёнок сам ходит по полкам и кладёт в корзинку — в любом порядке; каждую штуку считаем вслух.
 * Лишнее не кладётся: «Ой, этого нет в списке!» / «Уже хватит!». Положенное можно вынуть, нажав на него в корзинке.
 * Три покупателя, списки всё длиннее.
 */

const ROUNDS = 3;
const LEVELS: { kinds: number; min: number; max: number }[] = [
  { kinds: 2, min: 1, max: 2 },
  { kinds: 3, min: 1, max: 3 },
  { kinds: 3, min: 2, max: 4 },
];

interface Line { id: string; n: number }

function makeList(level: number): Line[] {
  const L = LEVELS[Math.min(level, LEVELS.length - 1)];
  return shuffle(GROCERY).slice(0, L.kinds).map((g) => ({ id: g.id, n: L.min + Math.floor(Math.random() * (L.max - L.min + 1)) }));
}

function makeShelf(list: Line[], size: number): Good[] {
  const need = list.map((l) => goodById(l.id));
  const others = shuffle(GROCERY.filter((g) => !list.some((l) => l.id === g.id))).slice(0, size - need.length);
  return shuffle([...need, ...others]);
}

/** Кружочки-счётчик: сколько нужно и сколько уже положили */
const Dots: React.FC<{ n: number; have: number; size: string }> = ({ n, have, size }) => (
  <span className="flex gap-[0.5vmin]">
    {Array.from({ length: n }).map((_, i) => (
      <span key={i} className="rounded-full border-[3px] transition-colors duration-300"
        style={{ width: size, height: size, borderColor: i < have ? '#10C97A' : '#CBB89A', background: i < have ? '#34D399' : '#fff' }} />
    ))}
  </span>
);

export const ShopListGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const [round, setRound] = useState(0);
  const [buyer, setBuyer] = useState<CharacterItem>(() => randomHero(CHARACTERS, character.id));
  const [list, setList] = useState<Line[]>(() => makeList(0));
  const portrait = window.innerHeight > window.innerWidth * 1.15;
  const shelf = useMemo(() => makeShelf(list, portrait ? 9 : 10), [list, portrait]);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const basketRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);

  // покупатель пришёл: «Ура! Это …!», потом — что делать
  useEffect(() => {
    if (done) return;
    busy.current = true;
    const t = window.setTimeout(() => {
      playVoice(`hero_${buyer.id}`, soundEnabled, undefined, 'replace');
      say(round === 0 ? 'sl_start' : 'sl_next', soundEnabled);
      whenVoiceIdle(() => { busy.current = false; });
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, runKey]);

  const have = (id: string) => basket[id] ?? 0;
  const complete = list.every((l) => have(l.id) === l.n);

  const add = (g: Good, el: HTMLElement) => {
    if (paid || done) return;
    const line = list.find((l) => l.id === g.id);
    if (!line || have(g.id) >= line.n) {
      setWrong(g.id);
      soundEngine.playGamePop(soundEnabled, 0);
      playVoice(line ? 'sl_enough' : 'sl_extra', soundEnabled, undefined, 'replace');
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    const n = have(g.id) + 1;
    const nb = { ...basket, [g.id]: n };
    setBasket(nb);
    soundEngine.playGamePop(soundEnabled, 2 + n);
    playVoice(`d_${n}`, soundEnabled, undefined, 'replace');
    const r = el.getBoundingClientRect();
    sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 6);
    if (list.every((l) => (nb[l.id] ?? 0) === l.n)) finishRound();
  };

  const takeBack = (id: string) => {
    if (paid || done || !have(id)) return;
    soundEngine.playGamePop(soundEnabled, 1);
    setBasket((b) => ({ ...b, [id]: (b[id] ?? 0) - 1 }));
  };

  const finishRound = () => {
    setPaid(true);
    window.setTimeout(() => {
      soundEngine.playGameReward(soundEnabled);
      const r = basketRef.current?.getBoundingClientRect();
      if (r) sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 18);
      say('sl_done', soundEnabled);
      whenVoiceIdle(() => window.setTimeout(() => {
        if (round + 1 >= ROUNDS) { setDone(true); say('sl_all', soundEnabled); return; }
        setRound(round + 1);
        setBuyer((b) => randomHero(CHARACTERS.filter((c) => c.id !== b.id), character.id));
        setList(makeList(round + 1));
        setBasket({});
        setPaid(false);
      }, 700));
    }, 700);
  };

  const restart = () => {
    setRound(0); setBuyer(randomHero(CHARACTERS, character.id)); setList(makeList(0));
    setBasket({}); setPaid(false); setDone(false); setRunKey((k) => k + 1);
  };

  const hintOn = useStepHint(`${round}-${Object.values(basket).reduce((a, b) => a + b, 0)}`, 3500, 9000, !paid && !done);

  if (done) {
    return (
      <CookScreen stepKey="done" stepIdx={ROUNDS} total={ROUNDS} done={false} bg="linear-gradient(#FEF3C7, #FDE68A)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart} />
      </CookScreen>
    );
  }

  const IMG = portrait ? 'min(15vw, 84px)' : 'min(11vmin, 86px)';
  const dot = portrait ? 'min(3.4vw, 18px)' : 'min(2.6vmin, 20px)';

  return (
    <CookScreen stepKey={`r${round}`} stepIdx={round} total={ROUNDS} done={false}
      bg="linear-gradient(#FFF7ED 0%, #FFEDD5 60%, #FDBA74 60%, #FB923C 100%)">
      <div className={`w-full h-full flex ${portrait ? 'flex-col' : 'flex-row'} items-center justify-center gap-[2.5vmin] px-[2vmin] pb-[2vmin]`}>
        {/* покупатель и его список */}
        <div className={`flex ${portrait ? 'flex-row items-start' : 'flex-col items-center'} gap-[1.6vmin] shrink-0`}>
          <HeroFace hero={buyer} emotion={paid ? 'joy' : 'curious'} size={portrait ? 'min(22vw, 120px)' : 'min(17vmin, 140px)'} className="animate-pop-in" />
          <div className="relative rounded-[1.2rem] bg-[#FFFDF7] shadow-xl border-2 border-[#E7DCC6] px-[2vmin] py-[1.4vmin] flex flex-col gap-[1vmin]"
            style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 calc(min(9vmin,64px) - 2px), #DBEAFE calc(min(9vmin,64px) - 2px) min(9vmin,64px))' }}>
            <span className="absolute -top-[1.8vmin] left-1/2 -translate-x-1/2 text-[min(5vmin,34px)]">📝</span>
            {list.map((l) => {
              const g = goodById(l.id);
              const ok = have(l.id) === l.n;
              return (
                <div key={l.id} className="flex items-center gap-[1.2vmin]" style={{ height: 'min(9vmin, 64px)' }}>
                  <img src={g.src} alt="" className="object-contain" style={{ width: 'min(8vmin, 58px)', height: 'min(8vmin, 58px)' }} />
                  <span className="font-black text-[#7C2D12] leading-none" style={{ fontSize: 'min(7vmin, 48px)' }}>{l.n}</span>
                  <Dots n={l.n} have={have(l.id)} size={dot} />
                  {ok && <span className="text-[#10C97A] font-black" style={{ fontSize: 'min(5vmin, 34px)' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-[2vmin] min-w-0">
          {/* полки магазина */}
          <div ref={shelfRef} className="rounded-[1.6rem] p-[1.4vmin] shadow-2xl"
            style={{ background: 'linear-gradient(#A16207, #854D0E)' }}>
            <div className={`grid ${portrait ? 'grid-cols-3' : 'grid-cols-5'} gap-[1.2vmin]`}>
              {shelf.map((g) => (
                <button key={g.id} type="button" aria-label={g.name} onClick={(e) => add(g, e.currentTarget)}
                  className={`rounded-2xl bg-[#FEF3C7] shadow-inner flex items-center justify-center p-[0.8vmin] active:scale-90 transition-transform ${wrong === g.id ? 'animate-[wiggle_0.4s]' : ''}`}
                  style={{ borderBottom: '6px solid #713F12' }}>
                  <img src={g.src} alt="" draggable={false} className="object-contain pointer-events-none" style={{ width: IMG, height: IMG }} />
                </button>
              ))}
            </div>
          </div>

          {/* корзинка: нажать на покупку — вынуть обратно */}
          <div ref={basketRef} className="relative flex items-center justify-center flex-wrap gap-[0.6vmin] rounded-b-[2.4rem] rounded-t-[1rem] px-[2vmin] py-[1vmin]"
            style={{ minWidth: 'min(60vmin, 420px)', minHeight: 'min(13vmin, 96px)', background: 'repeating-linear-gradient(45deg,#D97706 0 10px,#B45309 10px 20px)', boxShadow: 'inset 0 6px 12px rgba(0,0,0,.3), 0 8px 14px rgba(0,0,0,.25)' }}>
            <span className="absolute -top-[4.5vmin] left-[10%] right-[10%] h-[6vmin] rounded-t-full border-[6px] border-b-0 border-[#92400E] pointer-events-none" />
            {list.flatMap((l) => Array.from({ length: have(l.id) }).map((_, i) => (
              <button key={`${l.id}-${i}`} type="button" aria-label={`Вынуть ${goodById(l.id).name}`} onClick={() => takeBack(l.id)}
                className="animate-pop-in active:scale-90 transition-transform">
                <img src={goodById(l.id).src} alt="" draggable={false} className="object-contain pointer-events-none drop-shadow" style={{ width: 'min(8vmin, 56px)', height: 'min(8vmin, 56px)' }} />
              </button>
            )))}
            {Object.values(basket).every((v) => !v) && <span className="text-[min(7vmin,48px)] opacity-80">🧺</span>}
            {complete && <span className="absolute -right-[2vmin] -top-[3vmin] text-[min(8vmin,56px)] animate-bounce">🪙</span>}
          </div>
        </div>
      </div>
      <GestureHint show={hintOn} kind="tap" target={shelfRef} />
    </CookScreen>
  );
};
