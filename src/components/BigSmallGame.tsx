import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { MiniGameAssetItem, STICKER_SETS } from '../data/miniGamesData';
import { soundEngine } from '../utils/soundEngine';
import { RoundReplayOverlay } from './MiniGameShell';
import { playVoice, whenVoiceIdle } from '../utils/voice';

/**
 * «Большой и маленький»: два одинаковых предмета разного размера.
 * Над ними значок-подсказка (без слов): «большой» или «маленький».
 */

const ROUNDS = 6;
const SMALL_RATIO = 0.62; // чем ближе к 1, тем сложнее

type Ask = 'big' | 'small';

/** Значок понятия: большой квадрат со стрелками наружу / маленький со стрелками внутрь */
const ConceptIcon: React.FC<{ ask: Ask; className?: string }> = ({ ask, className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
    {ask === 'big' ? (
      <>
        <rect x="26" y="26" width="44" height="44" rx="10" fill="#FF8A3D" stroke="#fff" strokeWidth="4" />
        {[
          'M48 20 L48 6 M42 12 L48 6 L54 12',
          'M48 76 L48 90 M42 84 L48 90 L54 84',
          'M20 48 L6 48 M12 42 L6 48 L12 54',
          'M76 48 L90 48 M84 42 L90 48 L84 54',
        ].map((d) => (
          <path key={d} d={d} stroke="#C2410C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
      </>
    ) : (
      <>
        <rect x="38" y="38" width="20" height="20" rx="5" fill="#60A5FA" stroke="#fff" strokeWidth="3" />
        {[
          'M48 6 L48 28 M42 22 L48 28 L54 22',
          'M48 90 L48 68 M42 74 L48 68 L54 74',
          'M6 48 L28 48 M22 42 L28 48 L22 54',
          'M90 48 L68 48 M74 42 L68 48 L74 54',
        ].map((d) => (
          <path key={d} d={d} stroke="#1D4ED8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
      </>
    )}
  </svg>
);

interface BigSmallGameProps {
  soundEnabled: boolean;
}

interface Round {
  item: MiniGameAssetItem;
  ask: Ask;
  bigOnLeft: boolean;
}

function buildRounds(): Round[] {
  const pool = [...STICKER_SETS.food, ...STICKER_SETS.animals, ...STICKER_SETS.objects].filter((s) => s.src);
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
  return shuffled.map((item, i) => ({
    item,
    ask: Math.random() < 0.5 ? 'big' : 'small',
    bigOnLeft: i % 2 === 0 ? Math.random() < 0.5 : Math.random() < 0.5,
  }));
}

export const BigSmallGame: React.FC<BigSmallGameProps> = ({ soundEnabled }) => {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds());
  const [idx, setIdx] = useState(0);
  const [won, setWon] = useState<'big' | 'small' | null>(null);
  const [wobble, setWobble] = useState<'big' | 'small' | null>(null);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const round = rounds[idx];

  const askAloud = useCallback(() => {
    if (round) playVoice(round.ask === 'big' ? 'big_1' : 'small_1', soundEnabled, undefined, 'replace');
  }, [round, soundEnabled]);

  // новый вопрос — помощник произносит его вслух
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(askAloud, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done, rounds]);

  const restart = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setRounds(buildRounds());
    setIdx(0);
    setWon(null);
    setWobble(null);
    setDone(false);
  }, []);

  const pick = (which: 'big' | 'small') => {
    if (won || done) return;
    if (which === round.ask) {
      setWon(which);
      soundEngine.playGameOk(soundEnabled, idx);
      later(() => whenVoiceIdle(() => {
        if (idx + 1 >= ROUNDS) {
          setDone(true);
        } else {
          setIdx(idx + 1);
          setWon(null);
        }
      }), 1100);
    } else {
      setWobble(which);
      soundEngine.playGamePop(soundEnabled, 0);
      later(() => setWobble(null), 500);
    }
  };

  const sizes = useMemo(() => ({ big: 1, small: SMALL_RATIO }), []);

  if (!round) return null;

  const cells: Array<'big' | 'small'> = round.bigOnLeft ? ['big', 'small'] : ['small', 'big'];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 toy-panel overflow-hidden select-none touch-none">
      <div className="w-full flex items-center justify-between gap-2 shrink-0">
        <div className="toy-pill flex items-center gap-1.5 px-3 py-2">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <span
              key={i}
              className="block w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[3px] border-white"
              style={{ background: i < idx || done ? '#FF8A3D' : i === idx ? '#FFD84D' : '#F3EEE6' }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            restart();
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Что нужно найти */}
      <div className="toy-chip px-4 py-2 animate-pulse shrink-0 cursor-pointer" key={`ask-${idx}`} onClick={askAloud} role="button" aria-label="Повторить вопрос">
        <ConceptIcon ask={round.ask} className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>

      <div className="flex-1 w-full min-h-0 grid grid-cols-2 gap-3 items-end pb-4">
        {cells.map((which) => {
          const isWon = won === which;
          return (
            <button
              key={which}
              type="button"
              onPointerDown={() => pick(which)}
              aria-label={which === 'big' ? 'Большой' : 'Маленький'}
              className="h-full flex items-end justify-center cursor-pointer outline-none"
            >
              <img
                src={round.item.src}
                alt=""
                draggable={false}
                style={{ width: `${sizes[which] * 88}%`, maxHeight: `${sizes[which] * 100}%` }}
                className={`object-contain drop-shadow-[0_12px_10px_rgba(80,40,0,0.3)] transition-transform duration-300 pointer-events-none ${
                  isWon ? 'scale-125 -translate-y-4' : ''
                } ${wobble === which ? 'animate-gentle-shake' : ''}`}
              />
            </button>
          );
        })}
      </div>

      <RoundReplayOverlay open={done} soundEnabled={soundEnabled} onReplay={restart} />
    </div>
  );
};
