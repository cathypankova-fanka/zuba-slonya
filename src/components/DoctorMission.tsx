import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem, CHARACTERS } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, Plate, useStepHint } from './CookKit';
import { Celebrate, HeroFace, P, randomHero, say, useSteps } from './PlayKit';

/** Доктор: заболел случайный герой → послушать сердечко → градусник → ложечка лекарства → пластырь → здоров! */

const STEPS = ['listen', 'temp', 'med', 'plaster', 'healthy'] as const;
const VOICES = { listen: 'dc_listen', temp: 'dc_temp', med: 'dc_med', plaster: 'dc_plaster' };
const TOOL: Record<string, { src: string; name: string }> = {
  listen: { src: P('stethoscope'), name: 'Стетоскоп' },
  temp: { src: P('thermometer'), name: 'Градусник' },
  med: { src: P('medicine'), name: 'Лекарство' },
  plaster: { src: P('plaster'), name: 'Пластырь' },
};

export const DoctorMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [patient, setPatient] = useState<CharacterItem>(() => randomHero(CHARACTERS, character.id));
  const [anim, setAnim] = useState<string | null>(null);
  const [plaster, setPlaster] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const toolPlate = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { say('dc_sick', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [runKey]);
  useEffect(() => { if (step === 'healthy') { say('dc_ok', soundEnabled); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [step]);

  const applyTool = () => {
    if (doneFx || anim || step === 'healthy') return;
    setAnim(step);
    if (step === 'listen') { [0, 500, 1000, 1500].forEach((t) => window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 1), t)); }
    else if (step === 'med') soundEngine.playGameChomp(soundEnabled);
    else soundEngine.playGamePop(soundEnabled, 5);
    if (step === 'plaster') setPlaster(true);
    window.setTimeout(() => { setAnim(null); next(); }, step === 'plaster' ? 700 : 1900);
  };
  const restart = () => { setPatient(randomHero(CHARACTERS, character.id)); setPlaster(false); setAnim(null); setRunKey((k) => k + 1); restartSteps(); };

  const showGesture = useStepHint(`${step}-${runKey}`, 2600, 7000, step !== 'healthy' && !doneFx && !anim);
  const HERO = 'min(54vmin, 460px)';
  const sick = step !== 'healthy';
  const tool = TOOL[step];

  return (
    <CookScreen stepKey={`${step}-${runKey}`} stepIdx={idx} total={STEPS.length} done={doneFx}
      bg="linear-gradient(#E0F2FE 0%, #F0F9FF 60%, #BAE6FD 61%, #93C5FD 100%)"
      tray={tool ? <Plate src={tool.src} label={tool.name} plateRef={(el) => { toolPlate.current = el; }} onPick={applyTool} target={heroRef} onDrop={applyTool} selected /> : undefined}>
      {sick ? (
        <div ref={heroRef} className="relative">
          <HeroFace hero={patient} emotion={step === 'plaster' && plaster ? 'joy' : 'sad'} size={HERO}>
            {/* щёчки горят и шишка */}
            <span className="absolute left-[18%] top-[56%] w-[16%] h-[9%] rounded-full bg-red-400/40 blur-[2px] pointer-events-none" />
            <span className="absolute right-[18%] top-[56%] w-[16%] h-[9%] rounded-full bg-red-400/40 blur-[2px] pointer-events-none" />
            {!plaster && <span className="absolute left-[56%] top-[10%] w-[14%] h-[11%] rounded-full bg-red-500/60 blur-[1px] pointer-events-none animate-pulse" />}
            {plaster && <img src={P('plaster')} alt="" className="absolute left-[50%] top-[8%] w-[26%] pointer-events-none animate-pop-in" style={{ transform: 'rotate(-20deg)' }} />}
          </HeroFace>
          {anim === 'listen' && (
            <>
              <img src={P('stethoscope')} alt="" className="absolute left-[30%] top-[58%] w-[40%] pointer-events-none animate-pop-in" />
              <img src={P('heart')} alt="" className="absolute -right-[12%] top-[10%] w-[30%] pointer-events-none animate-ping-soft" />
            </>
          )}
          {anim === 'temp' && (
            <div className="absolute -right-[22%] top-[30%] w-[48%] animate-pop-in pointer-events-none">
              <img src={P('thermometer')} alt="" className="w-full" style={{ transform: 'rotate(-30deg)' }} />
              <div className="absolute -top-[60%] left-1/2 -translate-x-1/2 text-[6vmin]">🌡️</div>
            </div>
          )}
          {anim === 'med' && <img src={P('spoon')} alt="" className="absolute left-[30%] top-[62%] w-[40%] pointer-events-none animate-pop-in" />}
        </div>
      ) : (
        <Celebrate hero={patient} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart} />
      )}
      <GestureHint show={showGesture && !!tool} kind="drag" target={heroRef} from={toolPlate} itemSrc={tool?.src} />
    </CookScreen>
  );
};
