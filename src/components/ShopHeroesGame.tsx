import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { pickReaction, Reaction } from '../data/reactions';
import { COLOR_HEX, GOODS, Good, GoodColor, GoodKind } from '../data/shopGoods';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { CookScreen, GestureHint, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, randomHero, say, shuffle } from './PlayKit';
import { ReactionHero } from './ReactionHero';

/**
 * «Герои-покупатели»: ребёнок — продавец. К прилавку по очереди подходят герои и просят
 * «что-нибудь красное», «что-нибудь сладкое», «игрушку»… Подходит сразу несколько товаров —
 * ребёнок сам решает, что предложить. Угадал — герой радуется своей видео-реакцией и платит монетку.
 */

const ROUNDS = 4;
const SHELF = 10;

type Clue = { type: 'color'; v: GoodColor } | { type: 'kind'; v: Exclude<GoodKind, 'food'> };

const KIND_PICS: Record<Exclude<GoodKind, 'food'>, string> = { fruit: '🍎🍌', veg: '🥕🥒', sweet: '🍭🍩', toy: '🧸🚗' };

const fits = (g: Good, c: Clue) => (c.type === 'color' ? g.color === c.v : g.kind === c.v);
const clueVoice = (c: Clue) => `hb_${c.v}`;

const ALL_CLUES: Clue[] = [
  ...(['red', 'yellow', 'green', 'orange', 'brown', 'blue', 'pink'] as GoodColor[]).map((v) => ({ type: 'color' as const, v })),
  ...(['fruit', 'veg', 'sweet', 'toy'] as const).map((v) => ({ type: 'kind' as const, v })),
];

function makeRound(prev?: Clue): { clue: Clue; shelf: Good[] } {
  const clues = shuffle(ALL_CLUES.filter((c) => !prev || c.type !== prev.type || c.v !== prev.v)
    .filter((c) => GOODS.filter((g) => fits(g, c)).length >= 3));
  const clue = clues[0];
  const yes = shuffle(GOODS.filter((g) => fits(g, clue))).slice(0, 3);
  const no = shuffle(GOODS.filter((g) => !fits(g, clue))).slice(0, SHELF - yes.length);
  return { clue, shelf: shuffle([...yes, ...no]) };
}

const ClueBubble: React.FC<{ clue: Clue; size: string }> = ({ clue, size }) => (
  <div className="relative rounded-full bg-white shadow-2xl border-4 border-white flex items-center justify-center animate-pop-in" style={{ width: size, height: size }}>
    {/* хвостик облачка — кружочки к герою */}
    <span className="absolute -left-[14%] bottom-[6%] w-[16%] h-[16%] rounded-full bg-white shadow" />
    <span className="absolute -left-[26%] bottom-[-4%] w-[9%] h-[9%] rounded-full bg-white shadow" />
    {clue.type === 'color' ? (
      <span className="rounded-full animate-[bob_1.6s_ease-in-out_infinite]" style={{
        width: '70%', height: '70%', background: `radial-gradient(circle at 35% 30%, #ffffffaa, transparent 40%), ${COLOR_HEX[clue.v]}`,
        boxShadow: `0 6px 0 rgba(0,0,0,.15)`, borderRadius: '46% 54% 50% 50% / 52% 46% 54% 48%' }} />
    ) : (
      <span className="leading-none animate-[bob_1.6s_ease-in-out_infinite]" style={{ fontSize: `calc(${size} * 0.32)` }}>{KIND_PICS[clue.v]}</span>
    )}
  </div>
);

export const ShopHeroesGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const [round, setRound] = useState(0);
  const [buyer, setBuyer] = useState<CharacterItem>(() => randomHero(CHARACTERS, character.id));
  const [{ clue, shelf }, setRoundData] = useState(() => makeRound());
  const [sold, setSold] = useState<Good | null>(null);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [sad, setSad] = useState(false);
  const [coins, setCoins] = useState(0);
  const [done, setDone] = useState(false);
  const shelfRef = useRef<HTMLDivElement>(null);
  const portrait = window.innerHeight > window.innerWidth * 1.15;

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      if (round === 0) say('hb_start', soundEnabled);
      playVoice(`hero_${buyer.id}`, soundEnabled);
      playVoice(clueVoice(clue), soundEnabled);
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, runKey]);

  const offer = (g: Good, el: HTMLElement) => {
    if (sold || done) return;
    if (!fits(g, clue)) {
      setWrong(g.id); setSad(true);
      soundEngine.playGamePop(soundEnabled, 0);
      playVoice('hb_wrong', soundEnabled, undefined, 'replace');
      playVoice(clueVoice(clue), soundEnabled);
      window.setTimeout(() => setWrong(null), 500);
      window.setTimeout(() => setSad(false), 1600);
      return;
    }
    setSad(false);
    setSold(g);
    setReaction(pickReaction('feed_favorite', buyer.id));
    const r = el.getBoundingClientRect();
    sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 14);
    soundEngine.playGameReward(soundEnabled);
    playVoice(`hb_yes_${1 + (round % 3)}`, soundEnabled, undefined, 'replace');
    window.setTimeout(() => { setCoins((c) => c + 1); soundEngine.playGamePop(soundEnabled, 6); }, 1400);
    window.setTimeout(() => whenVoiceIdle(() => window.setTimeout(() => {
      if (round + 1 >= ROUNDS) { setDone(true); say('hb_done', soundEnabled); return; }
      setRound(round + 1);
      setBuyer((b) => randomHero(CHARACTERS.filter((c) => c.id !== b.id), character.id));
      setRoundData(makeRound(clue));
      setSold(null); setReaction(null);
    }, 600)), 3600);
  };

  const restart = () => {
    setRound(0); setBuyer(randomHero(CHARACTERS, character.id)); setRoundData(makeRound());
    setSold(null); setReaction(null); setCoins(0); setDone(false); setRunKey((k) => k + 1);
  };

  const hintOn = useStepHint(`${round}-${wrong ?? ''}`, 4500, 9000, !sold && !done);

  if (done) {
    return (
      <CookScreen stepKey="done" stepIdx={ROUNDS} total={ROUNDS} done={false} bg="linear-gradient(#FEF3C7, #FDE68A)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="text-[min(9vmin,64px)]">{'🪙'.repeat(coins)}</div>
        </Celebrate>
      </CookScreen>
    );
  }

  const HERO = portrait ? 'min(42vw, 230px)' : 'min(34vmin, 270px)';
  const IMG = portrait ? 'min(15vw, 84px)' : 'min(11vmin, 86px)';

  return (
    <CookScreen stepKey={`r${round}`} stepIdx={round} total={ROUNDS} done={false}
      bg="linear-gradient(#E0F2FE 0%, #FEF3C7 58%, #D97706 58%, #B45309 100%)">
      <div className={`w-full h-full flex ${portrait ? 'flex-col' : 'flex-row'} items-center justify-center gap-[3vmin] px-[2vmin] pb-[2vmin]`}>
        {/* покупатель у прилавка и его желание в облачке */}
        <div className="relative shrink-0 flex items-end">
          <div className="relative rounded-full overflow-hidden border-[6px] border-white shadow-2xl" style={{ width: HERO, height: HERO, background: buyer.accentBg }}>
            {sold && reaction
              ? <ReactionHero character={buyer} reaction={reaction} runKey={`hb-${round}`} />
              : <HeroFace hero={buyer} emotion={sad ? 'sad' : 'curious'} size="100%" className="!border-0 !shadow-none animate-pop-in" />}
          </div>
          {!sold && (
            <div className={`absolute ${portrait ? '-top-[8%] -right-[48%]' : '-top-[46%] left-[46%]'}`}><ClueBubble clue={clue} size={portrait ? 'min(26vw, 130px)' : 'min(18vmin, 140px)'} /></div>
          )}
          {sold && (
            <img src={sold.src} alt="" className="absolute -right-[18%] bottom-[2%] object-contain drop-shadow-xl animate-pop-in" style={{ width: `calc(${HERO} * 0.42)` }} />
          )}
          {/* касса: монетки за покупки */}
          <div className="absolute -bottom-[6%] -left-[10%] rounded-2xl bg-[#334155] shadow-xl px-[1vmin] py-[0.6vmin] flex items-center gap-[0.4vmin]">
            <span className="text-[min(5vmin,34px)]">🧾</span>
            {Array.from({ length: coins }).map((_, i) => <span key={i} className="text-[min(4.5vmin,30px)] animate-pop-in">🪙</span>)}
          </div>
        </div>

        {/* витрина */}
        <div ref={shelfRef} className="rounded-[1.6rem] p-[1.4vmin] shadow-2xl" style={{ background: 'linear-gradient(#FDE68A, #FBBF24)' }}>
          <div className={`grid ${portrait ? 'grid-cols-4' : 'grid-cols-5'} gap-[1.2vmin]`}>
            {shelf.map((g) => {
              const gone = sold?.id === g.id;
              return (
                <button key={g.id} type="button" aria-label={g.name} onClick={(e) => offer(g, e.currentTarget)} disabled={!!sold}
                  className={`rounded-2xl bg-white/90 shadow flex items-center justify-center p-[0.8vmin] active:scale-90 transition-all ${wrong === g.id ? 'animate-[wiggle_0.4s]' : ''}`}
                  style={{ opacity: gone ? 0.15 : 1, borderBottom: '6px solid #D97706' }}>
                  <img src={g.src} alt="" draggable={false} className="object-contain pointer-events-none" style={{ width: IMG, height: IMG }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <GestureHint show={hintOn} kind="tap" target={shelfRef} />
    </CookScreen>
  );
};
