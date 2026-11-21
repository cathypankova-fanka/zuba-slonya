import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { HeroFace, randomHero, say, shuffle } from './PlayKit';

/**
 * Магазин теней: покупатель показывает в облачке тени того, что хочет купить → ребёнок находит это на витрине
 * и кладёт в корзинку → покупатель платит: телефончик с карточкой прикладываем к терминалу → «пик!», чек, пакет.
 * 3 покупателя: 1, 2 и 3 покупки.
 */

const A = (n: string) => `/assets/items/accessories/${n}.webp`;
const PL = (n: string) => `/assets/items/play/${n}.webp`;
const GOODS = [
  { id: 'apple', src: PL('apple') }, { id: 'banana', src: PL('banana') }, { id: 'strawberry', src: PL('strawberry') },
  { id: 'pineapple', src: PL('pineapple') }, { id: 'milk', src: PL('milk') }, { id: 'egg', src: PL('egg') },
  { id: 'grape', src: PL('grape') }, { id: 'popcorn', src: PL('popcorn_bucket') }, { id: 'cookie', src: PL('cookie_heart') },
  { id: 'teddy', src: PL('teddy_happy') }, { id: 'cup', src: PL('cup') }, { id: 'can', src: PL('watering_can') },
  { id: 'duck', src: A('duckling') }, { id: 'car', src: A('car') }, { id: 'train', src: A('train') },
  { id: 'balloon', src: A('balloon') }, { id: 'rocket', src: A('rocket') }, { id: 'boat', src: A('sailboat') },
  { id: 'drum', src: A('drum') }, { id: 'guitar', src: A('guitar') }, { id: 'ball', src: A('soccer_ball') },
  { id: 'umbrella', src: A('umbrella_sticker') }, { id: 'crown', src: A('crown') }, { id: 'hat', src: A('sun_hat') },
  { id: 'icecream', src: A('icecream') }, { id: 'lollipop', src: A('lollipop') }, { id: 'camera', src: A('camera') },
  { id: 'bike', src: A('bicycle') }, { id: 'gift', src: A('gift') },
];
type Good = (typeof GOODS)[number];
const SHELF = 8;
const ROUNDS = 3;

type Phase = 'arrive' | 'find' | 'pay' | 'paid' | 'done';

const PhoneSvg: React.FC = () => (
  <svg viewBox="0 0 80 140" className="w-full h-full pointer-events-none">
    <rect x="3" y="3" width="74" height="134" rx="14" fill="#1F2937" />
    <rect x="9" y="14" width="62" height="108" rx="6" fill="#E0F2FE" />
    <rect x="15" y="40" width="50" height="32" rx="5" fill="#F59E0B" />
    <rect x="15" y="40" width="50" height="8" fill="#B45309" />
    <rect x="20" y="54" width="10" height="8" rx="2" fill="#FDE68A" />
    {[0, 1, 2, 3].map((k) => <circle key={k} cx={36 + k * 7} cy={66} r="2" fill="#FFF7ED" />)}
    <path d="M30 88 q10 -8 20 0 M34 94 q6 -5 12 0" stroke="#0EA5E9" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="30" y="7" width="20" height="3" rx="1.5" fill="#4B5563" />
  </svg>
);

const Terminal: React.FC<{ paid: boolean; waves: boolean; amount: number }> = ({ paid, waves, amount }) => (
  <svg viewBox="0 0 120 170" className="w-full h-full pointer-events-none">
    <rect x="10" y="10" width="100" height="150" rx="16" fill="#334155" />
    <rect x="20" y="22" width="80" height="46" rx="6" fill={paid ? '#22C55E' : '#0F172A'} />
    {paid
      ? <path d="M42 46 l12 12 l24 -24" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      : <g>{Array.from({ length: amount }).map((_, k) => <circle key={k} cx={60 - (amount - 1) * 9 + k * 18} cy={45} r="7" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />)}</g>}
    {/* значок бесконтактной оплаты */}
    <g transform="translate(60 112)" stroke={waves ? '#38BDF8' : '#94A3B8'} strokeWidth="5" fill="none" strokeLinecap="round">
      <path d="M-14 -16 q10 16 0 32" /><path d="M-2 -24 q14 24 0 48" /><path d="M10 -32 q18 32 0 64" />
    </g>
  </svg>
);

export const ShopMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [round, setRound] = useState(0);
  const [game, setGame] = useState(0);
  const [phase, setPhase] = useState<Phase>('arrive');
  const [buyer, setBuyer] = useState<CharacterItem>(() => randomHero(CHARACTERS, character.id));
  const [wants, setWants] = useState<Good[]>([]);
  const [shelf, setShelf] = useState<Good[]>([]);
  const [got, setGot] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mood, setMood] = useState<'wait' | 'no' | 'yes'>('wait');
  const [phone, setPhone] = useState<{ x: number; y: number } | null>(null);
  const [near, setNear] = useState(false);
  const basketRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLElement | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const holdT = useRef<number | null>(null);

  // новый покупатель
  useEffect(() => {
    const n = round + 1;
    const pool = shuffle(GOODS);
    const w = pool.slice(0, n);
    setWants(w);
    setShelf(shuffle([...w, ...pool.slice(n, SHELF)]));
    setGot([]); setMood('wait'); setPhone(null); setNear(false);
    setPhase('arrive');
    soundEngine.playGamePop(soundEnabled, 9); window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 7), 150); // дзынь колокольчик
    const t1 = window.setTimeout(() => playVoice(`hero_${buyer.id}`, soundEnabled, undefined, 'replace'), 400);
    const t2 = window.setTimeout(() => whenVoiceIdle(() => { setPhase('find'); say(round === 0 && game === 0 ? 'sh_find' : 'sh_next', soundEnabled); }), 1400);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, game]);

  const pick = (g: Good) => {
    if (phase !== 'find' || got.includes(g.id)) return;
    if (!wants.some((w) => w.id === g.id)) {
      soundEngine.playGameFail(soundEnabled);
      say('sh_wrong', soundEnabled);
      setWrong(g.id); setMood('no');
      window.setTimeout(() => { setWrong(null); setMood('wait'); }, 900);
      return;
    }
    soundEngine.playGameOk(soundEnabled);
    const n = [...got, g.id];
    setGot(n); setMood('yes');
    window.setTimeout(() => setMood('wait'), 700);
    if (n.length === wants.length) {
      window.setTimeout(() => { setPhase('pay'); say('sh_pay', soundEnabled); }, 700);
    } else say('sh_ok', soundEnabled);
  };

  const pay = () => {
    if (phase !== 'pay') return;
    if (holdT.current) window.clearTimeout(holdT.current);
    setPhase('paid'); setNear(false);
    soundEngine.playGamePop(soundEnabled, 10);
    window.setTimeout(() => soundEngine.playGameReward(soundEnabled), 200);
    say('sh_paid', soundEnabled);
    window.setTimeout(() => whenVoiceIdle(() => window.setTimeout(() => {
      if (round + 1 >= ROUNDS) { setPhase('done'); window.setTimeout(() => sayRandom('win', 6, soundEnabled), 600); return; }
      setBuyer((b) => randomHero(CHARACTERS.filter((c) => c.id !== b.id), character.id));
      setRound((r) => r + 1);
    }, 600)), 1200);
  };

  // телефончик: тащим к терминалу, держим рядом — «пик!». Простое нажатие — телефон сам летит к терминалу.
  const overTerm = (cx: number, cy: number) => {
    const r = termRef.current?.getBoundingClientRect();
    return !!r && cx > r.left - 30 && cx < r.right + 30 && cy > r.top - 30 && cy < r.bottom + 30;
  };
  const phoneDown = (e: React.PointerEvent) => {
    if (phase !== 'pay') return;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const r = phoneRef.current!.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (drag.current as { sx?: number; sy?: number }).sx = e.clientX; (drag.current as { sx?: number; sy?: number }).sy = e.clientY;
  };
  const phoneMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || phase !== 'pay') return;
    setPhone({ x: e.clientX - d.dx, y: e.clientY - d.dy });
    const r = phoneRef.current!.getBoundingClientRect();
    const isNear = overTerm(r.left + r.width / 2, r.top + r.height / 2);
    if (isNear !== near) {
      setNear(isNear);
      if (isNear) { soundEngine.playGamePop(soundEnabled, 6); holdT.current = window.setTimeout(pay, 650); }
      else if (holdT.current) window.clearTimeout(holdT.current);
    }
  };
  const phoneUp = (e: React.PointerEvent) => {
    const d = drag.current as ({ sx?: number; sy?: number } & { dx: number; dy: number }) | null; drag.current = null;
    if (!d || phase !== 'pay') return;
    if (Math.hypot(e.clientX - (d.sx ?? 0), e.clientY - (d.sy ?? 0)) < 10) {
      // нажали: телефон сам подлетает к терминалу
      const t = termRef.current!.getBoundingClientRect(), p = phoneRef.current!.getBoundingClientRect();
      setPhone({ x: t.left + t.width / 2 - p.width / 2, y: t.top + t.height * 0.45 - p.height / 2 });
      setNear(true); soundEngine.playGamePop(soundEnabled, 6);
      holdT.current = window.setTimeout(pay, 800);
      return;
    }
    if (!near) setPhone(null); // не донесли — телефон возвращается
  };

  const restart = () => { setGame((g) => g + 1); setRound(0); setBuyer(randomHero(CHARACTERS, character.id)); };

  const want = wants.find((w) => !got.includes(w.id));
  hintFrom.current = want ? plateEls.current[want.id] ?? null : null;
  const hintOn = useStepHint(`${phase}-${got.length}-${round}`, 3000, 8000, phase === 'find' || phase === 'pay');
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = basketRef;
  let from: React.RefObject<Element | null> | undefined = hintFrom;
  if (phase === 'pay') { hintTarget = termRef; from = phoneRef; }

  // телефон вертикально: покупатель сверху, витрина под ним, всё крупнее
  const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth * 1.2;
  const S = portrait ? 'min(30vw, 220px)' : 'min(26vh, 220px)';
  const PLATE = portrait ? 'min(19vw, 132px)' : 'min(15.5vmin, 132px)';
  const WANT = portrait ? 'min(17vw, 120px)' : 'min(14vmin, 120px)';
  const inBasket = useMemo(() => wants.filter((w) => got.includes(w.id)), [wants, got]);

  return (
    <CookScreen stepKey={phase === 'done' ? 'done' : `r${round}`} stepIdx={round} total={ROUNDS} done={phase === 'paid'}
      bg="linear-gradient(#FDF2F8 0%, #FFF7ED 58%, #D6A36B 58%, #B9824A 100%)">
      {phase !== 'done' ? (
        <div className={`relative w-full h-full flex items-center justify-center px-[2vmin] ${portrait ? 'flex-col-reverse gap-[12vw]' : 'gap-[3vmin]'}`}>
          {/* покупатель, облачко с тенями, корзинка */}
          <div className="flex flex-col items-center gap-[1.5vmin]">
            <div className="flex items-start gap-[1.5vmin]">
              <div className={`animate-pop-in ${mood === 'no' ? 'animate-[wiggle_0.4s]' : mood === 'yes' ? 'r-hop' : ''}`}>
                <HeroFace hero={buyer} size={S} emotion={mood === 'no' ? 'sad' : phase === 'paid' || mood === 'yes' ? 'joy' : 'curious'} />
              </div>
              {(phase === 'find' || phase === 'pay' || phase === 'paid') && (
                <div className="relative bg-white rounded-[2rem] shadow-xl px-[1.6vmin] py-[1.2vmin] flex gap-[1.2vmin] animate-pop-in">
                  <span className="absolute -left-3 top-[40%] w-6 h-6 bg-white rotate-45" />
                  {wants.map((w) => {
                    const ok = got.includes(w.id);
                    return (
                      <div key={w.id} className="relative" style={{ width: WANT, height: WANT }}>
                        <img src={w.src} alt="" draggable={false} className="w-full h-full object-contain transition-all duration-500"
                          style={{ filter: ok ? 'none' : 'brightness(0) opacity(0.75)' }} />
                        {ok && <span className="absolute -right-1 -bottom-1 text-[4vmin]">✅</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* прилавок: корзинка и терминал */}
            <div className="flex items-end gap-[3vmin]">
              <div ref={basketRef} className="relative flex items-end justify-center" style={{ width: 'min(30vmin, 250px)', height: 'min(20vmin, 170px)' }}>
                <div className="absolute inset-x-0 bottom-0 h-[62%] rounded-b-[2.5rem] rounded-t-lg" style={{ background: 'repeating-linear-gradient(45deg,#D97706 0 10px,#B45309 10px 20px)', boxShadow: '0 10px 16px rgba(0,0,0,.25)' }} />
                <div className="absolute left-[12%] right-[12%] top-0 h-[55%] rounded-t-full border-[8px] border-b-0 border-[#92400E]" />
                <div className="relative z-10 flex -space-x-[3vmin] pb-[30%]">
                  {inBasket.map((g) => <img key={g.id} src={g.src} alt="" className="animate-pop-in object-contain" style={{ width: 'min(11vmin, 92px)' }} />)}
                </div>
              </div>
              {(phase === 'pay' || phase === 'paid') && (
                <div ref={termRef} className="relative animate-pop-in" style={portrait ? { width: '20vw', height: '28vw' } : { width: 'min(15vmin, 128px)', height: 'min(21vmin, 182px)' }}>
                  <Terminal paid={phase === 'paid'} waves={near || phase === 'paid'} amount={wants.length} />
                  {phase === 'paid' && (
                    <div className="absolute left-[18%] right-[18%] top-[96%] bg-white rounded-b-md shadow-md overflow-hidden" style={{ animation: 'receipt 1s ease-out forwards' }}>
                      {[0, 1, 2].map((k) => <div key={k} className="h-[0.6vmin] bg-[#CBD5E1] rounded mx-[10%] my-[1vmin]" />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* витрина */}
          <div className="relative rounded-[2rem] p-[1.6vmin] shadow-2xl" style={{ background: 'linear-gradient(#FDE68A,#FCD34D)', border: '10px solid #B45309' }}>
            <div className="absolute -top-[7vmin] left-1/2 -translate-x-1/2 px-[4vmin] py-[0.8vmin] rounded-t-[2rem] text-[6vmin] shadow-lg" style={{ background: 'repeating-linear-gradient(90deg,#EF4444 0 4vmin,#FFFFFF 4vmin 8vmin)' }}>🛒</div>
            <div className="grid grid-cols-4 gap-[1.4vmin]">
              {shelf.map((g) => (
                <div key={g.id} className={got.includes(g.id) ? 'opacity-25 pointer-events-none' : ''}>
                  <Plate src={g.src} label="" size={PLATE} wrong={wrong === g.id}
                    plateRef={(el) => { plateEls.current[g.id] = el; }}
                    onPick={() => pick(g)} target={basketRef} onDrop={() => pick(g)} />
                </div>
              ))}
            </div>
            {/* полки */}
            <div className="absolute left-0 right-0 top-1/2 h-[1.2vmin] bg-[#B45309]/70 pointer-events-none" />
          </div>

          {/* телефончик с карточкой */}
          {(phase === 'pay' || phase === 'paid') && (
            <div ref={phoneRef} onPointerDown={phoneDown} onPointerMove={phoneMove} onPointerUp={phoneUp}
              className={`z-30 ${phone ? 'fixed' : `absolute animate-bounce ${portrait ? 'right-[8vw] bottom-[9vh]' : 'right-[3vmin] bottom-[2vmin]'}`} ${phase === 'paid' ? 'opacity-0 transition-opacity duration-700' : ''}`}
              style={{ width: portrait ? '15vw' : 'min(11vmin, 96px)', height: portrait ? '26vw' : 'min(19vmin, 168px)', touchAction: 'none', cursor: 'grab', transition: phone && !drag.current ? 'left .4s, top .4s' : undefined, ...(phone ? { left: phone.x, top: phone.y } : {}),
                filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.35))' }}>
              <PhoneSvg />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-[2vmin]">
          <div className="flex gap-[2vmin]">🛍️</div>
          <HeroFace hero={character} emotion="joy" size="min(32vh, 280px)" className="animate-[bob_1.2s_ease-in-out_infinite]" />
          <div className="text-[7vmin] animate-bounce">⭐⭐⭐</div>
          <button type="button" aria-label="Ещё раз" onClick={restart}
            className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
        </div>
      )}
      <GestureHint show={hintOn} kind={hintKind} target={hintTarget} from={from} itemSrc={phase === 'find' ? want?.src : undefined} />
    </CookScreen>
  );
};
