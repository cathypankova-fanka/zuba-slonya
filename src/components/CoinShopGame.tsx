import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import { CookScreen, GestureHint, Plate, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, P, say, shuffle } from './PlayKit';

/**
 * Магазин с монетками: ребёнок сам выбирает, что купить (на каждом товаре ценник с цифрой 1–5),
 * несёт покупку на кассу и отсчитывает столько монеток из кошелька — каждая монетка называется вслух.
 * Набралось ровно — «дзынь!», покупка в пакет. Три покупки — праздник.
 */

const GOODS: { id: string; name: string; src: string; price: number }[] = [
  { id: 'apple', name: 'Яблоко', src: P('apple'), price: 1 }, { id: 'banana', name: 'Банан', src: P('banana'), price: 1 },
  { id: 'strawberry', name: 'Клубника', src: P('strawberry'), price: 2 }, { id: 'grape', name: 'Виноград', src: P('grape'), price: 2 },
  { id: 'milk', name: 'Молоко', src: P('milk'), price: 3 }, { id: 'egg', name: 'Яйцо', src: P('egg'), price: 1 },
  { id: 'pineapple', name: 'Ананас', src: P('pineapple'), price: 4 }, { id: 'melon', name: 'Дыня', src: P('melon'), price: 5 },
  { id: 'popcorn', name: 'Попкорн', src: P('popcorn_bucket'), price: 3 }, { id: 'cookie', name: 'Печенье', src: P('cookie_zuba'), price: 2 },
  { id: 'teddy', name: 'Мишка', src: P('teddy_happy'), price: 5 }, { id: 'cup', name: 'Чашка', src: P('cup'), price: 2 },
  { id: 'umbrella', name: 'Зонтик', src: P('umb_rainbow'), price: 4 }, { id: 'boots', name: 'Сапожки', src: P('boots_yellow'), price: 4 },
  { id: 'book', name: 'Книжка', src: P('book'), price: 3 }, { id: 'cookie2', name: 'Печенье', src: P('cookie_hihi'), price: 2 },
];
const ROUNDS = 3;
const COIN = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='52' r='42' fill='#B45309'/><circle cx='50' cy='48' r='42' fill='#FACC15'/><circle cx='50' cy='48' r='33' fill='#FDE047' stroke='#EAB308' stroke-width='4'/><path d='M50 30l5.5 11.5 12.5 1.5-9.2 8.6 2.4 12.4L50 58l-11.2 6 2.4-12.4-9.2-8.6 12.5-1.5z' fill='#EAB308'/><ellipse cx='36' cy='30' rx='10' ry='5' fill='#fff' opacity='.55' transform='rotate(-30 36 30)'/></svg>`);

const PriceTag: React.FC<{ price: number; big?: boolean; filled?: number }> = ({ price, big, filled = 0 }) => (
  <div className="flex flex-col items-center rounded-2xl bg-[#FEF9C3] border-[3px] border-[#EAB308] shadow-md px-[1.2vmin] py-[0.4vmin]"
    style={{ minWidth: big ? 'min(20vmin, 150px)' : undefined }}>
    <span className="font-black leading-none text-[#92400E]" style={{ fontSize: big ? 'min(16vmin, 120px)' : 'min(6vmin, 40px)' }}>{price}</span>
    <span className="flex gap-[0.5vmin] mt-[0.3vmin]">
      {Array.from({ length: price }).map((_, i) => (
        <span key={i} className="rounded-full border-2 border-[#B45309] transition-colors" style={{
          width: big ? 'min(4.5vmin, 34px)' : 'min(1.8vmin, 13px)', height: big ? 'min(4.5vmin, 34px)' : 'min(1.8vmin, 13px)',
          background: i < filled ? '#FACC15' : 'rgba(255,255,255,.7)',
        }} />
      ))}
    </span>
  </div>
);

export const CoinShopGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const shelf = useMemo(() => shuffle(GOODS).slice(0, 8), [runKey]);
  const [phase, setPhase] = useState<'shop' | 'pay' | 'done'>('shop');
  const [item, setItem] = useState<(typeof GOODS)[number] | null>(null);
  const [paid, setPaid] = useState(0);
  const [bag, setBag] = useState<string[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const paidRef = useRef(0);
  const portrait = window.innerHeight > window.innerWidth * 1.15;

  useEffect(() => { say('cs_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [runKey]);

  const pick = (g: (typeof GOODS)[number], el?: HTMLElement | null) => {
    if (phase !== 'shop' || busy.current || bag.includes(g.id)) return;
    soundEngine.playGamePop(soundEnabled, 5);
    const r = el?.getBoundingClientRect();
    if (r) sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 8);
    setItem(g); setPaid(0); paidRef.current = 0; setPhase('pay');
    // «Сколько стоит? …» и сразу цифра
    window.setTimeout(() => { say('cs_pay', soundEnabled); playVoice(`d_${g.price}`, soundEnabled); }, 250);
  };

  const addCoin = () => {
    if (phase !== 'pay' || !item || busy.current) return;
    if (paidRef.current >= item.price) return;
    const n = ++paidRef.current;
    setPaid(n);
    soundEngine.playGamePop(soundEnabled, 3 + n);
    playVoice(`d_${n}`, soundEnabled, undefined, 'replace');
    if (n === item.price) {
      busy.current = true;
      window.setTimeout(() => {
        soundEngine.playGameReward(soundEnabled);
        const r = counterRef.current?.getBoundingClientRect();
        if (r) sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
        say('cs_paid', soundEnabled);
      }, 600);
      window.setTimeout(() => {
        const nb = [...bag, item.id];
        setBag(nb); setItem(null); busy.current = false;
        if (nb.length >= ROUNDS) { setPhase('done'); say('cs_bag', soundEnabled); } else { setPhase('shop'); say('cs_more', soundEnabled); }
      }, 2300);
    }
  };

  const restart = () => { setBag([]); setItem(null); setPhase('shop'); setPaid(0); paidRef.current = 0; setRunKey((k) => k + 1); };

  const hintOn = useStepHint(`${phase}-${paid}-${bag.length}`, 2600, 8000, phase !== 'done' && !busy.current);
  const tray = phase === 'pay'
    ? Array.from({ length: 6 }).map((_, i) => <Plate key={i} src={COIN} label="" onPick={addCoin} target={trayRef} onDrop={addCoin} />)
    : undefined;

  const bagView = (
    <div className="flex items-end gap-[0.6vmin] rounded-2xl bg-white/70 px-[1.2vmin] py-[0.6vmin] shadow">
      <span className="text-[min(7vmin,48px)] leading-none">🛍️</span>
      {bag.map((b) => <img key={b} src={GOODS.find((g) => g.id === b)!.src} alt="" className="w-[min(8vmin,56px)] h-[min(8vmin,56px)] object-contain animate-pop-in" />)}
      {Array.from({ length: ROUNDS - bag.length }).map((_, i) => <span key={i} className="w-[min(8vmin,56px)] h-[min(8vmin,56px)] rounded-xl border-2 border-dashed border-white/80" />)}
    </div>
  );

  if (phase === 'done') {
    return (
      <CookScreen stepKey="done" stepIdx={ROUNDS} total={ROUNDS} done={false} bg="linear-gradient(#FEF3C7, #FDE68A)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="flex gap-[2vmin]">{bag.map((b) => <img key={b} src={GOODS.find((g) => g.id === b)!.src} alt="" className="w-[min(16vmin,120px)] h-[min(16vmin,120px)] object-contain animate-pop-in" />)}</div>
        </Celebrate>
      </CookScreen>
    );
  }

  return (
    <CookScreen stepKey={phase + bag.length} stepIdx={bag.length} total={ROUNDS} done={false} tray={tray}
      bg="linear-gradient(#FFF7ED 0%, #FFEDD5 55%, #FDBA74 55%, #FB923C 100%)">
      <div className="flex flex-col items-center gap-[2vmin] w-full">
        <div className="flex items-center gap-[2vmin]">
          <HeroFace hero={character} emotion={phase === 'pay' && item && paid === item.price ? 'joy' : 'curious'} size="min(16vmin, 120px)" />
          {bagView}
        </div>

        {phase === 'shop' && (
          // полка с товарами: можно взять любой
          <div ref={shelfRef} className="rounded-[2rem] p-[2vmin] shadow-2xl" style={{ background: 'linear-gradient(#A16207, #854D0E)', width: portrait ? 'min(94vw, 560px)' : 'min(110vmin, 820px)' }}>
            <div className={`grid ${portrait ? 'grid-cols-4' : 'grid-cols-4'} gap-[1.6vmin]`}>
              {shelf.map((g) => {
                const sold = bag.includes(g.id);
                return (
                  <button key={g.id} type="button" aria-label={g.name} disabled={sold} onClick={(e) => pick(g, e.currentTarget)}
                    className="relative rounded-2xl bg-[#FEF3C7] shadow-inner flex flex-col items-center justify-end pt-[1vmin] pb-[0.6vmin] active:scale-95 transition-transform"
                    style={{ opacity: sold ? 0.3 : 1, borderBottom: '6px solid #713F12' }}>
                    <img src={g.src} alt="" draggable={false} className="w-[80%] object-contain pointer-events-none" style={{ height: portrait ? 'min(16vw, 90px)' : 'min(13vmin, 100px)' }} />
                    <div className="-mt-[0.5vmin]"><PriceTag price={g.price} /></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'pay' && item && (
          <div className="flex flex-col items-center gap-[2vmin]">
            <div ref={counterRef} className="flex items-center gap-[3vmin] rounded-[2rem] bg-white/80 shadow-xl px-[3vmin] py-[2vmin]">
              <img src={item.src} alt="" className="w-[min(24vmin,180px)] h-[min(24vmin,180px)] object-contain animate-pop-in" />
              <PriceTag price={item.price} big filled={paid} />
            </div>
            {/* лоток для монеток на кассе */}
            <div ref={trayRef} className="relative rounded-[1.6rem] flex items-center justify-center gap-[1vmin] flex-wrap"
              style={{ width: 'min(70vmin, 520px)', minHeight: 'min(20vmin, 150px)', background: 'linear-gradient(#475569, #334155)', boxShadow: 'inset 0 6px 14px rgba(0,0,0,.45)' }}>
              {Array.from({ length: paid }).map((_, i) => (
                <img key={i} src={COIN} alt="" className="w-[min(12vmin,90px)] animate-pop-in" style={{ animationDuration: '.3s' }} />
              ))}
              {paid > 0 && <span className="absolute -top-[5vmin] right-[2vmin] font-black text-white drop-shadow text-[min(9vmin,64px)]" key={paid}>{paid}</span>}
              {paid === 0 && <span className="text-white/60 text-[min(5vmin,32px)]">🪙 → </span>}
            </div>
          </div>
        )}
      </div>
      <GestureHint show={hintOn} kind="tap" target={phase === 'pay' ? trayRef : shelfRef} />
    </CookScreen>
  );
};
