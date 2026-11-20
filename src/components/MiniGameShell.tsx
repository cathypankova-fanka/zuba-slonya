import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, Star } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { isVoiceEnabled, sayRandom } from '../utils/voice';

export function useIdleHint(timeoutMs = 6000, active = true) {
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<number | null>(null);

  const resetIdle = useCallback(() => {
    setShowHint(false);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!active) return;
    timerRef.current = window.setTimeout(() => {
      setShowHint(true);
      sayRandom('hint', 6, isVoiceEnabled());
    }, timeoutMs);
  }, [active, timeoutMs]);

  useEffect(() => {
    resetIdle();
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [resetIdle]);

  return { showHint, resetIdle };
}

export const IdleHandPointer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none select-none z-40 animate-hand-bob ${className}`}
  >
    <div className="w-14 h-14 rounded-full bg-white/95 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border-2 border-[#FFB800] flex items-center justify-center text-3xl leading-none">
      👆
    </div>
  </div>
);

/** Глянцевая звезда: золотая — получена, серая — ещё нет */
export const GlossyStar: React.FC<{ on?: boolean; className?: string; uid?: string }> = ({
  on = true,
  className = 'w-8 h-8',
  uid = 'a',
}) => {
  const g = `gs-${uid}-${on ? 'on' : 'off'}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          {on ? (
            <>
              <stop offset="0" stopColor="#FFE76B" />
              <stop offset="1" stopColor="#FF9F1A" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#E9E4DA" />
              <stop offset="1" stopColor="#C9C2B4" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M24 3.5l5.9 12.1 13.3 1.9-9.6 9.4 2.3 13.2L24 33.8l-11.9 6.3 2.3-13.2-9.6-9.4 13.3-1.9z"
        fill={`url(#${g})`}
        stroke={on ? '#D97706' : '#B3AB9B'}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {on && <path d="M17 14l5-6" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />}
    </svg>
  );
};

/** Уровень: звёзды растут по размеру — чем больше, тем сложнее */
export const LevelStarsBar: React.FC<{
  level: number;
  maxLevel: number;
  onSelectLevel?: (lvl: number) => void;
}> = ({ level, maxLevel, onSelectLevel }) => (
  <div className="toy-pill flex items-end gap-0.5 px-2.5 py-1">
    {Array.from({ length: maxLevel }).map((_, idx) => {
      const starLevel = idx + 1;
      const active = starLevel <= level;
      const current = starLevel === level;
      return (
        <button
          key={starLevel}
          type="button"
          onClick={() => onSelectLevel?.(starLevel)}
          aria-label={`Уровень ${starLevel}`}
          className={`rounded-full transition-transform active:scale-90 cursor-pointer ${
            current ? 'scale-110 drop-shadow-[0_0_6px_rgba(255,170,40,0.9)]' : ''
          }`}
        >
          <GlossyStar
            on={active}
            uid={`lv${starLevel}`}
            className={`${['w-6 h-6', 'w-7 h-7', 'w-8 h-8', 'w-9 h-9', 'w-10 h-10'][Math.min(idx, 4)]} sm:scale-110`}
          />
        </button>
      );
    })}
  </div>
);

interface RoundReplayOverlayProps {
  open: boolean;
  soundEnabled: boolean;
  onReplay: () => void;
}

export const RoundReplayOverlay: React.FC<RoundReplayOverlayProps> = ({
  open,
  soundEnabled,
  onReplay,
}) => {
  useEffect(() => {
    if (!open) return;
    soundEngine.playGameReward(soundEnabled);
    window.setTimeout(() => sayRandom('win', 6, soundEnabled), 500);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void confetti({
        particleCount: 85,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#FF3B5C', '#FFC700', '#10C97A', '#38BDF8', '#A855F7', '#FF7A1A'],
        disableForReducedMotion: true,
      });
    }
  }, [open, soundEnabled]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Сыграть ещё раз"
    >
      <button
        type="button"
        onClick={onReplay}
        aria-label="Играть ещё раз"
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-4 border-white text-white shadow-[0_8px_0_#C2410C,0_16px_32px_rgba(249,115,22,0.42)] active:translate-y-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 animate-pop-in"
      >
        <RotateCw className="w-12 h-12 sm:w-14 sm:h-14 stroke-[3]" />
      </button>
    </div>
  );
};
