import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem, CHARACTERS } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, LoopScroller, NeedRow, Plate, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, P, randomHero, say, shuffle, useSteps } from './PlayKit';

/**
 * Доктор: заболел случайный герой, болезнь каждый раз разная (шишка, температура, животик, царапинка, горлышко).
 * Сверху — что нужно для лечения; из докторского чемоданчика выбираешь нужный инструмент (не тот — «не нужно»).
 * Каждое лечение видно: шишка уменьшается, щёчки остывают, царапинка закрывается.
 */

type ToolId = 'listen' | 'temp' | 'med' | 'plaster' | 'ice' | 'bandage' | 'vitamin';
const TOOLS: Record<ToolId, { src: string; name: string; voice: string }> = {
  listen: { src: P('stethoscope'), name: 'Стетоскоп', voice: 'dc_listen' },
  temp: { src: P('thermometer'), name: 'Градусник', voice: 'dc_temp' },
  med: { src: P('medicine'), name: 'Лекарство', voice: 'dc_med' },
  plaster: { src: P('plaster'), name: 'Пластырь', voice: 'dc_plaster' },
  ice: { src: P('ice_pack'), name: 'Лёд', voice: 'dc_ice' },
  bandage: { src: P('bandage'), name: 'Бинт', voice: 'dc_bandage' },
  vitamin: { src: P('vitamin'), name: 'Витаминка', voice: 'dc_vitamin' },
};

type AilmentId = 'bump' | 'fever' | 'tummy' | 'scratch' | 'throat';
interface Ailment { id: AilmentId; voice: string; icon: string; tools: ToolId[] }
const AILMENTS: Ailment[] = [
  { id: 'bump', voice: 'dc_bump', icon: '🤕', tools: ['ice', 'plaster'] },
  { id: 'fever', voice: 'dc_fever', icon: '🤒', tools: ['temp', 'med', 'vitamin'] },
  { id: 'tummy', voice: 'dc_tummy', icon: '🤢', tools: ['listen', 'med'] },
  { id: 'scratch', voice: 'dc_scratch', icon: '🩹', tools: ['plaster', 'bandage'] },
  { id: 'throat', voice: 'dc_throat', icon: '😷', tools: ['listen', 'temp', 'vitamin'] },
];

export const DoctorMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [ailment, setAilment] = useState<Ailment>(() => AILMENTS[Math.floor(Math.random() * AILMENTS.length)]);
  const steps = useMemo(() => [...ailment.tools, 'healthy'] as const, [ailment]);
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(steps as readonly string[], soundEnabled, {});
  const [patient, setPatient] = useState<CharacterItem>(() => randomHero(CHARACTERS, character.id));
  const [anim, setAnim] = useState<ToolId | null>(null);
  const [used, setUsed] = useState<ToolId[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLButtonElement | null>(null);
  const lastWrong = useRef(0);

  // болезнь называется, потом — что делать на каждом шаге
  useEffect(() => {
    if (step === 'healthy') { say('dc_ok', soundEnabled); return; }
    if (idx === 0) say(ailment.voice, soundEnabled); // фраза инструмента встанет в очередь после болезни
    say(TOOLS[step as ToolId].voice, soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, idx, runKey]);

  const tool = step === 'healthy' ? null : (step as ToolId);
  const has = (t: ToolId) => used.includes(t);

  const applyTool = (t: ToolId) => {
    if (doneFx || anim || !tool) return;
    if (t !== tool) {
      soundEngine.playGameFail(soundEnabled); setWrong(t); window.setTimeout(() => setWrong(null), 600);
      const now = Date.now();
      if (now - lastWrong.current > 6000) { lastWrong.current = now; say('dc_wrong', soundEnabled); }
      return;
    }
    setAnim(t);
    if (t === 'listen') [0, 450, 900, 1350].forEach((ms) => window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 1), ms));
    else if (t === 'med' || t === 'vitamin') soundEngine.playGameChomp(soundEnabled);
    else soundEngine.playGamePop(soundEnabled, 5);
    window.setTimeout(() => {
      setUsed((u) => [...u, t]);
      const r = heroRef.current?.getBoundingClientRect();
      if (r) sparkleBurst(r.left + r.width / 2, r.top + r.height * 0.4, 16);
    }, t === 'plaster' || t === 'bandage' || t === 'vitamin' ? 400 : 1300);
    window.setTimeout(() => { setAnim(null); next(); }, t === 'plaster' || t === 'bandage' || t === 'vitamin' ? 900 : 1900);
  };
  const restart = () => {
    setAilment(AILMENTS[Math.floor(Math.random() * AILMENTS.length)]);
    setPatient(randomHero(CHARACTERS, character.id)); setUsed([]); setAnim(null); setRunKey((k) => k + 1); restartSteps();
  };

  const shelf = useMemo(() => shuffle(Object.keys(TOOLS) as ToolId[]), [runKey]);
  hintFrom.current = tool ? plateEls.current[tool] ?? null : null;
  const showGesture = useStepHint(`${step}-${runKey}`, 2600, 7000, step !== 'healthy' && !doneFx && !anim);
  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const HERO = portrait ? 'min(70vw, 38vh, 460px)' : 'min(50vmin, 440px)';
  const cured = step === 'healthy';
  const lastDone = used.length === ailment.tools.length;

  // симптомы (уходят, когда применили нужное)
  const bump = ailment.id === 'bump' && !has('plaster');
  const bumpScale = has('ice') ? 0.55 : 1;
  const fever = (ailment.id === 'fever' || ailment.id === 'throat') && !has('med') && !has('vitamin');
  const greenish = ailment.id === 'tummy' && !has('med');
  const scratch = ailment.id === 'scratch' && !has('plaster');

  return (
    <CookScreen stepKey={`${idx}-${runKey}`} stepIdx={idx} total={steps.length} done={doneFx}
      bg="linear-gradient(#E0F2FE 0%, #F0F9FF 60%, #BAE6FD 61%, #93C5FD 100%)"
      trayLoop={!cured}
      tray={cured ? undefined : <LoopScroller>{shelf.map((t) => (
        <Plate key={t} src={TOOLS[t].src} label={TOOLS[t].name} plateRef={(el) => { plateEls.current[t] = el; }}
          onPick={() => applyTool(t)} target={heroRef} onDrop={() => applyTool(t)} wrong={wrong === t} dim={has(t) && t !== tool} />
      ))}</LoopScroller>}>
      {!cured ? (
        <div className="flex flex-col items-center gap-[3vmin]">
          <NeedRow ordered items={ailment.tools.map((t, i) => ({ key: t + i, src: TOOLS[t].src, done: i < used.length, now: i === used.length }))} />
          <div ref={heroRef} className="relative">
            {/* облачко-жалоба */}
            <div className="absolute -left-[6%] -top-[4%] z-10 rounded-full bg-white shadow-xl border-4 border-white flex items-center justify-center animate-gentle-float"
              style={{ width: '26%', aspectRatio: '1', fontSize: `calc(${HERO} * 0.14)` }}>{lastDone ? '😊' : ailment.icon}</div>
            <HeroFace hero={patient} emotion={lastDone ? 'joy' : 'sad'} size={HERO}>
              {/* температура: горячие щёчки и капельки */}
              {fever && (
                <>
                  <span className="absolute left-[16%] top-[54%] w-[18%] h-[10%] rounded-full bg-red-500/45 blur-[3px] pointer-events-none animate-pulse" />
                  <span className="absolute right-[16%] top-[54%] w-[18%] h-[10%] rounded-full bg-red-500/45 blur-[3px] pointer-events-none animate-pulse" />
                  <span className="absolute left-[14%] top-[18%] pointer-events-none animate-bounce" style={{ fontSize: `calc(${HERO} * 0.08)` }}>💦</span>
                </>
              )}
              {greenish && <span className="absolute inset-[12%] rounded-full bg-lime-400/25 pointer-events-none mix-blend-multiply" />}
              {bump && <span className="absolute left-[56%] top-[9%] w-[15%] h-[12%] rounded-full pointer-events-none transition-transform duration-700" style={{ background: 'radial-gradient(circle at 40% 35%, #FCA5A5, #EF4444 70%)', transform: `scale(${bumpScale})`, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />}
              {ailment.id === 'bump' && has('plaster') && <img src={P('plaster')} alt="" className="absolute left-[50%] top-[6%] w-[26%] pointer-events-none animate-pop-in" style={{ transform: 'rotate(-20deg)' }} />}
              {scratch && [0, 1, 2].map((k) => <span key={k} className="absolute h-[2.2%] w-[16%] rounded-full bg-red-500/80 pointer-events-none" style={{ right: '16%', top: `${50 + k * 4}%`, transform: 'rotate(-28deg)' }} />)}
              {ailment.id === 'scratch' && has('plaster') && <img src={P('plaster')} alt="" className="absolute right-[12%] top-[46%] w-[26%] pointer-events-none animate-pop-in" style={{ transform: 'rotate(-28deg)' }} />}
              {ailment.id === 'throat' && !has('vitamin') && <span className="absolute left-1/2 -translate-x-1/2 bottom-[-4%] pointer-events-none" style={{ fontSize: `calc(${HERO} * 0.2)` }}>🧣</span>}
            </HeroFace>
            {/* бинт — повязка на голове */}
            {has('bandage') && <img src={P('bandage')} alt="" className="absolute left-[18%] top-[-6%] w-[64%] pointer-events-none animate-pop-in" />}
            {/* анимации инструментов */}
            {anim === 'listen' && (
              <>
                <img src={P('stethoscope')} alt="" className="absolute left-[30%] top-[58%] w-[40%] pointer-events-none animate-pop-in" />
                <img src={P('heart')} alt="" className="absolute -right-[12%] top-[10%] w-[30%] pointer-events-none animate-ping-soft" />
              </>
            )}
            {anim === 'temp' && (
              <div className="absolute -right-[22%] top-[30%] w-[48%] animate-pop-in pointer-events-none">
                <img src={P('thermometer')} alt="" className="w-full" style={{ transform: 'rotate(-30deg)' }} />
                <div className="absolute -top-[46%] left-1/2 -translate-x-1/2 rounded-full bg-white px-[10%] py-[4%] font-black text-[#EF4444] shadow" style={{ fontSize: `calc(${HERO} * 0.07)` }}>{fever ? '38°' : '36°'}</div>
              </div>
            )}
            {anim === 'med' && <img src={P('spoon')} alt="" className="absolute left-[30%] top-[62%] w-[40%] pointer-events-none animate-pop-in" />}
            {anim === 'vitamin' && <img src={P('vitamin')} alt="" className="absolute left-[38%] top-[62%] w-[24%] pointer-events-none animate-pop-in" />}
            {anim === 'ice' && <img src={P('ice_pack')} alt="" className="absolute left-[46%] top-[-2%] w-[36%] pointer-events-none animate-pop-in" style={{ transform: 'rotate(-14deg)' }} />}
          </div>
        </div>
      ) : (
        <Celebrate hero={patient} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart} />
      )}
      <GestureHint show={showGesture && !!tool} kind="drag" target={heroRef} from={hintFrom} itemSrc={tool ? TOOLS[tool].src : undefined} />
    </CookScreen>
  );
};
