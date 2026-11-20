import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloudRain, Dices, RotateCw, Snowflake, Sparkles, Sun } from 'lucide-react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import {
  ALBUM_STICKERS,
  getCharacterEatAnimationUrl,
  MAX_GAME_LEVELS,
  loadMiniGamesProgress,
  recordGameMistake,
  recordRoundComplete,
  setManualGameLevel,
} from '../data/miniGamesData';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import {
  IdleHandPointer,
  LevelStarsBar,
  RoundReplayOverlay,
  useIdleHint,
} from './MiniGameShell';

interface WeatherDressGameProps {
  initialCharacter: CharacterItem;
  soundEnabled: boolean;
}

type WeatherType = 'sun' | 'rain' | 'snow';
type AccessorySlot = 'hat' | 'glasses' | 'neck' | 'hand';

interface WeatherAccessoryDef {
  id: string;
  src: string;
  label: string;
  slot: AccessorySlot;
  weathers: WeatherType[];
}

const WEATHER_ACCESSORIES: WeatherAccessoryDef[] = [
  // Sunny items
  {
    id: 'sun_hat',
    src: '/assets/items/accessories/sun_hat.webp',
    label: 'Панамка',
    slot: 'hat',
    weathers: ['sun'],
  },
  {
    id: 'glasses_sun',
    src: '/assets/items/accessories/glasses_sun.webp',
    label: 'Солнечные очки',
    slot: 'glasses',
    weathers: ['sun'],
  },
  {
    id: 'glasses_rainbow',
    src: '/assets/items/accessories/glasses_rainbow.webp',
    label: 'Радужные очки',
    slot: 'glasses',
    weathers: ['sun'],
  },
  {
    id: 'cap_baseball',
    src: '/assets/items/accessories/cap_baseball.webp',
    label: 'Кепка',
    slot: 'hat',
    weathers: ['sun', 'rain'],
  },
  {
    id: 'flower_crown',
    src: '/assets/items/accessories/flower_crown.webp',
    label: 'Венок из цветов',
    slot: 'hat',
    weathers: ['sun'],
  },
  // Rainy items
  {
    id: 'umbrella_sticker',
    src: '/assets/items/accessories/umbrella_sticker.webp',
    label: 'Зонтик',
    slot: 'hand',
    weathers: ['rain'],
  },
  {
    id: 'frog_hat',
    src: '/assets/items/accessories/frog_hat.webp',
    label: 'Шапочка от дождя',
    slot: 'hat',
    weathers: ['rain'],
  },
  {
    id: 'beret',
    src: '/assets/items/accessories/beret.webp',
    label: 'Берет',
    slot: 'hat',
    weathers: ['rain'],
  },
  // Snowy items
  {
    id: 'beanie_pom',
    src: '/assets/items/accessories/beanie_pom.webp',
    label: 'Зимняя шапка',
    slot: 'hat',
    weathers: ['snow'],
  },
  {
    id: 'scarf',
    src: '/assets/items/accessories/scarf.webp',
    label: 'Тёплый шарфик',
    slot: 'neck',
    weathers: ['snow'],
  },
  {
    id: 'bear_hat',
    src: '/assets/items/accessories/bear_hat.webp',
    label: 'Тёплая шапка мишка',
    slot: 'hat',
    weathers: ['snow'],
  },
  {
    id: 'headphones',
    src: '/assets/items/accessories/headphones.webp',
    label: 'Тёплые наушники',
    slot: 'hat',
    weathers: ['snow'],
  },
  {
    id: 'hat_santa',
    src: '/assets/items/accessories/hat_santa.webp',
    label: 'Зимний колпак',
    slot: 'hat',
    weathers: ['snow'],
  },
  // Fun playful distractors from the 127 pool
  {
    id: 'crown',
    src: '/assets/items/accessories/crown.webp',
    label: 'Корона',
    slot: 'hat',
    weathers: [],
  },
  {
    id: 'bowtie',
    src: '/assets/items/accessories/bowtie.webp',
    label: 'Бабочка-галстук',
    slot: 'neck',
    weathers: [],
  },
];

const WEATHER_THEMES: Record<
  WeatherType,
  {
    bgGradient: string;
    borderColor: string;
    pillActiveBg: string;
    iconColor: string;
    label: string;
  }
> = {
  sun: {
    bgGradient: 'linear-gradient(180deg, #FEF9C3 0%, #FFFBEB 48%, #FFE4B5 100%)',
    borderColor: '#FDE047',
    pillActiveBg: '#FACC15',
    iconColor: '#D97706',
    label: 'Солнечно',
  },
  rain: {
    bgGradient: 'linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #E0F2FE 100%)',
    borderColor: '#93C5FD',
    pillActiveBg: '#38BDF8',
    iconColor: '#0284C7',
    label: 'Дождик',
  },
  snow: {
    bgGradient: 'linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 55%, #EEF2FF 100%)',
    borderColor: '#BAE6FD',
    pillActiveBg: '#60A5FA',
    iconColor: '#1D4ED8',
    label: 'Снежок',
  },
};

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickShelfForWeather(
  weather: WeatherType,
  level: number
): { shelf: WeatherAccessoryDef[]; targetCount: number } {
  const targetCount = level <= 1 ? 2 : 3;
  const shelfSize = level <= 1 ? 4 : level === 2 ? 5 : 6;

  const matching = WEATHER_ACCESSORIES.filter((a) => a.weathers.includes(weather));
  // Ensure distinct slots so kid can put on both e.g. sun_hat + glasses_sun or beanie_pom + scarf
  const pickedGood: WeatherAccessoryDef[] = [];
  const usedSlots = new Set<AccessorySlot>();

  for (const item of shuffleArr(matching)) {
    if (pickedGood.length >= targetCount) break;
    if (!usedSlots.has(item.slot)) {
      pickedGood.push(item);
      usedSlots.add(item.slot);
    }
  }
  for (const item of shuffleArr(matching)) {
    if (pickedGood.length >= targetCount) break;
    if (!pickedGood.some((p) => p.id === item.id)) {
      pickedGood.push(item);
    }
  }

  const weatherMatchIds = new Set(matching.map((m) => m.id));
  const extraDistractors: WeatherAccessoryDef[] = ALBUM_STICKERS.filter(
    (s) =>
      (s.category === 'fashion' || s.category === 'objects') &&
      !weatherMatchIds.has(s.id) &&
      !WEATHER_ACCESSORIES.some((wa) => wa.id === s.id && wa.weathers.includes(weather))
  ).map((s) => ({
    id: s.id,
    src: s.src,
    label: s.label,
    slot: s.id.startsWith('glasses') ? 'glasses' : s.id.includes('scarf') || s.id.includes('bow') || s.id.includes('necklace') ? 'neck' : 'hat',
    weathers: [],
  }));

  const combinedDistractors = [
    ...WEATHER_ACCESSORIES.filter((a) => !a.weathers.includes(weather)),
    ...extraDistractors,
  ];
  const distractors = shuffleArr(combinedDistractors).slice(
    0,
    Math.max(1, shelfSize - pickedGood.length)
  );

  return {
    shelf: shuffleArr([...pickedGood, ...distractors]),
    targetCount: Math.min(targetCount, pickedGood.length),
  };
}

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export const WeatherDressGame: React.FC<WeatherDressGameProps> = ({
  initialCharacter,
  soundEnabled,
}) => {
  const [hero, setHero] = useState<CharacterItem>(initialCharacter);
  // Только самый сложный уровень — выбор сложности убран
  const level = MAX_GAME_LEVELS.weather;
  const setLevel = (_lvl: number) => {};
  const [weather, setWeather] = useState<WeatherType>('sun');
  const [shelf, setShelf] = useState<WeatherAccessoryDef[]>([]);
  const [targetCount, setTargetCount] = useState(2);
  const [worn, setWorn] = useState<Partial<Record<AccessorySlot, WeatherAccessoryDef>>>({});
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mistakesInRound, setMistakesInRound] = useState(0);
  const [mistakesOnStep, setMistakesOnStep] = useState(0);

  const [heroShake, setHeroShake] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const [hoverHero, setHoverHero] = useState(false);
  const [bouncedId, setBouncedId] = useState<string | null>(null);

  const [dragState, setDragState] = useState<{
    item: WeatherAccessoryDef;
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);

  const heroBoxRef = useRef<HTMLDivElement | null>(null);
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const weatherParticlesRef = useRef<WeatherParticle[]>([]);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const { showHint, resetIdle } = useIdleHint(6000, !roundDone && !celebrating);

  const startRound = useCallback(
    (nextWeather: WeatherType, targetLvl: number) => {
      const { shelf: nextShelf, targetCount: nextTarget } = pickShelfForWeather(
        nextWeather,
        targetLvl
      );
      setWeather(nextWeather);
      setShelf(nextShelf);
      setTargetCount(nextTarget);
      setWorn({});
      setMatchedIds([]);
      setMistakesInRound(0);
      setMistakesOnStep(0);
      setHeroShake(false);
      setCelebrating(false);
      setRoundDone(false);
      weatherParticlesRef.current = [];
      resetIdle();
      // помощник задаёт вопрос про погоду
      window.setTimeout(() => playVoice(`weather_q_${nextWeather}`, soundEnabled, undefined, 'replace'), 400);
    },
    [resetIdle, soundEnabled]
  );

  // вопрос при первом открытии игры
  useEffect(() => {
    const t = window.setTimeout(() => playVoice('weather_q_sun', soundEnabled, undefined, 'replace'), 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startRound('sun', level);
    // Initial round setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Weather background particles animation (Sun rays/sparkles, Rain drops, Snowflakes)
  useEffect(() => {
    let rafId = 0;
    const render = () => {
      const canvas = weatherCanvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          const w = Math.max(100, Math.floor(rect.width));
          const h = Math.max(100, Math.floor(rect.height));
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            const targetLen = weather === 'rain' ? 46 : weather === 'snow' ? 38 : 18;
            while (weatherParticlesRef.current.length < targetLen) {
              weatherParticlesRef.current.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx:
                  weather === 'rain'
                    ? -1.2
                    : weather === 'snow'
                    ? (Math.random() - 0.5) * 0.8
                    : (Math.random() - 0.5) * 0.35,
                vy:
                  weather === 'rain'
                    ? 6.5 + Math.random() * 4
                    : weather === 'snow'
                    ? 1.1 + Math.random() * 1.4
                    : -0.35 - Math.random() * 0.3,
                size:
                  weather === 'rain'
                    ? 14 + Math.random() * 10
                    : weather === 'snow'
                    ? 4 + Math.random() * 5
                    : 4 + Math.random() * 5,
                alpha: 0.45 + Math.random() * 0.45,
              });
            }

            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            for (const p of weatherParticlesRef.current) {
              if (!reduce) {
                p.x += p.vx;
                p.y += p.vy;
              }
              if (p.y > h + 20) {
                p.y = -15;
                p.x = Math.random() * w;
              } else if (p.y < -20) {
                p.y = h + 12;
                p.x = Math.random() * w;
              }
              if (p.x < -20) p.x = w + 10;
              if (p.x > w + 20) p.x = -10;

              ctx.save();
              ctx.globalAlpha = p.alpha;
              if (weather === 'rain') {
                ctx.strokeStyle = '#38BDF8';
                ctx.lineWidth = 2.4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - 4, p.y + p.size);
                ctx.stroke();
              } else if (weather === 'snow') {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillStyle = '#FACC15';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          }
        }
      }
      rafId = window.requestAnimationFrame(render);
    };
    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, [weather]);

  const checkHeroHit = useCallback((clientX: number, clientY: number): boolean => {
    const el = heroBoxRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return (
      clientX >= r.left - 32 &&
      clientX <= r.right + 32 &&
      clientY >= r.top - 40 &&
      clientY <= r.bottom + 24
    );
  }, []);

  const applyAccessory = useCallback(
    (item: WeatherAccessoryDef) => {
      if (celebrating || roundDone) return;
      const isRightWeather = item.weathers.includes(weather);

      if (isRightWeather) {
        const alreadyCounted = matchedIds.includes(item.id);
        const nextMatched = alreadyCounted ? matchedIds : [...matchedIds, item.id];

        setWorn((prev) => ({ ...prev, [item.slot]: item }));
        setMatchedIds(nextMatched);
        setMistakesOnStep(0);
        setBouncedId(item.id);
        window.setTimeout(() => {
          setBouncedId((prev) => (prev === item.id ? null : prev));
        }, 350);

        soundEngine.playGameOk(soundEnabled, nextMatched.length - 1);
        if (nextMatched.length < targetCount && Math.random() < 0.6) {
          playVoice(`weather_ok_${1 + Math.floor(Math.random() * 2)}`, soundEnabled);
        }

        if (nextMatched.length >= targetCount) {
          setCelebrating(true);
          const nextLvl = recordRoundComplete('weather', mistakesInRound === 0);
          setLevel(nextLvl);
          window.setTimeout(() => {
            setRoundDone(true);
          }, 1150);
        }
      } else {
        setHeroShake(true);
        setMistakesInRound((m) => m + 1);
        setMistakesOnStep((m) => m + 1);
        const nextLvl = recordGameMistake('weather');
        setLevel(nextLvl);
        soundEngine.playGameFail(soundEnabled);
        playVoice(`weather_wrong_${1 + Math.floor(Math.random() * 2)}`, soundEnabled);
        window.setTimeout(() => setHeroShake(false), 700);
      }
    },
    [celebrating, matchedIds, mistakesInRound, roundDone, soundEnabled, targetCount, weather]
  );

  useEffect(() => {
    if (!dragState) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
      setHoverHero(checkHeroHit(e.clientX, e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const start = dragStartRef.current;
      const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 99;
      const hitHero = checkHeroHit(e.clientX, e.clientY);
      const item = dragState.item;

      setDragState(null);
      setHoverHero(false);
      dragStartRef.current = null;

      if (hitHero || dist < 10) {
        applyAccessory(item);
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
  }, [applyAccessory, checkHeroHit, dragState, soundEnabled]);

  const handleCycleHero = () => {
    resetIdle();
    const others = CHARACTERS.filter((c) => c.id !== hero.id);
    const nextHero = others[Math.floor(Math.random() * others.length)] ?? CHARACTERS[0];
    setHero(nextHero);
    soundEngine.playGamePop(soundEnabled, 4);
  };

  const handleNextWeatherReplay = () => {
    const order: WeatherType[] = ['sun', 'rain', 'snow'];
    const nextW = order[(order.indexOf(weather) + 1) % order.length];
    startRound(nextW, level);
  };

  const handleManualLevel = (lvl: number) => {
    resetIdle();
    const next = setManualGameLevel('weather', lvl);
    setLevel(next);
    soundEngine.playGamePop(soundEnabled, lvl);
    startRound(weather, next);
  };

  const theme = WEATHER_THEMES[weather];
  const hintedItem = useMemo(
    () =>
      shelf.find((a) => a.weathers.includes(weather) && !matchedIds.includes(a.id)) ?? null,
    [matchedIds, shelf, weather]
  );
  const pulseHint = showHint || mistakesOnStep >= 2;

  const glassesTopPct = Math.round(hero.faceMaskAnchor.y * 100);
  const hatTopPct = Math.round(Math.max(-18, (hero.faceMaskAnchor.y - 0.56) * 100));

  return (
    <div
      onPointerDown={resetIdle}
      style={{ backgroundImage: theme.bgGradient, borderColor: theme.borderColor }}
      className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 rounded-3xl border-2 shadow-sm overflow-hidden select-none touch-none transition-colors duration-300"
    >
      {/* Animated Sky Particles Canvas */}
      <canvas
        ref={weatherCanvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Top HUD: Dice + Stars + Weather Switcher + Progress Dots + Replay */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
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

        {/* Pure Icon Weather Switcher + Goal Dots */}
        <div className="flex items-center gap-2 bg-white/95 border-2 border-[#E2E8F0] rounded-full p-1.5 shadow-xs">
          {(
            [
              { id: 'sun', Icon: Sun, label: 'Солнечно', color: '#F59E0B' },
              { id: 'rain', Icon: CloudRain, label: 'Дождик', color: '#0284C7' },
              { id: 'snow', Icon: Snowflake, label: 'Снежок', color: '#2563EB' },
            ] as const
          ).map(({ id, Icon, label, color }) => {
            const active = weather === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  soundEngine.playGamePop(soundEnabled, 3);
                  startRound(id, level);
                }}
                aria-label={label}
                aria-pressed={active}
                style={active ? { backgroundColor: WEATHER_THEMES[id].pillActiveBg } : undefined}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  active ? 'text-white shadow-sm scale-108' : 'hover:bg-[#F1F5F9] opacity-75'
                }`}
              >
                <Icon
                  className="w-6 h-6"
                  style={active ? { color: '#FFFFFF' } : { color }}
                />
              </button>
            );
          })}

          <div className="h-6 w-px bg-[#E2E8F0] mx-0.5" aria-hidden="true" />

          <div className="flex items-center gap-1.5 pr-2">
            {Array.from({ length: targetCount }).map((_, idx) => (
              <span
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx < matchedIds.length
                    ? 'w-4 h-4 bg-[#10C97A] scale-110'
                    : 'w-3 h-3 bg-[#CBD5E1]'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            startRound(weather, level);
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Weather Corner Ambient Icon */}
      <div className="absolute top-16 right-4 sm:right-8 z-10 pointer-events-none opacity-85">
        {weather === 'sun' && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FDE047] border-4 border-white shadow-[0_0_32px_rgba(250,204,21,0.65)] flex items-center justify-center animate-gentle-float">
            <Sun className="w-10 h-10 sm:w-12 sm:h-12 text-[#D97706]" />
          </div>
        )}
        {weather === 'rain' && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#BAE6FD] border-4 border-white shadow-md flex items-center justify-center animate-gentle-float">
            <CloudRain className="w-10 h-10 sm:w-12 sm:h-12 text-[#0284C7]" />
          </div>
        )}
        {weather === 'snow' && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-[#BAE6FD] shadow-md flex items-center justify-center animate-gentle-float">
            <Snowflake className="w-10 h-10 sm:w-12 sm:h-12 text-[#2563EB]" />
          </div>
        )}
      </div>

      {/* Center Stage: Hero wearing selected weather clothes */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-0 z-10">
        <div
          ref={heroBoxRef}
          style={{ backgroundColor: hero.accentBg }}
          className={`relative aspect-square w-[min(54vw,240px)] sm:w-[min(38vh,290px)] rounded-[36px] border-4 border-white shadow-[0_14px_34px_rgba(15,23,42,0.14)] overflow-visible transition-transform duration-200 ${
            heroShake
              ? 'animate-gentle-shake'
              : celebrating
              ? 'scale-108 ring-4 ring-[#FACC15]'
              : hoverHero
              ? 'scale-[1.05] ring-4 ring-[#38BDF8]'
              : 'animate-hero-breathe'
          }`}
        >
          <div className="w-full h-full rounded-[32px] overflow-hidden">
            {celebrating ? (
              <img
                src={getCharacterEatAnimationUrl(hero.id)}
                alt={hero.name}
                draggable={false}
                className="w-full h-full object-cover object-top pointer-events-none select-none"
              />
            ) : (
              <img
                src={hero.imageSrc}
                alt={hero.name}
                draggable={false}
                className="w-full h-full object-cover object-top pointer-events-none select-none"
              />
            )}
          </div>

          {/* Worn Umbrella / Hand Prop */}
          {worn.hand && (
            <img
              src={worn.hand.src}
              alt={worn.hand.label}
              draggable={false}
              className="absolute -top-[22%] -right-[24%] w-[64%] h-[64%] object-contain pointer-events-none select-none animate-pop-in drop-shadow-[0_10px_14px_rgba(0,0,0,0.2)] z-30"
            />
          )}

          {/* Worn Neck Scarf */}
          {worn.neck && (
            <img
              src={worn.neck.src}
              alt={worn.neck.label}
              draggable={false}
              style={{ top: `${Math.min(82, glassesTopPct + 26)}%` }}
              className="absolute left-1/2 -translate-x-1/2 w-[62%] h-[34%] object-contain pointer-events-none select-none animate-pop-in drop-shadow-[0_6px_10px_rgba(0,0,0,0.2)] z-20"
            />
          )}

          {/* Worn Glasses */}
          {worn.glasses && (
            <img
              src={worn.glasses.src}
              alt={worn.glasses.label}
              draggable={false}
              style={{
                top: `${glassesTopPct}%`,
                width: `${Math.round(52 * hero.faceMaskAnchor.scale)}%`,
              }}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-[2/1] object-contain pointer-events-none select-none animate-pop-in drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)] z-25"
            />
          )}

          {/* Worn Hat */}
          {worn.hat && (
            <img
              src={worn.hat.src}
              alt={worn.hat.label}
              draggable={false}
              style={{ top: `${hatTopPct}%` }}
              className="absolute left-1/2 -translate-x-1/2 w-[64%] h-[42%] object-contain pointer-events-none select-none animate-pop-in drop-shadow-[0_8px_12px_rgba(0,0,0,0.22)] z-30"
            />
          )}

          {celebrating && (
            <Sparkles className="absolute -top-4 -left-4 w-10 h-10 text-[#FACC15] fill-[#FACC15] animate-pop-in z-40" />
          )}
        </div>
      </div>

      {/* Bottom Wardrobe Accessory Shelf */}
      <div className="relative w-full max-w-[780px] flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 px-3 py-2.5 sm:py-3 toy-panel z-20 shrink-0">
        {shelf.map((item) => {
          const isMatched = matchedIds.includes(item.id);
          const isDragged = dragState?.item.id === item.id;
          const isHint = pulseHint && hintedItem?.id === item.id && !isMatched;
          const isBounced = bouncedId === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                disabled={celebrating || roundDone}
                onPointerDown={(e) => {
                  if (celebrating || roundDone) return;
                  e.preventDefault();
                  resetIdle();
                  dragStartRef.current = { x: e.clientX, y: e.clientY };
                  soundEngine.playGamePop(soundEnabled, 1);
                  setDragState({
                    item,
                    x: e.clientX,
                    y: e.clientY,
                    pointerId: e.pointerId,
                  });
                }}
                aria-label={item.label}
                className={`w-[74px] h-[74px] sm:w-[92px] sm:h-[92px] toy-chip p-2 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all touch-none ${
                  isDragged
                    ? 'opacity-30 scale-95 bg-[#FAF8F4]'
                    : isMatched
                    ? 'bg-[#ECFDF5] border-[#10C97A] ring-2 ring-[#6EE7B7] scale-95'
                    : isHint
                    ? 'toy-chip-on animate-pulse'
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

              {showHint && hintedItem?.id === item.id && !dragState && !isMatched && (
                <IdleHandPointer className="absolute -top-7 right-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Dragging Overlay */}
      {dragState && (
        <div
          aria-hidden="true"
          style={{
            left: dragState.x,
            top: dragState.y,
            transform: 'translate(-50%, -50%) scale(1.15)',
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

      {/* Round Replay Overlay */}
      <RoundReplayOverlay
        open={roundDone}
        soundEnabled={soundEnabled}
        onReplay={handleNextWeatherReplay}
      />
    </div>
  );
};
