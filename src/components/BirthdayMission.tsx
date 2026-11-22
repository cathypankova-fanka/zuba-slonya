import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { hasReactionAnim, reactionAnimUrl } from '../data/reactionAssets';
import { soundEngine } from '../utils/soundEngine';
import { useBlow } from '../utils/useBlow';
import { playVoice, sayRandom } from '../utils/voice';
import { usePhoto } from './ArtKit';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { BlowBadge, HeroFace, randomHero, say, useHold, useSteps } from './PlayKit';

/**
 * День рождения друга: украсить комнату флажками → надуть шарики (держать или подуть) →
 * поставить на торт столько свечек, сколько лет (считаем вслух), задуть → выбрать и вручить подарок → праздник, фото.
 */

const STEPS = ['decor', 'balloons', 'cake', 'gift', 'party'] as const;
const VOICES = { decor: 'bd_start', balloons: 'bd_balloons', cake: 'bd_candles', gift: 'bd_gift', party: 'bd_party' };
const PT = (n: string) => `/assets/items/party/${n}.webp`;
const BALLOONS = ['red', 'blue', 'yellow'] as const;
const GIFTS = ['gift_red', 'gift_blue', 'gift_green'];

export const BirthdayMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [round, setRound] = useState(0);
  const friend = useMemo(() => randomHero(CHARACTERS, character.id), [round, character.id]);
  const age = useMemo(() => 3 + Math.floor(Math.random() * 4), [round]);
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [flags, setFlags] = useState(0);
  const [bIdx, setBIdx] = useState(0);
  const [bSize, setBSize] = useState(0);
  const [candles, setCandles] = useState(0);
  const [lit, setLit] = useState(false);
  const [blown, setBlown] = useState(false);
  const [gift, setGift] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);
  const balloonRef = useRef<HTMLButtonElement>(null);
  const cakeRef = useRef<HTMLButtonElement>(null);
  const blowRef = useRef<HTMLButtonElement>(null);
  const friendRef = useRef<HTMLDivElement>(null);
  const flagPlate = useRef<HTMLButtonElement | null>(null);
  const giftPlate = useRef<HTMLButtonElement | null>(null);
  const photoRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const photo = usePhoto(soundEnabled);

  // в начале: «Сегодня день рождения у …!»
  useEffect(() => {
    const t = window.setTimeout(() => playVoice(`hero_${friend.id}`, soundEnabled), 2600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  useEffect(() => { finished.current = false; }, [step]);
  useEffect(() => {
    if (step === 'cake') window.setTimeout(() => playVoice(`d_${age}`, soundEnabled), 400);
    if (step === 'party') { soundEngine.playCakeBirthdaySong?.(soundEnabled); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  useEffect(() => {
    if (!photo.taken) return;
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 1200);
    return () => window.clearTimeout(t);
  }, [photo.taken, soundEnabled]);

  // 1) флажки
  const hangFlag = () => {
    if (step !== 'decor' || doneFx || flags >= 3) return;
    soundEngine.playCakePlace?.(soundEnabled);
    const n = flags + 1; setFlags(n);
    if (n >= 3) { finished.current = true; window.setTimeout(() => next(), 600); }
  };

  // 2) шарики: держать палец на шарике или дуть в микрофон
  const inflate = (amount: number) => {
    if (step !== 'balloons' || doneFx || finished.current) return;
    setBSize((v) => {
      const n = Math.min(1, v + amount);
      if (Math.floor(n * 6) !== Math.floor(v * 6)) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(n * 6));
      if (n >= 1 && v < 1) {
        soundEngine.playGameOk(soundEnabled);
        window.setTimeout(() => {
          setBIdx((i) => {
            const ni = i + 1;
            if (ni >= BALLOONS.length) { finished.current = true; next(); }
            return ni;
          });
          setBSize(0);
        }, 450);
      }
      return n;
    });
  };
  const hold = useHold(step === 'balloons' && !doneFx, (dt) => inflate(dt * 0.55));
  const mic = useBlow((step === 'balloons' || (step === 'cake' && lit && !blown)) && !doneFx, (lv) => {
    if (step === 'balloons') inflate(lv * 0.03);
    else blowOut(lv * 0.06);
  });

  // 3) торт: свечки по числу лет, считаем вслух, потом задуваем
  const blowAcc = useRef(0);
  const addCandle = () => {
    if (step !== 'cake' || doneFx || lit || candles >= age) return;
    const n = candles + 1; setCandles(n);
    soundEngine.playGamePop(soundEnabled, 3 + n);
    playVoice(`d_${n}`, soundEnabled, undefined, 'replace');
    if (n >= age) window.setTimeout(() => { setLit(true); soundEngine.playGamePop(soundEnabled, 9); say('bd_blow', soundEnabled); }, 900);
  };
  const blowOut = (amount: number) => {
    if (!lit || blown) return;
    blowAcc.current += amount;
    if (blowAcc.current < 1) return;
    setBlown(true); soundEngine.playGameReward(soundEnabled);
    window.setTimeout(() => next(), 1400);
  };

  // 4) подарок
  const openedRef = useRef(false);
  const giveGift = (g: string | null = gift) => {
    if (step !== 'gift' || !g || opened || openedRef.current) return;
    openedRef.current = true;
    if (g !== gift) setGift(g);
    setOpened(true);
    soundEngine.playGameReward(soundEnabled);
    window.setTimeout(() => { finished.current = true; next(); }, 2400);
  };

  const restart = () => {
    setFlags(0); setBIdx(0); setBSize(0); setCandles(0); setLit(false); setBlown(false); setGift(null); setOpened(false);
    blowAcc.current = 0; openedRef.current = false; photo.reset(); setRound((r) => r + 1); restartSteps();
  };

  const hintOn = useStepHint(`${step}-${candles}-${lit}-${gift}`, 2600, 8000, !doneFx && !photo.taken && !opened);
  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = roomRef;
  let from: React.RefObject<Element | null> | undefined;
  if (step === 'decor') { hintKind = 'drag'; from = flagPlate; }
  if (step === 'balloons') { hintKind = 'hold'; hintTarget = balloonRef; }
  if (step === 'cake') { hintTarget = lit ? blowRef : cakeRef; }
  if (step === 'gift') { if (gift) { hintKind = 'drag'; hintTarget = friendRef; from = giftPlate; } else { hintTarget = giftPlate; } }
  if (step === 'party') { hintTarget = photoRef; }

  const tray = step === 'decor'
    ? [<Plate key="flag" src={PT('bunting')} label="" plateRef={(el) => { flagPlate.current = el; }} onPick={hangFlag} target={roomRef} onDrop={hangFlag} />]
    : step === 'gift'
      ? GIFTS.map((g, i) => <Plate key={g} src={PT(g)} label="" selected={gift === g} plateRef={(el) => { if (gift ? gift === g : i === 0) giftPlate.current = el; }}
          onPick={() => { if (!gift || gift !== g) { setGift(g); soundEngine.playGamePop(soundEnabled, 6); } else giveGift(g); }} target={friendRef} onDrop={() => giveGift(g)} />)
      : undefined;

  const done = BALLOONS.slice(0, bIdx);
  const friendSize = step === 'party' ? 'min(30vh, 260px, 42vw)' : 'min(20vh, 170px, 38vw)';
  const dance = step === 'party' && hasReactionAnim(friend.id, 'dance') ? reactionAnimUrl(friend.id, 'dance') : null;
  const partyHat = <img src="/assets/items/accessories/party_hat.webp" alt="" className="absolute left-1/2 -translate-x-1/2 -top-[26%] w-[42%] pointer-events-none z-10" />;

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} tray={tray}
      bg="linear-gradient(#FDF2F8 0%, #FCE7F3 60%, #F9A8D4 60%, #F472B6 100%)">
      <div ref={roomRef} className="relative w-full h-full flex items-center justify-center">
        {/* флажки под потолком */}
        <div className="absolute top-[1vmin] left-[8%] right-[8%] flex justify-around pointer-events-none">
          {Array.from({ length: flags }).map((_, k) => <img key={k} src={PT('bunting')} alt="" className="w-[30%] animate-pop-in" style={{ transform: `rotate(${k % 2 ? 3 : -3}deg)` }} />)}
        </div>
        {/* надутые шарики */}
        <div className="absolute top-[7vmin] left-[2vmin] flex gap-[1vmin] pointer-events-none">
          {done.map((b, k) => <img key={k} src={PT(`balloon_${b}`)} alt="" className="w-[9vmin] animate-[bob_2s_ease-in-out_infinite]" style={{ animationDelay: `${k * 0.3}s` }} />)}
        </div>

        <div className="flex items-end gap-[5vmin]">
          {/* именинник */}
          <div ref={friendRef} className="relative flex flex-col items-center">
            <div className={`relative ${step === 'party' && !photo.taken ? 'animate-[bob_1.2s_ease-in-out_infinite]' : ''}`}>
              {dance
                ? <div className="rounded-full overflow-hidden border-[6px] border-white shadow-2xl" style={{ width: friendSize, height: friendSize, background: friend.accentBg }}><img src={dance} alt="" className="w-full h-full object-cover" /></div>
                : <HeroFace hero={friend} emotion={opened || blown || step === 'party' ? 'joy' : 'curious'} size={friendSize} />}
              {partyHat}
            </div>
            <div className="mt-[1vmin] rounded-full bg-white shadow px-[2vmin] py-[0.4vmin] text-[4vmin]">🎂 {age}</div>
          </div>

          {step === 'decor' && <div className="text-[14vmin] animate-bounce pointer-events-none">🎉</div>}

          {step === 'balloons' && bIdx < BALLOONS.length && (
            <button ref={balloonRef} type="button" aria-label="Шарик" {...hold.bind}
              className="relative flex items-end justify-center" style={{ ...hold.bind.style, width: 'min(34vmin, 290px)', height: 'min(44vmin, 380px)' }}>
              <img src={bSize < 0.08 ? PT('balloon_flat') : PT(`balloon_${BALLOONS[bIdx]}`)} alt="" draggable={false}
                className="pointer-events-none transition-all duration-100" style={{ width: bSize < 0.08 ? '70%' : `${30 + bSize * 70}%` }} />
              {hold.holding && <span className="absolute -bottom-[2vmin] text-[7vmin] pointer-events-none">💨</span>}
            </button>
          )}

          {step === 'cake' && (
            <div className="flex flex-col items-center gap-[1.5vmin]">
              <div className="flex gap-[1vmin]">
                {Array.from({ length: age }).map((_, k) => <span key={k} className={`w-[3.6vmin] h-[3.6vmin] rounded-full border-4 border-white ${k < candles ? 'bg-[#22C55E]' : 'bg-white/60'}`} />)}
              </div>
              <button ref={cakeRef} type="button" aria-label="Торт" onClick={addCandle} className="relative" style={{ width: 'min(40vmin, 340px)' }}>
                <img src="/assets/cake/cakes/pink.webp" alt="" draggable={false} className="w-full pointer-events-none drop-shadow-xl" />
                <div className="absolute left-[18%] right-[18%] top-[2%] flex justify-around items-end pointer-events-none">
                  {Array.from({ length: candles }).map((_, k) => (
                    <div key={k} className="relative flex flex-col items-center animate-pop-in">
                      {lit && !blown && <span className="text-[4.5vmin] leading-none animate-pulse" style={{ transform: `skewX(${-mic.level * 30}deg)` }}>🔥</span>}
                      {blown && <span className="text-[3.5vmin] leading-none opacity-70">💨</span>}
                      <div className="w-[1.8vmin] h-[8vmin] rounded-sm" style={{ background: `repeating-linear-gradient(45deg, ${['#F472B6', '#60A5FA', '#FACC15', '#34D399', '#A78BFA', '#FB923C'][k]} 0 6px, #fff 6px 12px)` }} />
                    </div>
                  ))}
                </div>
              </button>
              {lit && !blown && (
                <div className="flex items-center gap-[2vmin]">
                  <button ref={blowRef} type="button" aria-label="Задуть" onClick={() => blowOut(1)}
                    className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                    style={{ width: 'min(14vmin, 115px)', height: 'min(14vmin, 115px)', fontSize: 'min(8vmin, 66px)' }}>💨</button>
                  <BlowBadge status={mic.status} level={mic.level} />
                </div>
              )}
            </div>
          )}

          {step === 'gift' && (
            <button type="button" aria-label="Подарок" onClick={() => giveGift()} className="relative" style={{ width: 'min(30vmin, 250px)' }}>
              {opened
                ? <img src={PT('gift_open')} alt="" draggable={false} className="w-full animate-pop-in pointer-events-none" />
                : gift && <img src={PT(gift)} alt="" draggable={false} className="w-full pointer-events-none animate-[bob_1.2s_ease-in-out_infinite]" />}
              {opened && ['🎊', '🎉', '✨', '⭐'].map((e, k) => <span key={k} className="absolute text-[6vmin] r-fx pointer-events-none" style={{ left: `${10 + k * 25}%`, top: '10%', animationDelay: `${k * 0.15}s` }}>{e}</span>)}
            </button>
          )}

          {step === 'party' && (
            <div className="flex flex-col items-center gap-[2vmin]">
              <div className="flex items-end gap-[2vmin]">
                <div className="relative"><HeroFace hero={character} emotion="joy" size="min(18vh, 150px)" className={photo.taken ? '' : 'r-dance'} />{partyHat}</div>
                <img src={PT('cupcake')} alt="" className="w-[10vmin]" />
                <img src={PT('popper')} alt="" className="w-[12vmin] animate-bounce" />
              </div>
              {!photo.taken
                ? <button ref={photoRef} type="button" aria-label="Фото" onClick={() => { photo.shoot(); say('fm_photo', soundEnabled); }}
                    className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                    style={{ width: 'min(14vmin, 112px)', height: 'min(14vmin, 112px)', fontSize: 'min(8vmin, 64px)' }}>📸</button>
                : <button type="button" aria-label="Ещё раз" onClick={restart}
                    className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>}
            </div>
          )}
        </div>
        {step === 'party' && ['🎈', '🎊', '🎉', '✨', '🎈', '⭐'].map((e, k) => (
          <span key={k} className="absolute text-[6vmin] animate-bounce pointer-events-none" style={{ left: `${8 + k * 16}%`, top: `${12 + (k % 2) * 8}%`, animationDelay: `${k * 0.2}s` }}>{e}</span>
        ))}
      </div>
      {photo.overlay}
      <GestureHint show={hintOn} kind={hintKind} target={hintTarget} from={from} />
    </CookScreen>
  );
};
