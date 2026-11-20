import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Music, RotateCw, Sparkles, Target } from 'lucide-react';
import {
  BUBBLE_SPRITE_POOL,
  MAX_GAME_LEVELS,
  MiniGameAssetItem,
  loadMiniGamesProgress,
  recordRoundComplete,
  setManualGameLevel,
} from '../data/miniGamesData';
import { soundEngine } from '../utils/soundEngine';
import { sayName } from '../utils/nameVoice';
import {
  IdleHandPointer,
  LevelStarsBar,
  RoundReplayOverlay,
} from './MiniGameShell';

interface BubblesGameProps {
  soundEnabled: boolean;
}

type BubbleKind = 'normal' | 'double' | 'big' | 'rainbow' | 'empty';
type BubblePlayMode = 'free' | 'goal';

interface ActiveBubble {
  id: number;
  kind: BubbleKind;
  hp: number;
  maxHp: number;
  x0: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  amp: number;
  freq: number;
  phase: number;
  hue: number;
  sprite: MiniGameAssetItem | null;
  crackSeed: number;
  spawnScale: number;
}

interface BurstParticle {
  active: boolean;
  kind: 'drop' | 'ring' | 'spark';
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  maxR: number;
  alpha: number;
  hue: number;
}

interface FlyingSprite {
  active: boolean;
  sprite: MiniGameAssetItem;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
}

const MAX_PARTICLES = 300;

function getBubbleLevelConfig(level: number): {
  maxOnScreen: number;
  minRadius: number;
  maxRadius: number;
  speedRange: [number, number];
  types: BubbleKind[];
  goalTargetCount: number;
} {
  if (level <= 1) {
    return {
      maxOnScreen: 5,
      minRadius: 56,
      maxRadius: 76,
      speedRange: [38, 56],
      types: ['normal', 'normal', 'normal', 'empty'],
      goalTargetCount: 3,
    };
  }
  if (level === 2) {
    return {
      maxOnScreen: 6,
      minRadius: 50,
      maxRadius: 70,
      speedRange: [44, 66],
      types: ['normal', 'normal', 'double', 'big', 'empty'],
      goalTargetCount: 4,
    };
  }
  if (level === 3) {
    return {
      maxOnScreen: 8,
      minRadius: 46,
      maxRadius: 66,
      speedRange: [48, 74],
      types: ['normal', 'double', 'big', 'rainbow', 'empty'],
      goalTargetCount: 4,
    };
  }
  return {
    maxOnScreen: 10,
    minRadius: 42,
    maxRadius: 62,
    speedRange: [54, 82],
    types: ['normal', 'double', 'big', 'rainbow', 'empty'],
    goalTargetCount: 5,
  };
}

export const BubblesGame: React.FC<BubblesGameProps> = ({ soundEnabled }) => {
  // Только самый сложный уровень — выбор сложности убран
  const level = MAX_GAME_LEVELS.bubbles;
  const setLevel = (_lvl: number) => {};
  const [playMode, setPlayMode] = useState<BubblePlayMode>('free');
  const [goalItem, setGoalItem] = useState<MiniGameAssetItem>(BUBBLE_SPRITE_POOL[0]);
  const [goalHits, setGoalHits] = useState(0);
  const [freePops, setFreePops] = useState(0);
  const [collected, setCollected] = useState<MiniGameAssetItem[]>([]);
  const [roundDone, setRoundDone] = useState(false);
  const [idleHintPos, setIdleHintPos] = useState<{ x: number; y: number } | null>(null);

  const cfg = useMemo(() => getBubbleLevelConfig(level), [level]);
  const targetGoalCount = playMode === 'free' ? 12 : cfg.goalTargetCount;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const shelfRef = useRef<HTMLDivElement | null>(null);

  const bubblesRef = useRef<ActiveBubble[]>([]);
  const particlesRef = useRef<BurstParticle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      kind: 'drop',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 4,
      maxR: 40,
      alpha: 0,
      hue: 200,
    }))
  );
  const flyingRef = useRef<FlyingSprite[]>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const nextIdRef = useRef(1);
  const spawnAccumRef = useRef(0);
  const streakCountRef = useRef(0);
  const lastPopAtRef = useRef(performance.now());
  const lastDemoPopAtRef = useRef(0);
  const rewardTriggeredRef = useRef(false);

  const soundEnabledRef = useRef(soundEnabled);
  const playModeRef = useRef(playMode);
  const goalItemRef = useRef(goalItem);
  const cfgRef = useRef(cfg);
  const levelRef = useRef(level);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    playModeRef.current = playMode;
  }, [playMode]);
  useEffect(() => {
    goalItemRef.current = goalItem;
  }, [goalItem]);
  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // Preload sprite images lazily into cache
  const getCachedImage = useCallback((src: string): HTMLImageElement | null => {
    const cache = imageCacheRef.current;
    let img = cache.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      cache.set(src, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }, []);

  useEffect(() => {
    BUBBLE_SPRITE_POOL.slice(0, 32).forEach((s) => {
      getCachedImage(s.src);
    });
  }, [getCachedImage]);

  const startRound = useCallback(
    (mode: BubblePlayMode, nextLevel: number) => {
      bubblesRef.current = [];
      flyingRef.current = [];
      for (const p of particlesRef.current) p.active = false;
      rewardTriggeredRef.current = false;
      streakCountRef.current = 0;
      lastPopAtRef.current = performance.now();
      setIdleHintPos(null);
      setRoundDone(false);
      setFreePops(0);
      setGoalHits(0);
      setCollected([]);

      const nextGoal =
        BUBBLE_SPRITE_POOL[Math.floor(Math.random() * BUBBLE_SPRITE_POOL.length)];
      setGoalItem(nextGoal);
      goalItemRef.current = nextGoal;
      playModeRef.current = mode;
      levelRef.current = nextLevel;
    },
    []
  );

  useEffect(() => {
    startRound(playMode, level);
    // Initialize first round on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spawnBurst = useCallback((x: number, y: number, r: number, hue: number, big: boolean) => {
    const pool = particlesRef.current;
    let spawned = 0;
    const dropTarget = big ? 18 : 12;
    let ringDone = false;

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (p.active) continue;
      if (!ringDone) {
        p.active = true;
        p.kind = 'ring';
        p.x = x;
        p.y = y;
        p.vx = 0;
        p.vy = 0;
        p.r = r * 0.72;
        p.maxR = r * 1.65;
        p.alpha = 0.85;
        p.hue = hue;
        ringDone = true;
      } else if (spawned < dropTarget) {
        const ang = (Math.PI * 2 * spawned) / dropTarget + Math.random() * 0.35;
        const spd = (big ? 2.8 : 1.9) + Math.random() * 3.1;
        p.active = true;
        p.kind = spawned % 3 === 0 ? 'spark' : 'drop';
        p.x = x + Math.cos(ang) * r * 0.45;
        p.y = y + Math.sin(ang) * r * 0.45;
        p.vx = Math.cos(ang) * spd;
        p.vy = Math.sin(ang) * spd - 0.8;
        p.r = (big ? 5.5 : 4) + Math.random() * 4.5;
        p.maxR = 0;
        p.alpha = 0.95;
        p.hue = (hue + spawned * 22) % 360;
        spawned++;
      } else {
        break;
      }
    }
  }, []);

  const finishRound = useCallback(() => {
    if (rewardTriggeredRef.current) return;
    rewardTriggeredRef.current = true;
    const nextLevel = recordRoundComplete('bubbles', true);
    setLevel(nextLevel);
    window.setTimeout(() => {
      setRoundDone(true);
    }, 450);
  }, []);

  const popBubble = useCallback(
    (bubble: ActiveBubble, isChainOrDemo = false) => {
      const now = performance.now();
      if (!isChainOrDemo) {
        if (now - lastPopAtRef.current < 1200) {
          streakCountRef.current += 1;
        } else {
          streakCountRef.current = 0;
        }
        lastPopAtRef.current = now;
        setIdleHintPos(null);
      }

      if (bubble.hp > 1 && !isChainOrDemo) {
        bubble.hp -= 1;
        soundEngine.playGamePop(soundEnabledRef.current, streakCountRef.current);
        spawnBurst(bubble.x, bubble.y, bubble.r * 0.65, bubble.hue, false);
        return;
      }

      // Remove bubble
      bubblesRef.current = bubblesRef.current.filter((b) => b.id !== bubble.id);
      spawnBurst(bubble.x, bubble.y, bubble.r, bubble.hue, bubble.kind === 'big');
      soundEngine.playGamePop(soundEnabledRef.current, streakCountRef.current);

      if (bubble.sprite) {
        const sprite = bubble.sprite;
        sayName(sprite.label); // название предмета при лопании
        const canvasEl = canvasRef.current;
        const shelfEl = shelfRef.current;
        let endX = canvasEl ? canvasEl.clientWidth * 0.5 : 200;
        let endY = canvasEl ? canvasEl.clientHeight - 28 : 420;
        if (canvasEl && shelfEl) {
          const cr = canvasEl.getBoundingClientRect();
          const sr = shelfEl.getBoundingClientRect();
          endX = sr.left - cr.left + sr.width * 0.5;
          endY = sr.top - cr.top + sr.height * 0.45;
        }
        flyingRef.current.push({
          active: true,
          sprite,
          startX: bubble.x,
          startY: bubble.y,
          endX,
          endY,
          progress: 0,
        });
        setCollected((prev) => [...prev.slice(-11), sprite]);
      }

      // Rainbow bubble chains nearby bubbles within 180px
      if (bubble.kind === 'rainbow') {
        const neighbors = bubblesRef.current.filter(
          (other) => Math.hypot(other.x - bubble.x, other.y - bubble.y) <= 180
        );
        neighbors.forEach((n, idx) => {
          window.setTimeout(() => {
            if (bubblesRef.current.some((b) => b.id === n.id)) {
              popBubble(n, true);
            }
          }, (idx + 1) * 55);
        });
      }

      if (!isChainOrDemo || bubble.kind === 'rainbow') {
        if (playModeRef.current === 'free') {
          setFreePops((prev) => {
            const next = prev + 1;
            if (next >= 12) {
              finishRound();
            }
            return next;
          });
        } else if (bubble.sprite && bubble.sprite.id === goalItemRef.current.id) {
          soundEngine.playGameOk(soundEnabledRef.current, streakCountRef.current);
          setGoalHits((prev) => {
            const next = prev + 1;
            if (next >= cfgRef.current.goalTargetCount) {
              finishRound();
            }
            return next;
          });
        }
      }
    },
    [finishRound, spawnBurst]
  );

  // Main 60fps Canvas loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const spawnBubble = (w: number, h: number) => {
      const c = cfgRef.current;
      if (bubblesRef.current.length >= c.maxOnScreen) return;
      const filled = c.types.filter((t) => t !== 'empty'); // пустых пузырей нет
      const kind = filled[Math.floor(Math.random() * filled.length)];
      const baseR = c.minRadius + Math.random() * (c.maxRadius - c.minRadius);
      const r = kind === 'big' ? Math.min(94, baseR * 1.45) : baseR;
      const margin = r + 16;
      const span = Math.max(40, w - margin * 2);

      // Enforce min 120px spacing from recently spawned low bubbles
      let x0 = margin + Math.random() * span;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = margin + Math.random() * span;
        const tooClose = bubblesRef.current.some(
          (b) => b.y > h - 180 && Math.abs(b.x0 - candidate) < 120
        );
        if (!tooClose) {
          x0 = candidate;
          break;
        }
      }

      let sprite: MiniGameAssetItem | null = null;
      {
        if (playModeRef.current === 'goal' && Math.random() < 0.42) {
          sprite = goalItemRef.current;
        } else {
          sprite =
            BUBBLE_SPRITE_POOL[Math.floor(Math.random() * BUBBLE_SPRITE_POOL.length)];
        }
        getCachedImage(sprite.src);
      }

      const [minSpd, maxSpd] = c.speedRange;
      const spd = (minSpd + Math.random() * (maxSpd - minSpd)) * 0.5; // медленнее, чтобы успеть рассмотреть
      const hp = kind === 'double' ? 2 : 1;

      bubblesRef.current.push({
        id: nextIdRef.current++,
        kind,
        hp,
        maxHp: hp,
        x0,
        x: x0,
        y: h + r + 10,
        r,
        speed: spd,
        amp: 16 + Math.random() * 20,
        freq: 0.9 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        hue: Math.floor(Math.random() * 360),
        sprite,
        crackSeed: Math.random() * Math.PI * 2,
        spawnScale: 0.25,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const rect = wrap.getBoundingClientRect();
        const w = Math.max(240, Math.floor(rect.width));
        const h = Math.max(240, Math.floor(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);

          // Spawn bubbles smoothly
          spawnAccumRef.current += dt;
          if (spawnAccumRef.current >= 0.72 && !rewardTriggeredRef.current) {
            spawnAccumRef.current = 0;
            spawnBubble(w, h);
          }
          // Pre-seed at start so stage is never barren
          if (bubblesRef.current.length < 3 && !rewardTriggeredRef.current) {
            spawnBubble(w, h);
          }

          const tSec = now / 1000;
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          // Update & draw bubbles
          for (const b of bubblesRef.current) {
            b.spawnScale = Math.min(1, b.spawnScale + dt * 4);
            const topHoverY = b.r + 22;
            const hoverFactor = b.y <= topHoverY ? 0 : Math.min(1, (b.y - topHoverY) / 90);
            b.y -= b.speed * hoverFactor * dt;
            if (b.y <= topHoverY) {
              b.y = topHoverY + Math.sin(tSec * 1.4 + b.phase) * 3;
            }
            const sway = reduceMotion ? 0 : Math.sin(tSec * b.freq + b.phase) * b.amp;
            b.x = Math.min(w - b.r - 8, Math.max(b.r + 8, b.x0 + sway));

            const drawR = b.r * b.spawnScale;
            const displayHue = b.kind === 'rainbow' ? (b.hue + tSec * 90) % 360 : b.hue;

            ctx.save();
            ctx.translate(b.x, b.y);

            // Soft iridescent soap fill
            const grad = ctx.createRadialGradient(
              -drawR * 0.28,
              -drawR * 0.28,
              drawR * 0.12,
              0,
              0,
              drawR
            );
            grad.addColorStop(0, 'rgba(255,255,255,0.68)');
            grad.addColorStop(0.58, `hsla(${displayHue}, 85%, 84%, 0.22)`);
            grad.addColorStop(
              0.88,
              b.kind === 'rainbow'
                ? `hsla(${(displayHue + 120) % 360}, 92%, 72%, 0.45)`
                : `hsla(${(displayHue + 50) % 360}, 85%, 76%, 0.38)`
            );
            grad.addColorStop(1, 'rgba(255,255,255,0.86)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, drawR, 0, Math.PI * 2);
            ctx.fill();

            // Rim stroke
            ctx.lineWidth = b.kind === 'double' ? 4.5 : b.kind === 'rainbow' ? 3.5 : 2.5;
            ctx.strokeStyle =
              b.kind === 'rainbow'
                ? `hsla(${(displayHue + 60) % 360}, 95%, 64%, 0.92)`
                : 'rgba(255,255,255,0.9)';
            ctx.stroke();

            // Extra inner ring for double-tap bubble
            if (b.kind === 'double' && b.hp === 2) {
              ctx.lineWidth = 2;
              ctx.strokeStyle = `hsla(${displayHue}, 80%, 72%, 0.65)`;
              ctx.beginPath();
              ctx.arc(0, 0, drawR - 6, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Предмет внутри скрыт: показываем «?», пока пузырь не лопнут
            if (b.sprite) {
              ctx.fillStyle = `hsla(${displayHue}, 70%, 48%, 0.72)`;
              ctx.font = `bold ${Math.round(drawR * 0.9)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('?', 0, 3);
            } else {
              // Empty musical note bubble
              ctx.fillStyle = `hsla(${displayHue}, 75%, 52%, 0.78)`;
              ctx.font = `bold ${Math.round(drawR * 0.6)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('♪', 0, 2);
            }

            // Cracked lines after 1st hit on double bubble
            if (b.kind === 'double' && b.hp === 1) {
              ctx.strokeStyle = 'rgba(255,255,255,0.95)';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(-drawR * 0.45, -drawR * 0.25);
              ctx.lineTo(-drawR * 0.08, 0);
              ctx.lineTo(drawR * 0.35, -drawR * 0.32);
              ctx.moveTo(-drawR * 0.08, 0);
              ctx.lineTo(drawR * 0.25, drawR * 0.42);
              ctx.stroke();
            }

            // Glossy curved specular highlight
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.beginPath();
            ctx.ellipse(-drawR * 0.38, -drawR * 0.38, drawR * 0.24, drawR * 0.12, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }

          // Update & draw flying captured sprites into bottom shelf
          const stillFlying: FlyingSprite[] = [];
          for (const f of flyingRef.current) {
            f.progress += dt * 1.0; // медленнее: предмет можно рассмотреть
            if (f.progress >= 1) continue;
            stillFlying.push(f);
            const t = f.progress;
            const px = f.startX + (f.endX - f.startX) * t;
            const py =
              f.startY + (f.endY - f.startY) * t - Math.sin(t * Math.PI) * 56;
            const img = getCachedImage(f.sprite.src);
            if (img) {
              const sz = 52 * (1 - t * 0.35);
              ctx.save();
              ctx.globalAlpha = 1 - t * 0.2;
              ctx.drawImage(img, px - sz / 2, py - sz / 2, sz, sz);
              ctx.restore();
            }
          }
          flyingRef.current = stillFlying;

          // Update & draw pooled burst particles
          for (const p of particlesRef.current) {
            if (!p.active) continue;
            if (p.kind === 'ring') {
              p.r += (p.maxR - p.r) * Math.min(1, dt * 11);
              p.alpha -= dt * 2.6;
              if (p.alpha <= 0.02) {
                p.active = false;
                continue;
              }
              ctx.save();
              ctx.globalAlpha = p.alpha;
              ctx.strokeStyle = `hsla(${p.hue}, 85%, 68%, 0.9)`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            } else {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.08;
              p.alpha -= dt * 1.9;
              if (p.alpha <= 0.02) {
                p.active = false;
                continue;
              }
              ctx.save();
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, 0.95)`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // Gentle 6s idle helper: pop 1 bubble & point hand over another
          if (
            !rewardTriggeredRef.current &&
            now - lastPopAtRef.current > 6000 &&
            bubblesRef.current.length > 0
          ) {
            if (now - lastDemoPopAtRef.current > 6000) {
              lastDemoPopAtRef.current = now;
              const demoTarget = bubblesRef.current[0];
              if (demoTarget) {
                popBubble(demoTarget, true);
              }
            }
            const nextHint = bubblesRef.current[0];
            if (nextHint) {
              setIdleHintPos({ x: nextHint.x, y: nextHint.y - nextHint.r * 0.4 });
            }
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [getCachedImage, popBubble, spawnBurst]);

  const tryHitAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || rewardTriggeredRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Search top-most bubble in forgiving 70px radius
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        const hitRadius = Math.max(b.r + 18, 70);
        if (Math.hypot(x - b.x, y - b.y) <= hitRadius) {
          popBubble(b, false);
          return;
        }
      }
    },
    [popBubble]
  );

  const handleManualLevel = (lvl: number) => {
    const updated = setManualGameLevel('bubbles', lvl);
    setLevel(updated);
    soundEngine.playGamePop(soundEnabled, lvl);
    startRound(playMode, updated);
  };

  const progressCount = playMode === 'free' ? freePops : goalHits;

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#FFFDF7] rounded-3xl border-2 border-[#BAE6FD] shadow-sm overflow-hidden select-none touch-none">
      {/* Top Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3 z-20 shrink-0">
        <div />

        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            startRound(playMode, level);
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Main Canvas Stage */}
      <div ref={wrapRef} className="relative flex-1 w-full min-h-0">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            e.preventDefault();
            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            tryHitAt(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!activePointersRef.current.has(e.pointerId)) return;
            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            tryHitAt(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            activePointersRef.current.delete(e.pointerId);
          }}
          onPointerCancel={(e) => {
            activePointersRef.current.delete(e.pointerId);
          }}
          className="w-full h-full block touch-none cursor-pointer"
        />

        {idleHintPos && !roundDone && (
          <div
            style={{ left: idleHintPos.x, top: idleHintPos.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <IdleHandPointer />
          </div>
        )}
      </div>

      {/* Bottom Cloud Collection Shelf */}
      <div
        ref={shelfRef}
        className="w-full px-3 pb-2.5 pt-1 z-20 shrink-0"
      >
        <div className="w-full max-w-[780px] mx-auto min-h-[60px] sm:min-h-[68px] flex items-center justify-center gap-2 overflow-x-auto no-scrollbar px-3 py-1.5 toy-panel">
          {collected.length === 0 ? (
            <div className="flex items-center gap-3 opacity-35" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((dot) => (
                <div
                  key={dot}
                  className="w-9 h-9 rounded-full border-2 border-dashed border-[#94A3B8]"
                />
              ))}
            </div>
          ) : (
            collected.map((item, idx) => (
              <div
                key={`${item.id}_${idx}`}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-1 flex items-center justify-center shrink-0 animate-pop-in"
              >
                <img
                  src={item.src}
                  alt={item.label}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Round Replay Overlay */}
      <RoundReplayOverlay
        open={roundDone}
        soundEnabled={soundEnabled}
        onReplay={() => startRound(playMode, level)}
      />
    </div>
  );
};
