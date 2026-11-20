import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dices, Heart, RotateCw } from 'lucide-react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import {
  CHARACTER_FAVORITES,
  getCharacterEatAnimationUrl,
  MAX_GAME_LEVELS,
  MINI_FOOD_ITEMS,
  MINI_FOOD_POOL,
  MiniGameAssetItem,
  loadMiniGamesProgress,
  recordGameMistake,
  recordRoundComplete,
  setManualGameLevel,
} from '../data/miniGamesData';
import { Reaction, pickReaction, REACTIONS } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { sayName } from '../utils/nameVoice';
import {
  IdleHandPointer,
  LevelStarsBar,
  RoundReplayOverlay,
  useIdleHint,
} from './MiniGameShell';

interface FeedGameProps {
  initialCharacter: CharacterItem;
  soundEnabled: boolean;
}

interface HeartParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  kind: 'heart' | 'crumb';
  color: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getLevelConfig(level: number): {
  targetHearts: number;
  wantsCount: number;
  shelfSize: number;
  hasDisliked: boolean;
} {
  if (level <= 1) return { targetHearts: 3, wantsCount: 1, shelfSize: 3, hasDisliked: false };
  if (level === 2) return { targetHearts: 4, wantsCount: 1, shelfSize: 4, hasDisliked: false };
  if (level === 3) return { targetHearts: 4, wantsCount: 2, shelfSize: 5, hasDisliked: false };
  return { targetHearts: 5, wantsCount: 3, shelfSize: 5, hasDisliked: true };
}

export const FeedGame: React.FC<FeedGameProps> = ({
  initialCharacter,
  soundEnabled,
}) => {
  const [hero, setHero] = useState<CharacterItem>(initialCharacter);
  // Только самый сложный уровень — выбор сложности убран
  const level = MAX_GAME_LEVELS.feed;
  const setLevel = (_lvl: number) => {};

  const cfg = useMemo(() => getLevelConfig(level), [level]);

  const [filledHearts, setFilledHearts] = useState(0);
  const [wishes, setWishes] = useState<MiniGameAssetItem[]>([]);
  const [shelfItems, setShelfItems] = useState<MiniGameAssetItem[]>([]);
  const [dislikedId, setDislikedId] = useState<string | null>(null);
  const [mistakesInRound, setMistakesInRound] = useState(0);

  const [isEating, setIsEating] = useState<'none' | 'favorite' | 'neutral'>('none');
  const [eatAnimKey, setEatAnimKey] = useState(0);
  const [reaction, setReaction] = useState<Reaction>(REACTIONS.chewing);
  const [heroShake, setHeroShake] = useState(false);
  const [bellyHappy, setBellyHappy] = useState(false);
  const [bouncedShelfId, setBouncedShelfId] = useState<string | null>(null);
  const [roundDone, setRoundDone] = useState(false);

  const [dragState, setDragState] = useState<{
    item: MiniGameAssetItem;
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const [isOverMouth, setIsOverMouth] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const heroBoxRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<HeartParticle[]>([]);
  const eatTimerRef = useRef<number | null>(null);
  const prevOverMouthRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const { showHint, resetIdle } = useIdleHint(6000, !roundDone && isEating === 'none');

  const buildTurn = useCallback(
    (character: CharacterItem, turnLevel: number) => {
      const turnCfg = getLevelConfig(turnLevel);
      const favIds = CHARACTER_FAVORITES[character.id] ?? CHARACTER_FAVORITES.bunny;
      const favPool = favIds
        .map((id) => MINI_FOOD_ITEMS[id])
        .filter((x): x is MiniGameAssetItem => Boolean(x));
      const neutralPool = MINI_FOOD_POOL.filter((item) => !favIds.includes(item.id));

      const chosenWishes = shuffleArray(favPool).slice(0, Math.min(turnCfg.wantsCount, favPool.length));
      const distractorCount = Math.max(1, turnCfg.shelfSize - chosenWishes.length);
      const chosenNeutrals = shuffleArray(neutralPool).slice(0, distractorCount);
      const pickedDisliked =
        turnCfg.hasDisliked && chosenNeutrals.length > 0 ? chosenNeutrals[0].id : null;

      setWishes(chosenWishes);
      setShelfItems(shuffleArray([...chosenWishes, ...chosenNeutrals]).slice(0, turnCfg.shelfSize));
      setDislikedId(pickedDisliked);
    },
    []
  );

  const startRound = useCallback(
    (targetHero: CharacterItem, targetLevel: number) => {
      if (eatTimerRef.current) {
        window.clearTimeout(eatTimerRef.current);
        eatTimerRef.current = null;
      }
      setFilledHearts(0);
      setMistakesInRound(0);
      setIsEating('none');
      setBellyHappy(false);
      setHeroShake(false);
      setRoundDone(false);
      buildTurn(targetHero, targetLevel);
      resetIdle();
    },
    [buildTurn, resetIdle]
  );

  useEffect(() => {
    startRound(hero, level);
    // Only run initial/hero-triggered setup via handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Particle loop for floating hearts & crumbs
  useEffect(() => {
    let rafId = 0;
    const render = () => {
      const canvas = particleCanvasRef.current;
      const stage = stageRef.current;
      if (canvas && stage) {
        const rect = stage.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);

          const alive: HeartParticle[] = [];
          for (const p of particlesRef.current) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.kind === 'crumb' ? 0.14 : -0.02;
            p.alpha -= 0.016;
            if (p.alpha <= 0.02) continue;
            alive.push(p);

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            if (p.kind === 'heart') {
              const s = p.size;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.moveTo(0, s * 0.35);
              ctx.bezierCurveTo(-s * 0.6, -s * 0.35, -s * 1.15, s * 0.35, 0, s * 1.05);
              ctx.bezierCurveTo(s * 1.15, s * 0.35, s * 0.6, -s * 0.35, 0, s * 0.35);
              ctx.fill();
            } else {
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
          particlesRef.current = alive;
        }
      }
      rafId = window.requestAnimationFrame(render);
    };
    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const spawnMouthParticles = useCallback((kind: 'favorite' | 'neutral') => {
    const heroBox = heroBoxRef.current;
    const stageBox = stageRef.current;
    if (!heroBox || !stageBox) return;
    const hr = heroBox.getBoundingClientRect();
    const sr = stageBox.getBoundingClientRect();
    const cx = hr.left - sr.left + hr.width * 0.5;
    const cy = hr.top - sr.top + hr.height * Math.min(0.75, hero.faceMaskAnchor.y + 0.08);

    const colors = ['#FF4D6D', '#FB7185', '#FACC15', '#F97316'];
    const count = kind === 'favorite' ? 14 : 6;
    for (let i = 0; i < count; i++) {
      const isHeart = kind === 'favorite' && i % 2 === 0;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 44,
        y: cy + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3.2,
        vy: isHeart ? -(1.4 + Math.random() * 2.1) : -(1.2 + Math.random() * 2.5),
        size: isHeart ? 9 + Math.random() * 6 : 3.5 + Math.random() * 3,
        alpha: 1,
        kind: isHeart ? 'heart' : 'crumb',
        color: colors[i % colors.length],
      });
    }
  }, [hero.faceMaskAnchor.y]);

  const checkMouthHit = useCallback(
    (clientX: number, clientY: number): boolean => {
      const heroEl = heroBoxRef.current;
      if (!heroEl) return false;
      const r = heroEl.getBoundingClientRect();
      const mouthYFrac = Math.min(0.78, hero.faceMaskAnchor.y + 0.09);
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * mouthYFrac;
      const rx = r.width * 0.31 * Math.max(0.85, hero.faceMaskAnchor.scale);
      const ry = r.height * 0.23 * Math.max(0.85, hero.faceMaskAnchor.scale);
      const dx = (clientX - cx) / rx;
      const dy = (clientY - cy) / ry;
      return dx * dx + dy * dy <= 1;
    },
    [hero.faceMaskAnchor.scale, hero.faceMaskAnchor.y]
  );

  const handleFoodDropOnMouth = useCallback(
    (item: MiniGameAssetItem) => {
      const isWanted = wishes.some((w) => w.id === item.id);
      const isDisliked = dislikedId === item.id;

      if (isDisliked) {
        setHeroShake(true);
        setMistakesInRound((m) => m + 1);
        const newLvl = recordGameMistake('feed');
        setLevel(newLvl);
        soundEngine.playGameFail(soundEnabled);
        window.setTimeout(() => setHeroShake(false), 720);
        return;
      }

      if (isWanted) {
        const nextHearts = filledHearts + 1;
        const remainingWishes = wishes.filter((w) => w.id !== item.id);
        setIsEating('favorite');
        setReaction(pickReaction('feed_favorite', hero.id));
        setEatAnimKey((k) => k + 1);
        setFilledHearts(nextHearts);
        setWishes(remainingWishes);
        spawnMouthParticles('favorite');
        soundEngine.playGameChomp(soundEnabled);
        soundEngine.playGameOk(soundEnabled, nextHearts - 1);

        const done = nextHearts >= cfg.targetHearts;
        if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
        eatTimerRef.current = window.setTimeout(() => {
          setIsEating('none');
          if (done) {
            setBellyHappy(true);
            const nextLevel = recordRoundComplete('feed', mistakesInRound === 0);
            setLevel(nextLevel);
            window.setTimeout(() => {
              setRoundDone(true);
            }, 520);
          } else if (remainingWishes.length === 0) {
            buildTurn(hero, level);
          } else {
            // Keep remaining wishes + restock shelf with them visible
            const favIds = CHARACTER_FAVORITES[hero.id] ?? CHARACTER_FAVORITES.bunny;
            const neutrals = shuffleArray(
              MINI_FOOD_POOL.filter((f) => !favIds.includes(f.id) && !remainingWishes.some((w) => w.id === f.id))
            ).slice(0, Math.max(1, cfg.shelfSize - remainingWishes.length));
            setShelfItems(shuffleArray([...remainingWishes, ...neutrals]).slice(0, cfg.shelfSize));
          }
        }, 2150);
      } else {
        // Neutral food: polite fast chew, zero punishment
        setIsEating('neutral');
        setReaction(pickReaction('feed_neutral', hero.id));
        setEatAnimKey((k) => k + 1);
        spawnMouthParticles('neutral');
        soundEngine.playGameChomp(soundEnabled);

        if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
        eatTimerRef.current = window.setTimeout(() => {
          setIsEating('none');
        }, 1450);
      }
    },
    [
      buildTurn,
      cfg.shelfSize,
      cfg.targetHearts,
      dislikedId,
      filledHearts,
      hero,
      level,
      mistakesInRound,
      soundEnabled,
      spawnMouthParticles,
      wishes,
    ]
  );

  // Global pointer drag listeners
  useEffect(() => {
    if (!dragState) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
      const hit = checkMouthHit(e.clientX, e.clientY);
      setIsOverMouth(hit);
      if (hit && !prevOverMouthRef.current) {
        soundEngine.playGameAnticipate(soundEnabled);
      }
      prevOverMouthRef.current = hit;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const start = dragStartRef.current;
      const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 99;
      const droppedOnMouth = checkMouthHit(e.clientX, e.clientY);

      setDragState(null);
      setIsOverMouth(false);
      prevOverMouthRef.current = false;
      dragStartRef.current = null;

      if (droppedOnMouth) {
        handleFoodDropOnMouth(dragState.item);
      } else if (dist < 10) {
        // Tap bounce feedback
        setBouncedShelfId(dragState.item.id);
        soundEngine.playGamePop(soundEnabled, 2);
        window.setTimeout(() => {
          setBouncedShelfId((prev) => (prev === dragState.item.id ? null : prev));
        }, 300);
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
  }, [checkMouthHit, dragState, handleFoodDropOnMouth, soundEnabled]);

  const handleCycleHero = () => {
    resetIdle();
    const others = CHARACTERS.filter((c) => c.id !== hero.id);
    const nextHero = others[Math.floor(Math.random() * others.length)] ?? CHARACTERS[0];
    setHero(nextHero);
    soundEngine.playGamePop(soundEnabled, 4);
    startRound(nextHero, level);
  };

  const handleManualLevel = (lvl: number) => {
    resetIdle();
    const updated = setManualGameLevel('feed', lvl);
    setLevel(updated);
    soundEngine.playGamePop(soundEnabled, lvl);
    startRound(hero, updated);
  };

  const firstWanted = wishes[0] ?? null;
  const mouthOverlayTopPct = Math.min(76, Math.round((hero.faceMaskAnchor.y + 0.08) * 100));

  return (
    <div
      ref={stageRef}
      onPointerDown={resetIdle}
      className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 bg-gradient-to-b from-[#FFFDF7] via-[#FFF6E5] to-[#FFEAD2] rounded-3xl border-2 border-[#EAE2D3] shadow-sm overflow-hidden select-none touch-none"
    >
      {/* Top HUD: random hero dice + satiety hearts + level stars + replay */}
      <div className="w-full flex items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCycleHero}
            aria-label="Случайный герой"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-[#FEF3C7] border-2 border-[#F59E0B] text-[#D97706] shadow-[0_4px_0_#F59E0B] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          >
            <Dices className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Satiety Hearts */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 border-2 border-[#FECDD3] rounded-full px-3 sm:px-4 py-1.5 shadow-xs">
          {Array.from({ length: cfg.targetHearts }).map((_, idx) => {
            const full = idx < filledHearts;
            return (
              <Heart
                key={idx}
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300 ${
                  full
                    ? 'text-[#F43F5E] fill-[#F43F5E] scale-110'
                    : 'text-[#FDA4AF] fill-[#FFF1F2]'
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            startRound(hero, level);
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Center Stage: Thought Wish Bubble + Hero */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-0 gap-1 sm:gap-2 z-10">
        {/* Thought Bubble */}
        {wishes.length > 0 && !bellyHappy && (
          <div className="relative flex items-center gap-2 sm:gap-3 bg-white border-3 border-[#FDE047] rounded-[28px] px-4 py-2 sm:px-5 sm:py-2.5 shadow-[0_6px_0_#FDE68A,0_10px_20px_rgba(0,0,0,0.08)] animate-pop-in">
            {wishes.map((w) => (
              <div
                key={w.id}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFFBEB] border-2 border-[#FEF08A] p-1.5 flex items-center justify-center ${
                  level === 1 || showHint ? 'animate-pulse ring-3 ring-[#FFB800]' : 'animate-gentle-float'
                }`}
              >
                <img
                  src={w.src}
                  alt={w.label}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>
            ))}
            {/* Bubble tail dots */}
            <div
              aria-hidden="true"
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#FDE047]"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-6 left-1/2 -translate-x-2.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#FDE047]"
            />
          </div>
        )}

        {/* Hero Portrait / Eat WebP Frame */}
        <div
          ref={heroBoxRef}
          className={`relative aspect-square w-[min(46vw,240px)] sm:w-[min(36vh,280px)] rounded-[36px] border-4 border-white shadow-[0_14px_32px_rgba(180,83,9,0.16)] overflow-hidden transition-transform duration-200 ${
            heroShake
              ? 'animate-gentle-shake'
              : bellyHappy
              ? 'scale-110 ring-4 ring-[#FACC15]'
              : isOverMouth
              ? 'scale-[1.06] ring-4 ring-[#FF6B4A]'
              : isEating === 'none'
              ? 'animate-hero-breathe'
              : ''
          }`}
          style={{ backgroundColor: hero.accentBg }}
        >
          {isEating !== 'none' ? (
            <ReactionHero
              character={hero}
              reaction={reaction}
              runKey={`${hero.id}_eat_${eatAnimKey}`}
              eatSrc={getCharacterEatAnimationUrl(hero.id)}
            />
          ) : (
            <img
              src={hero.imageSrc}
              alt={hero.name}
              draggable={false}
              className="w-full h-full object-cover object-top pointer-events-none select-none"
            />
          )}

          {/* Soft glow mouth zone while dragging food */}
          {dragState && isEating === 'none' && (
            <div
              aria-hidden="true"
              style={{ top: `${mouthOverlayTopPct}%` }}
              className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] h-[24%] rounded-full border-3 border-dashed transition-all duration-150 pointer-events-none ${
                isOverMouth
                  ? 'border-[#FF6B4A] bg-[#FF6B4A]/25 scale-125'
                  : 'border-[#FBBF24]/80 bg-[#FEF3C7]/20'
              }`}
            />
          )}
        </div>
      </div>

      {/* Bottom Wooden / Cloud Food Shelf */}
      <div className="relative w-full max-w-[740px] flex items-center justify-center gap-2.5 sm:gap-4 px-3 py-2.5 sm:py-3 toy-panel z-20 shrink-0">
        {shelfItems.map((item) => {
          const isBeingDragged = dragState?.item.id === item.id;
          const isHinted = (level === 1 || showHint) && firstWanted?.id === item.id && isEating === 'none';
          const isBounced = bouncedShelfId === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                disabled={isEating !== 'none' || roundDone}
                onPointerDown={(e) => {
                  if (isEating !== 'none' || roundDone) return;
                  e.preventDefault();
                  resetIdle();
                  dragStartRef.current = { x: e.clientX, y: e.clientY };
                  soundEngine.playGamePop(soundEnabled, 1);
                  sayName(item.label);
                  setDragState({
                    item,
                    x: e.clientX,
                    y: e.clientY,
                    pointerId: e.pointerId,
                  });
                }}
                aria-label={item.label}
                className={`w-[74px] h-[74px] sm:w-[92px] sm:h-[92px] toy-chip p-2 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all touch-none ${
                  isBeingDragged
                    ? 'opacity-30 scale-95 bg-[#FAF8F4] border-[#E5DFD2]'
                    : isHinted
                    ? 'toy-chip-on'
                    : 'hover:scale-105'
                } ${isBounced ? '-translate-y-2 scale-110' : ''}`}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </button>

              {showHint && firstWanted?.id === item.id && !dragState && isEating === 'none' && (
                <IdleHandPointer className="absolute -top-7 right-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Dragged Food */}
      {dragState && (
        <div
          aria-hidden="true"
          style={{
            left: dragState.x,
            top: dragState.y,
            transform: 'translate(-50%, -50%) scale(1.14)',
          }}
          className="fixed z-50 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none select-none"
        >
          <img
            src={dragState.item.src}
            alt=""
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.28)]"
          />
        </div>
      )}

      {/* Hearts & Crumbs Particle Canvas */}
      <canvas
        ref={particleCanvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {/* Round Replay Overlay */}
      <RoundReplayOverlay
        open={roundDone}
        soundEnabled={soundEnabled}
        onReplay={() => startRound(hero, level)}
      />
    </div>
  );
};
