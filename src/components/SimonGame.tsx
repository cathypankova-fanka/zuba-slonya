import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { RoundReplayOverlay } from './MiniGameShell';

/**
 * «Повтори за героями»: 4 больших кнопки-героя, у каждой свой цвет и своя нота.
 * Герои «поют» цепочку — ребёнок повторяет. Ошибки не наказываются: цепочка
 * просто звучит ещё раз.
 */

interface Pad {
  hero: string;
  color: string;
  dark: string;
  freq: number;
  wave: OscillatorType;
}

// Пентатоника: звучит красиво при любом порядке нажатий
const PADS: Pad[] = [
  { hero: 'bunny', color: '#FF8FC7', dark: '#DB2777', freq: 659.25, wave: 'triangle' },
  { hero: 'frog', color: '#4ADE80', dark: '#15803D', freq: 523.25, wave: 'sine' },
  { hero: 'bear', color: '#60A5FA', dark: '#1D4ED8', freq: 392.0, wave: 'triangle' },
  { hero: 'cat', color: '#FBBF24', dark: '#B45309', freq: 880.0, wave: 'sine' },
];

const CHAIN_MAX = 6;
const STEP_MS = 650;

interface SimonGameProps {
  soundEnabled: boolean;
}

export const SimonGame: React.FC<SimonGameProps> = ({ soundEnabled }) => {
  const [seq, setSeq] = useState<number[]>([]);
  const [len, setLen] = useState(1);
  const [phase, setPhase] = useState<'show' | 'input' | 'win'>('show');
  const [lit, setLit] = useState<number | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [shake, setShake] = useState(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const sing = useCallback(
    (i: number) => {
      const p = PADS[i];
      soundEngine.playNote(soundEnabled, p.freq, 0.5, p.wave);
      setLit(i);
      window.setTimeout(() => setLit((cur) => (cur === i ? null : cur)), 380);
    },
    [soundEnabled],
  );

  const playChain = useCallback(
    (chain: number[], n: number) => {
      clearTimers();
      setPhase('show');
      setInputIdx(0);
      for (let i = 0; i < n; i++) {
        later(() => sing(chain[i]), 800 + i * STEP_MS);
      }
      later(() => setPhase('input'), 800 + n * STEP_MS);
    },
    [clearTimers, later, sing],
  );

  const startNew = useCallback(() => {
    const chain = Array.from({ length: CHAIN_MAX }, () => Math.floor(Math.random() * PADS.length));
    setSeq(chain);
    setLen(1);
    playChain(chain, 1);
  }, [playChain]);

  useEffect(() => {
    startNew();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPad = (i: number) => {
    if (phase === 'win') return;
    sing(i);
    if (phase !== 'input') return; // пока звучит цепочка — просто играем ноты

    if (i === seq[inputIdx]) {
      const next = inputIdx + 1;
      setInputIdx(next);
      if (next === len) {
        if (len === CHAIN_MAX) {
          later(() => {
            setPhase('win');
          }, 500);
        } else {
          later(() => soundEngine.playGameOk(soundEnabled, len), 350);
          later(() => {
            setLen(len + 1);
            playChain(seq, len + 1);
          }, 1100);
        }
        setPhase('show'); // блокируем ввод до следующего раунда
      }
    } else {
      // мягко: все кнопки качают «головой», цепочка звучит заново
      setShake(true);
      setPhase('show');
      later(() => setShake(false), 600);
      later(() => playChain(seq, len), 900);
    }
  };

  const hintPad = phase === 'input' && len <= 2 ? seq[inputIdx] : null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 toy-panel overflow-hidden select-none touch-none">
      <div className="w-full flex items-center justify-between gap-2 shrink-0">
        {/* Цепочка: кружки — сколько нот нужно повторить */}
        <div className="toy-pill flex items-center gap-1.5 px-3 py-2">
          {Array.from({ length: CHAIN_MAX }).map((_, i) => {
            const pad = seq[i] !== undefined ? PADS[seq[i]] : null;
            const inChain = i < len;
            const done = phase === 'input' && i < inputIdx;
            return (
              <span
                key={i}
                className="block w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[3px] border-white transition-all"
                style={{
                  background: done && pad ? pad.color : inChain ? '#FFE9C9' : '#F3EEE6',
                  boxShadow: inChain ? '0 2px 0 #E8B77D' : 'none',
                  transform: done ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            startNew();
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      <div className="flex-1 w-full min-h-0 flex items-center justify-center">
        <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-5 w-full h-full max-w-[720px] max-h-[720px]">
          {PADS.map((p, i) => {
            const hero = CHARACTERS.find((c) => c.id === p.hero);
            const on = lit === i;
            const hinted = hintPad === i;
            return (
              <button
                key={p.hero}
                type="button"
                onPointerDown={() => onPad(i)}
                aria-label={hero?.name ?? p.hero}
                style={{
                  background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 55%), ${p.color}`,
                  boxShadow: on
                    ? `0 0 0 6px #fff, 0 0 40px 10px ${p.color}`
                    : `0 8px 0 ${p.dark}, 0 14px 20px rgba(0,0,0,0.2)`,
                }}
                className={`relative rounded-[2.2rem] border-[5px] border-white cursor-pointer outline-none flex items-center justify-center overflow-hidden transition-transform duration-150 ${
                  on ? 'scale-[1.06] brightness-110' : 'active:scale-95'
                } ${shake ? 'animate-gentle-shake' : ''} ${hinted ? 'animate-gentle-float' : ''}`}
              >
                {hero && (
                  <img
                    src={hero.imageSrc}
                    alt=""
                    draggable={false}
                    className={`w-[78%] h-[78%] object-cover object-top rounded-full border-[4px] border-white/90 pointer-events-none transition-transform duration-150 ${
                      on ? 'scale-110 -rotate-3' : ''
                    }`}
                  />
                )}
                {hinted && (
                  <span
                    className="absolute inset-0 rounded-[2rem] ring-8 ring-white/80 animate-pulse pointer-events-none"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <RoundReplayOverlay open={phase === 'win'} soundEnabled={soundEnabled} onReplay={startNew} />
    </div>
  );
};
