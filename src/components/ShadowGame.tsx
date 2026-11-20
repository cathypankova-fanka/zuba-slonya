import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCw, Sparkles } from 'lucide-react';
import {
  MAX_GAME_LEVELS,
  MiniGameAssetItem,
  PoolSetKey,
  STICKER_SETS,
  loadMiniGamesProgress,
  recordGameMistake,
  recordRoundComplete,
  setManualGameLevel,
} from '../data/miniGamesData';
import { soundEngine } from '../utils/soundEngine';
import {
  IdleHandPointer,
  LevelStarsBar,
  RoundReplayOverlay,
  useIdleHint,
} from './MiniGameShell';

interface ShadowGameProps {
  soundEnabled: boolean;
}

interface ProcessedSprite {
  silhouetteUrl: string;
  aspect: number;
  fill: number;
  maskSize: number;
  alphaGrid: Uint8Array;
}

const spriteCache = new Map<string, Promise<ProcessedSprite>>();

function loadProcessedSprite(src: string): Promise<ProcessedSprite> {
  const existing = spriteCache.get(src);
  if (existing) return existing;

  const promise = new Promise<ProcessedSprite>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 256;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const w = Math.max(16, Math.round((img.naturalWidth || 128) * scale));
      const h = Math.max(16, Math.round((img.naturalHeight || 128) * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          silhouetteUrl: src,
          aspect: 1,
          fill: 0.6,
          maskSize: 32,
          alphaGrid: new Uint8Array(32 * 32).fill(1),
        });
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Compute tight bbox & fill ratio
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;
      let opaque = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = data[(y * w + x) * 4 + 3];
          if (a >= 28) {
            opaque++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const bw = Math.max(1, maxX - minX + 1);
      const bh = Math.max(1, maxY - minY + 1);
      const aspect = bw / bh;
      const fill = opaque / (bw * bh);

      // Build 32x32 sampled alpha mask for pixel hit-testing
      const maskSize = 32;
      const alphaGrid = new Uint8Array(maskSize * maskSize);
      for (let gy = 0; gy < maskSize; gy++) {
        const sy = Math.min(h - 1, Math.floor(((gy + 0.5) / maskSize) * h));
        for (let gx = 0; gx < maskSize; gx++) {
          const sx = Math.min(w - 1, Math.floor(((gx + 0.5) / maskSize) * w));
          alphaGrid[gy * maskSize + gx] = data[(sy * w + sx) * 4 + 3] >= 24 ? 1 : 0;
        }
      }

      // Generate flat slate silhouette (#334155)
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, w, h);
      const silhouetteUrl = canvas.toDataURL('image/png');

      resolve({ silhouetteUrl, aspect, fill, maskSize, alphaGrid });
    };
    img.onerror = () => {
      resolve({
        silhouetteUrl: src,
        aspect: 1,
        fill: 0.6,
        maskSize: 32,
        alphaGrid: new Uint8Array(32 * 32).fill(1),
      });
    };
    img.src = src;
  });

  spriteCache.set(src, promise);
  return promise;
}

function hitTestAlphaGrid(sprite: ProcessedSprite | undefined, nx: number, ny: number): boolean {
  if (!sprite) return true;
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return false;
  const g = sprite.maskSize;
  const cx = Math.floor(nx * g);
  const cy = Math.floor(ny * g);
  // Generous 2-cell radius (~12px padding) so small fingers never get rejected right along edges
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const tx = cx + dx;
      const ty = cy + dy;
      if (tx >= 0 && tx < g && ty >= 0 && ty < g) {
        if (sprite.alphaGrid[ty * g + tx] === 1) return true;
      }
    }
  }
  return false;
}

function getShadowLevelConfig(level: number): {
  shadowsCount: number;
  sets: PoolSetKey[];
  preferDissimilar: boolean;
} {
  if (level <= 1) return { shadowsCount: 2, sets: ['food'], preferDissimilar: true };
  if (level === 2) return { shadowsCount: 3, sets: ['food', 'transport'], preferDissimilar: true };
  if (level === 3) return { shadowsCount: 3, sets: ['animals'], preferDissimilar: false };
  if (level === 4) return { shadowsCount: 4, sets: ['animals', 'objects'], preferDissimilar: false };
  return {
    shadowsCount: 4,
    sets: ['food', 'transport', 'animals', 'objects'],
    preferDissimilar: false,
  };
}

function shuffleArr<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_STEPS = 5;

export const ShadowGame: React.FC<ShadowGameProps> = ({ soundEnabled }) => {
  // Только самый сложный уровень — выбор сложности убран
  const level = MAX_GAME_LEVELS.shadow;
  const setLevel = (_lvl: number) => {};
  const [stepIndex, setStepIndex] = useState(0);
  const [mistakesOnItem, setMistakesOnItem] = useState(0);
  const [mistakesInRound, setMistakesInRound] = useState(0);

  const [target, setTarget] = useState<MiniGameAssetItem>(STICKER_SETS.food[0]);
  const [choices, setChoices] = useState<MiniGameAssetItem[]>([]);
  const [processedMap, setProcessedMap] = useState<Record<string, ProcessedSprite>>({});

  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState<{ x: number; y: number } | null>(null);
  const [roundDone, setRoundDone] = useState(false);

  const [dragState, setDragState] = useState<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);

  const shadowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const targetBoxRef = useRef<HTMLDivElement | null>(null);
  const lastTargetIdRef = useRef<string | null>(null);

  const { showHint, resetIdle } = useIdleHint(6000, !roundDone && !matchedId && !flyingTo);

  const preparePuzzle = useCallback(
    async (lvl: number) => {
      const cfg = getShadowLevelConfig(lvl);
      const chosenSetKey = cfg.sets[Math.floor(Math.random() * cfg.sets.length)];
      const pool = STICKER_SETS[chosenSetKey];

      const eligibleTargets = pool.filter((item) => item.id !== lastTargetIdRef.current);
      const pickedTarget =
        eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)] ?? pool[0];
      lastTargetIdRef.current = pickedTarget.id;

      // Preload target + pool silhouettes to rank shape similarity
      const candidates = shuffleArr(pool.filter((i) => i.id !== pickedTarget.id)).slice(0, 12);
      const allToLoad = [pickedTarget, ...candidates];
      const loaded = await Promise.all(allToLoad.map((item) => loadProcessedSprite(item.src)));

      const mapPatch: Record<string, ProcessedSprite> = {};
      allToLoad.forEach((item, idx) => {
        mapPatch[item.id] = loaded[idx];
      });
      setProcessedMap((prev) => ({ ...prev, ...mapPatch }));

      const targetShape = mapPatch[pickedTarget.id];
      const scored = candidates
        .map((c) => {
          const cs = mapPatch[c.id];
          const diff =
            Math.abs(targetShape.aspect - cs.aspect) + Math.abs(targetShape.fill - cs.fill) * 1.4;
          return { item: c, diff };
        })
        .sort((a, b) => (cfg.preferDissimilar ? b.diff - a.diff : a.diff - b.diff));

      const distractors = scored.slice(0, cfg.shadowsCount - 1).map((s) => s.item);

      setTarget(pickedTarget);
      setChoices(shuffleArr([pickedTarget, ...distractors]));
      setMatchedId(null);
      setShakingId(null);
      setHoveredId(null);
      setFlyingTo(null);
      setMistakesOnItem(0);
    },
    []
  );

  const startRound = useCallback(
    (lvl: number) => {
      setStepIndex(0);
      setMistakesInRound(0);
      setRoundDone(false);
      void preparePuzzle(lvl);
      resetIdle();
    },
    [preparePuzzle, resetIdle]
  );

  useEffect(() => {
    startRound(level);
    // Initial round setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findHitShadowId = useCallback(
    (clientX: number, clientY: number): string | null => {
      for (const ch of choices) {
        const btn = shadowRefs.current[ch.id];
        if (!btn) continue;
        const rect = btn.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          const nx = (clientX - rect.left) / Math.max(1, rect.width);
          const ny = (clientY - rect.top) / Math.max(1, rect.height);
          if (hitTestAlphaGrid(processedMap[ch.id], nx, ny)) {
            return ch.id;
          }
        }
      }
      return null;
    },
    [choices, processedMap]
  );

  const evaluateGuess = useCallback(
    (guessedId: string) => {
      if (matchedId || roundDone) return;
      if (guessedId === target.id) {
        setMatchedId(guessedId);
        soundEngine.playGameOk(soundEnabled, stepIndex);
        const nextStep = stepIndex + 1;

        window.setTimeout(() => {
          if (nextStep >= ROUND_STEPS) {
            setStepIndex(ROUND_STEPS);
            const nextLevel = recordRoundComplete('shadow', mistakesInRound === 0);
            setLevel(nextLevel);
            setRoundDone(true);
          } else {
            setStepIndex(nextStep);
            void preparePuzzle(level);
          }
        }, 720);
      } else {
        setShakingId(guessedId);
        setMistakesOnItem((m) => m + 1);
        setMistakesInRound((m) => m + 1);
        const nextLvl = recordGameMistake('shadow');
        setLevel(nextLvl);
        soundEngine.playGameFail(soundEnabled);
        window.setTimeout(() => {
          setShakingId((prev) => (prev === guessedId ? null : prev));
        }, 700);
      }
    },
    [
      level,
      matchedId,
      mistakesInRound,
      preparePuzzle,
      roundDone,
      soundEnabled,
      stepIndex,
      target.id,
    ]
  );

  // Drag listeners on target object
  useEffect(() => {
    if (!dragState) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
      setHoveredId(findHitShadowId(e.clientX, e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const hitId = findHitShadowId(e.clientX, e.clientY);
      setDragState(null);
      setHoveredId(null);
      if (hitId) {
        evaluateGuess(hitId);
      } else {
        soundEngine.playGamePop(soundEnabled, 0);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragState, evaluateGuess, findHitShadowId, soundEnabled]);

  const handleTapShadow = (choiceId: string) => {
    if (matchedId || flyingTo || roundDone) return;
    resetIdle();
    const shadowEl = shadowRefs.current[choiceId];
    const targetEl = targetBoxRef.current;
    if (!shadowEl || !targetEl) {
      evaluateGuess(choiceId);
      return;
    }

    const sr = shadowEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();
    const dx = sr.left + sr.width / 2 - (tr.left + tr.width / 2);
    const dy = sr.top + sr.height / 2 - (tr.top + tr.height / 2);

    soundEngine.playGamePop(soundEnabled, 2);
    setFlyingTo({ x: dx, y: dy });

    window.setTimeout(() => {
      setFlyingTo(null);
      evaluateGuess(choiceId);
    }, 260);
  };

  const handleManualLevel = (lvl: number) => {
    resetIdle();
    const next = setManualGameLevel('shadow', lvl);
    setLevel(next);
    soundEngine.playGamePop(soundEnabled, lvl);
    startRound(next);
  };

  const pulseCorrect = mistakesOnItem >= 2 || showHint;
  const colsClass = useMemo(() => {
    if (choices.length <= 2) return 'grid-cols-2 max-w-[420px]';
    if (choices.length === 3) return 'grid-cols-3 max-w-[600px]';
    return 'grid-cols-2 sm:grid-cols-4 max-w-[740px]';
  }, [choices.length]);

  return (
    <div
      onPointerDown={resetIdle}
      className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 bg-gradient-to-b from-[#F0F9FF] via-[#F8FAFC] to-[#EEF2FF] rounded-3xl border-2 border-[#DBEAFE] shadow-sm overflow-hidden select-none touch-none"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between gap-2 z-20 shrink-0">

        {/* Progress Dots (5) */}
        <div className="flex items-center gap-2 bg-white/90 border-2 border-[#DBEAFE] rounded-full px-4 py-2 shadow-xs">
          {Array.from({ length: ROUND_STEPS }).map((_, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex && !roundDone;
            return (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  done
                    ? 'w-4 h-4 bg-[#10C97A] scale-110'
                    : current
                    ? 'w-4 h-4 bg-[#38BDF8] ring-3 ring-[#BAE6FD]'
                    : 'w-3.5 h-3.5 bg-[#E2E8F0]'
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            startRound(level);
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Top Colored Target Item */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <div
          ref={targetBoxRef}
          onPointerDown={(e) => {
            if (matchedId || flyingTo || roundDone) return;
            e.preventDefault();
            resetIdle();
            soundEngine.playGamePop(soundEnabled, 1);
            setDragState({ x: e.clientX, y: e.clientY, pointerId: e.pointerId });
          }}
          style={
            flyingTo
              ? {
                  transform: `translate(${flyingTo.x}px, ${flyingTo.y}px) scale(0.85)`,
                  transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }
              : undefined
          }
          className={`relative w-[150px] h-[150px] sm:w-[210px] sm:h-[210px] rounded-[34px] bg-white border-4 border-[#BAE6FD] shadow-[0_10px_28px_rgba(56,189,248,0.18)] p-4 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none transition-transform ${
            dragState || matchedId ? 'opacity-20 scale-90' : 'animate-pop-in hover:scale-105'
          }`}
        >
          <img
            src={target.src}
            alt={target.label}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.14)]"
          />
        </div>
      </div>

      {/* Bottom Silhouettes Grid */}
      <div className={`w-full grid ${colsClass} gap-3 sm:gap-5 pb-2 z-10 shrink-0`}>
        {choices.map((choice) => {
          const sprite = processedMap[choice.id];
          const isMatch = matchedId === choice.id;
          const isShake = shakingId === choice.id;
          const isHover = hoveredId === choice.id;
          const isCorrectHint = pulseCorrect && choice.id === target.id && !matchedId;

          return (
            <div key={choice.id} className="relative flex items-center justify-center">
              <button
                ref={(el) => {
                  shadowRefs.current[choice.id] = el;
                }}
                type="button"
                onClick={() => handleTapShadow(choice.id)}
                aria-label={choice.label}
                className={`relative w-full aspect-square max-w-[160px] rounded-[28px] border-3 p-3 sm:p-4 flex items-center justify-center cursor-pointer transition-all duration-150 touch-none ${
                  isMatch
                    ? 'bg-[#ECFDF5] border-[#10C97A] shadow-[0_0_24px_rgba(16,201,122,0.45)] scale-105'
                    : isHover
                    ? 'bg-white border-white ring-4 ring-[#38BDF8] shadow-xl scale-105'
                    : isCorrectHint
                    ? 'bg-[#FFFBEB] border-[#FACC15] ring-4 ring-[#FDE047] animate-pulse shadow-lg'
                    : 'bg-white/85 border-[#E2E8F0] shadow-[0_6px_0_#CBD5E1] hover:scale-[1.03] active:translate-y-1'
                } ${isShake ? 'animate-gentle-shake' : ''}`}
              >
                {/* Crisp canvas-generated slate silhouette */}
                <img
                  src={sprite?.silhouetteUrl ?? choice.src}
                  alt=""
                  draggable={false}
                  className={`w-full h-full object-contain pointer-events-none select-none ${
                    !sprite ? 'brightness-0 opacity-75' : ''
                  }`}
                />

                {/* Bottom-to-top color fill reveal on match */}
                {isMatch && (
                  <img
                    src={choice.src}
                    alt={choice.label}
                    draggable={false}
                    className="absolute inset-0 w-full h-full p-3 sm:p-4 object-contain pointer-events-none select-none animate-fill-up"
                  />
                )}

                {isMatch && (
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-[#FACC15] fill-[#FACC15] animate-pop-in" />
                )}
              </button>

              {showHint && choice.id === target.id && !matchedId && (
                <IdleHandPointer className="absolute -top-6 right-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Dragging overlay */}
      {dragState && (
        <div
          aria-hidden="true"
          style={{
            left: dragState.x,
            top: dragState.y,
            transform: 'translate(-50%, -50%) scale(1.08)',
          }}
          className="fixed z-50 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none select-none"
        >
          <img
            src={target.src}
            alt=""
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.28)]"
          />
        </div>
      )}

      {/* Round Replay Overlay */}
      <RoundReplayOverlay
        open={roundDone}
        soundEnabled={soundEnabled}
        onReplay={() => startRound(level)}
      />
    </div>
  );
};
