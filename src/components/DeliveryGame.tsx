import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { GOODS, Good } from '../data/shopGoods';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { CookScreen, GestureHint, NeedRow, Plate, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, randomHero, say, shuffle } from './PlayKit';
import { ReactionHero } from './ReactionHero';

/**
 * «Доставка»: собрать заказ героя в коробку → заклеить коробку скотчем (провести пальцем по 1–2 полоскам) → наклеить наклейку с портретом получателя →
 * довезти машинку до домика, в окошке которого этот герой (машинку можно тащить пальцем или нажать на домик) →
 * тук-тук, герой открывает посылку и радуется. Две посылки.
 */

const ROUNDS = 2;
type Phase = 'pack' | 'tape' | 'sticker' | 'drive' | 'arrive';
const STEPS: Phase[] = ['pack', 'tape', 'sticker', 'drive', 'arrive'];
type Strip = 'v' | 'h';
const BINS = 12;
const stripsFor = (round: number): Strip[] => (round === 0 ? ['v'] : ['v', 'h']);
const HOUSE_X = [0.34, 0.6, 0.86];
const HOUSE_COLORS = ['#FCA5A5', '#93C5FD', '#FDE68A'];

interface RoundData { to: CharacterItem; order: Good[]; tray: Good[]; stickers: CharacterItem[]; houses: CharacterItem[] }

function makeRound(exceptIds: string[]): RoundData {
  const to = randomHero(CHARACTERS.filter((c) => !exceptIds.includes(c.id)));
  const order = shuffle(GOODS).slice(0, 3);
  const tray = shuffle([...order, ...shuffle(GOODS.filter((g) => !order.includes(g))).slice(0, 3)]);
  const others = shuffle(CHARACTERS.filter((c) => c.id !== to.id)).slice(0, 2);
  return { to, order, tray, stickers: shuffle([to, ...others]), houses: shuffle([to, ...others]) };
}

const Truck: React.FC<{ withBox: boolean; face?: CharacterItem; w: string }> = ({ withBox, face, w }) => (
  <div className="relative" style={{ width: w, height: `calc(${w} * 0.62)` }}>
    <svg viewBox="0 0 160 100" className="absolute inset-0 w-full h-full drop-shadow-lg">
      <rect x="6" y="28" width="96" height="50" rx="8" fill="#F97316" />
      <rect x="6" y="28" width="96" height="10" rx="5" fill="#FDBA74" />
      <path d="M102 42h28l18 20v16h-46z" fill="#3B82F6" />
      <path d="M108 47h20l12 14h-32z" fill="#DBEAFE" />
      <rect x="140" y="68" width="10" height="6" rx="3" fill="#FDE047" />
      <circle cx="36" cy="82" r="13" fill="#1F2937" /><circle cx="36" cy="82" r="5" fill="#9CA3AF" />
      <circle cx="124" cy="82" r="13" fill="#1F2937" /><circle cx="124" cy="82" r="5" fill="#9CA3AF" />
    </svg>
    {withBox && (
      <div className="absolute rounded-md" style={{ left: '12%', bottom: '58%', width: '42%', height: '46%', background: 'linear-gradient(#D6A56A, #B7803F)', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,.15)' }}>
        <span className="absolute left-0 right-0 top-[40%] h-[18%] bg-[#E9D2A6]" />
        {face && <span className="absolute right-[6%] top-[8%] w-[42%] aspect-square rounded-full overflow-hidden border-2 border-white"><img src={face.imageSrc} alt="" className="w-full h-full object-cover object-top" /></span>}
      </div>
    )}
  </div>
);

export const DeliveryGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const [round, setRound] = useState(0);
  const [data, setData] = useState<RoundData>(() => makeRound([character.id]));
  const [phase, setPhase] = useState<Phase>('pack');
  const [packed, setPacked] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [sticker, setSticker] = useState(false);
  const [truckX, setTruckX] = useState(0.13);
  const [driving, setDriving] = useState(false);
  const [finished, setFinished] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const stickersRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [tape, setTape] = useState<Record<Strip, boolean[]>>({ v: [], h: [] });
  const lastTapeSound = useRef(0);
  const tapeRef = useRef(tape);
  tapeRef.current = tape;
  const drag = useRef<{ dx: number } | null>(null);
  const busy = useRef(false);
  const reaction = useMemo(() => pickReaction('celebrate', data.to.id), [data, round]);
  const portrait = window.innerHeight > window.innerWidth * 1.15;

  useEffect(() => {
    if (finished) return;
    const v: Record<Phase, string | null> = { pack: round === 0 ? 'dl_start' : 'dl_next', tape: 'dl_tape', sticker: 'dl_sticker', drive: 'dl_drive', arrive: null };
    const id = v[phase];
    if (!id) return;
    const t = window.setTimeout(() => say(id, soundEnabled), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, runKey]);

  const go = (p: Phase, delay = 700) => { busy.current = true; window.setTimeout(() => whenVoiceIdle(() => { busy.current = false; setPhase(p); }), delay); };

  // ---- 1. собрать заказ
  const pack = (g: Good) => {
    if (phase !== 'pack' || busy.current || packed.includes(g.id)) return;
    if (!data.order.includes(g)) {
      setWrong(g.id); soundEngine.playGamePop(soundEnabled, 0);
      playVoice('dl_wrong_item', soundEnabled, undefined, 'replace');
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    const np = [...packed, g.id];
    setPacked(np);
    soundEngine.playGamePop(soundEnabled, 2 + np.length);
    if (np.length === data.order.length) { soundEngine.playGameOk(soundEnabled); go('tape'); }
  };

  // ---- 2. заклеить скотчем: ведём пальцем по полоске — скотч ложится там, где прошёл палец
  const strips = stripsFor(round);
  const stripDone = (k: Strip) => tape[k].filter(Boolean).length >= BINS - 2;
  const nextStrip = strips.find((k) => !stripDone(k));
  const tapeAt = (e: React.PointerEvent) => {
    if (phase !== 'tape' || busy.current) return;
    const r = boxRef.current!.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (fx < -0.05 || fx > 1.05 || fy < -0.05 || fy > 1.05) return;
    const hit: Strip | null = strips.includes('v') && Math.abs(fx - 0.5) < 0.14 && !stripDone('v') ? 'v'
      : strips.includes('h') && Math.abs(fy - 0.5) < 0.16 && !stripDone('h') ? 'h' : null;
    if (!hit) return;
    const bin = Math.max(0, Math.min(BINS - 1, Math.floor((hit === 'v' ? fy : fx) * BINS)));
    const cur = tapeRef.current;
    if (cur[hit][bin]) return;
    const nt = { ...cur, [hit]: Object.assign([...cur[hit]], { [bin]: true }) };
    tapeRef.current = nt;
    setTape(nt);
    const now = performance.now();
    if (now - lastTapeSound.current > 120) { soundEngine.playGamePop(soundEnabled, 1); lastTapeSound.current = now; }
    if (strips.every((k) => nt[k].filter(Boolean).length >= BINS - 2)) {
      // докладываем полоски целиком и дальше
      setTape(Object.fromEntries(strips.map((k) => [k, Array(BINS).fill(true)])) as Record<Strip, boolean[]>);
      soundEngine.playGameOk(soundEnabled);
      sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 14);
      go('sticker', 600);
    }
  };

  // ---- 3. наклейка
  const pickSticker = (c: CharacterItem, el: HTMLElement) => {
    if (phase !== 'sticker' || busy.current || sticker) return;
    if (c.id !== data.to.id) {
      setWrong(c.id); soundEngine.playGamePop(soundEnabled, 0);
      playVoice('dl_wrong_sticker', soundEnabled, undefined, 'replace');
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    setSticker(true);
    const r = el.getBoundingClientRect();
    sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 12);
    soundEngine.playGameOk(soundEnabled);
    playVoice(`hero_${c.id}`, soundEnabled, undefined, 'replace');
    go('drive', 900);
  };

  // ---- 4. дорога
  const roadFrac = (clientX: number) => {
    const r = roadRef.current!.getBoundingClientRect();
    return Math.max(0.06, Math.min(0.92, (clientX - r.left) / r.width));
  };
  const arriveAt = (x: number) => {
    const i = HOUSE_X.findIndex((hx) => Math.abs(hx - x) < 0.09);
    if (i < 0) return;
    if (data.houses[i].id !== data.to.id) {
      soundEngine.playGamePop(soundEnabled, 0);
      playVoice('dl_wrong_house', soundEnabled, undefined, 'replace');
      return;
    }
    setTruckX(HOUSE_X[i]);
    soundEngine.playGameReward(soundEnabled);
    setPhase('arrive');
    window.setTimeout(() => { say('dl_arrive', soundEnabled); }, 300);
    window.setTimeout(() => whenVoiceIdle(() => window.setTimeout(nextRound, 2600)), 900);
  };
  const driveTo = (i: number) => {
    if (phase !== 'drive' || driving) return;
    setDriving(true);
    setTruckX(HOUSE_X[i]);
    soundEngine.playGamePop(soundEnabled, 3);
    window.setTimeout(() => { setDriving(false); arriveAt(HOUSE_X[i]); }, 1100);
  };

  const nextRound = () => {
    if (round + 1 >= ROUNDS) { setFinished(true); say('dl_done', soundEnabled); return; }
    setRound(round + 1);
    setData(makeRound([character.id, data.to.id]));
    setPacked([]); setSticker(false); setTape({ v: [], h: [] }); setTruckX(0.13); setPhase('pack');
  };

  const restart = () => {
    setRound(0); setData(makeRound([character.id])); setPacked([]); setSticker(false); setTape({ v: [], h: [] }); setTruckX(0.13);
    setPhase('pack'); setFinished(false); setRunKey((k) => k + 1);
  };

  const hintOn = useStepHint(`${round}-${phase}-${packed.length}-${nextStrip ?? ''}`, 3000, 8000, !finished && phase !== 'arrive' && !driving);

  if (finished) {
    return (
      <CookScreen stepKey="done" stepIdx={STEPS.length} total={STEPS.length} done={false} bg="linear-gradient(#DCFCE7, #BBF7D0)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="text-[min(9vmin,64px)]">📦📦</div>
        </Celebrate>
      </CookScreen>
    );
  }

  const BOX = portrait ? 'min(64vw, 340px)' : 'min(46vmin, 360px)';
  const stepIdx = STEPS.indexOf(phase);

  // ---------- дорога с домиками
  if (phase === 'drive' || phase === 'arrive') {
    const HW = portrait ? '27vw' : 'min(22vmin, 200px)';
    return (
      <CookScreen stepKey={`road-${round}`} stepIdx={stepIdx} total={STEPS.length} done={false}
        bg="linear-gradient(#BAE6FD 0%, #E0F2FE 45%, #86EFAC 45%, #4ADE80 100%)">
        <div className="relative w-full h-full">
          {/* домики */}
          {data.houses.map((h, i) => {
            const here = phase === 'arrive' && h.id === data.to.id;
            return (
              <button key={h.id} type="button" aria-label={`Домик ${h.name}`} onClick={() => driveTo(i)}
                className="absolute -translate-x-1/2 flex flex-col items-center active:scale-95 transition-transform"
                style={{ left: `${HOUSE_X[i] * 100}%`, bottom: '42%', width: HW }}>
                <span className="w-0 h-0" style={{ borderLeft: `calc(${HW} * 0.6) solid transparent`, borderRight: `calc(${HW} * 0.6) solid transparent`, borderBottom: `calc(${HW} * 0.45) solid #B91C1C` }} />
                <span className="relative w-full flex items-end justify-center rounded-b-lg shadow-xl" style={{ height: `calc(${HW} * 0.9)`, background: HOUSE_COLORS[i] }}>
                  <span className="absolute top-[10%] left-1/2 -translate-x-1/2 rounded-full overflow-hidden border-4 border-white bg-white shadow" style={{ width: '56%', aspectRatio: '1' }}>
                    {here
                      ? <ReactionHero character={h} reaction={reaction} runKey={`dl-${round}`} />
                      : <img src={h.imageSrc} alt="" className="w-full h-full object-cover object-top" />}
                  </span>
                  <span className="w-[26%] h-[34%] rounded-t-md bg-[#92400E] border-2 border-[#78350F]" />
                </span>
              </button>
            );
          })}
          {/* дорога */}
          <div ref={roadRef} className="absolute left-0 right-0" style={{ bottom: '18%', height: '22%', background: 'linear-gradient(#6B7280, #4B5563)' }}>
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[6%]" style={{ background: 'repeating-linear-gradient(90deg, #FDE047 0 40px, transparent 40px 80px)' }} />
            {/* машинка: тащить пальцем */}
            <div ref={stickRef}
              className="absolute -translate-x-1/2 bottom-[30%] cursor-grab"
              style={{ left: `${truckX * 100}%`, transition: drag.current ? 'none' : 'left 1s ease-in-out', touchAction: 'none' }}
              onPointerDown={(e) => {
                if (phase !== 'drive' || driving) return;
                try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
                drag.current = { dx: roadFrac(e.clientX) - truckX };
              }}
              onPointerMove={(e) => { if (drag.current) setTruckX(roadFrac(e.clientX) - drag.current.dx); }}
              onPointerUp={() => { if (!drag.current) return; drag.current = null; arriveAt(truckX); }}
              onPointerCancel={() => { drag.current = null; }}>
              <Truck withBox={phase === 'drive'} face={data.to} w={portrait ? '24vw' : 'min(26vmin, 220px)'} />
            </div>
          </div>
          {phase === 'arrive' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[6%] flex gap-[2vmin] animate-pop-in">
              {data.order.map((g) => <img key={g.id} src={g.src} alt="" className="w-[min(12vmin,90px)] h-[min(12vmin,90px)] object-contain drop-shadow-lg animate-[bob_1.2s_ease-in-out_infinite]" />)}
            </div>
          )}
        </div>
        <GestureHint show={hintOn && phase === 'drive'} kind="drag" target={stickRef} />
      </CookScreen>
    );
  }

  // ---------- коробка
  const tray = phase === 'pack'
    ? data.tray.map((g) => (
      <Plate key={g.id} src={g.src} label={g.name} onPick={() => pack(g)} target={boxRef} onDrop={() => pack(g)}
        dim={packed.includes(g.id)} wrong={wrong === g.id} />
    ))
    : phase === 'sticker'
      ? <div ref={stickersRef} className="flex items-end justify-center gap-[2.4vmin]">{data.stickers.map((c) => (
        <button key={c.id} type="button" aria-label={`Наклейка ${c.name}`} onClick={(e) => pickSticker(c, e.currentTarget)}
          className={`rounded-full overflow-hidden border-[5px] border-white shadow-xl active:scale-90 transition-transform ${wrong === c.id ? 'animate-[wiggle_0.4s]' : ''}`}
          style={{ width: 'clamp(70px, 15vmin, 130px)', height: 'clamp(70px, 15vmin, 130px)', background: c.accentBg, opacity: sticker && c.id === data.to.id ? 0.2 : 1 }}>
          <img src={c.imageSrc} alt="" draggable={false} className="w-full h-full object-cover object-top pointer-events-none" />
        </button>
      ))}</div>
      : undefined;

  const closed = phase !== 'pack';
  return (
    <CookScreen stepKey={`box-${round}-${phase === 'pack' ? 'p' : 'c'}`} stepIdx={stepIdx} total={STEPS.length} done={false} tray={tray}
      bg="linear-gradient(#FEF3C7 0%, #FDE68A 62%, #D6A56A 62%, #B7803F 100%)">
      <div className="flex flex-col items-center gap-[2vmin]">
        {/* заказ: кто заказал и что */}
        <div className="flex items-center gap-[2vmin]">
          <HeroFace hero={data.to} emotion="curious" size={portrait ? 'min(18vw, 100px)' : 'min(13vmin, 104px)'} />
          <NeedRow items={data.order.map((g) => ({ key: g.id, src: g.src, done: packed.includes(g.id) }))} />
        </div>

        {/* коробка: открыта (вид сверху) или закрыта, с наклейкой */}
        <div ref={boxRef} aria-label="Коробка" data-phase={phase}
          onPointerDown={(e) => { try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ } tapeAt(e); }}
          onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') tapeAt(e); }}
          className="relative" style={{ width: BOX, height: `calc(${BOX} * 0.72)`, touchAction: 'none' }}>
          {/* закрытая коробка — картон; открытая — светлый край, тёмное дно и клапаны по бокам */}
          <div className="absolute inset-0 rounded-xl" style={closed
            ? { background: 'linear-gradient(#D6A56A, #B7803F)', boxShadow: '0 14px 22px rgba(0,0,0,.3)' }
            : { background: 'radial-gradient(ellipse at 50% 40%, #7A4E26, #4A2E14)', border: 'min(2.2vmin, 16px) solid #C9955A', boxShadow: '0 14px 22px rgba(0,0,0,.3), inset 0 10px 18px rgba(0,0,0,.45)' }} />
          {!closed && (
            <>
              <span className="absolute -left-[16%] top-[6%] bottom-[6%] w-[17%] rounded-l-lg" style={{ background: 'linear-gradient(90deg, #B7803F, #D6A56A)', transform: 'skewY(-8deg)' }} />
              <span className="absolute -right-[16%] top-[6%] bottom-[6%] w-[17%] rounded-r-lg" style={{ background: 'linear-gradient(270deg, #B7803F, #D6A56A)', transform: 'skewY(8deg)' }} />
              <div className="absolute inset-[10%] flex items-center justify-center gap-[3%]">
                {packed.map((id) => {
                  const g = data.order.find((x) => x.id === id)!;
                  return <img key={id} src={g.src} alt="" className="object-contain animate-pop-in drop-shadow-lg" style={{ width: '30%', height: '70%' }} />;
                })}
                {packed.length === 0 && <span className="text-white/40" style={{ fontSize: 'min(10vmin, 70px)' }}>📦</span>}
              </div>
            </>
          )}
          {closed && (
            <>
              {/* шов между клапанами */}
              <span className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.2%] bg-[#8B5A2B]/45" />
              {/* полоски скотча: пунктир — куда клеить, скотч — где уже провели пальцем */}
              {strips.map((k) => (
                <div key={k} ref={k === nextStrip ? stripRef : undefined} className={`absolute ${k === 'v' ? 'left-1/2 -translate-x-1/2 top-0 bottom-0 w-[18%] flex flex-col' : 'top-1/2 -translate-y-1/2 left-0 right-0 h-[22%] flex flex-row'}`}>
                  {!stripDone(k) && <span className="absolute inset-0 border-[4px] border-dashed border-white/90 rounded-sm" />}
                  {Array.from({ length: BINS }).map((_, i) => (
                    <span key={i} className="flex-1 transition-opacity duration-150" style={{ background: 'linear-gradient(90deg, rgba(254,243,199,.85), rgba(253,230,138,.9), rgba(254,243,199,.85))', opacity: tape[k][i] ? 1 : 0, boxShadow: tape[k][i] ? '0 1px 2px rgba(0,0,0,.15)' : undefined }} />
                  ))}
                </div>
              ))}
              {sticker && (
                <span className="absolute right-[8%] top-[10%] w-[34%] aspect-square rounded-full overflow-hidden border-[5px] border-white shadow-lg animate-pop-in rotate-[-8deg]" style={{ background: data.to.accentBg }}>
                  <img src={data.to.imageSrc} alt="" className="w-full h-full object-cover object-top" />
                </span>
              )}
              {phase === 'sticker' && !sticker && (
                <span className="absolute right-[8%] top-[10%] w-[34%] aspect-square rounded-full border-[5px] border-dashed border-white/90" />
              )}
            </>
          )}
          {phase === 'tape' && <span className="absolute -right-[12%] -top-[14%] text-[min(10vmin,72px)] rotate-12 pointer-events-none">🧻</span>}
        </div>
      </div>
      {phase === 'pack' && <GestureHint show={hintOn} kind="drag" target={boxRef} />}
      {phase === 'tape' && <GestureHint show={hintOn} kind="stroke" target={stripRef} noRing />}
      {/* выбор наклейки: рука водит над всеми тремя, никого не выделяя */}
      {phase === 'sticker' && <GestureHint show={hintOn && !sticker} kind="scan" target={stickersRef} noRing />}
    </CookScreen>
  );
};
