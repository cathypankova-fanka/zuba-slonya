import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Heart,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ArtToolbar, GameMode } from './components/ArtToolbar';
import { BubblesGame } from './components/BubblesGame';
import { ColoringGame } from './components/ColoringGame';
import { DragProvider } from './components/DragContext';
import { FaceArtStage, ToolMode } from './components/FaceArtStage';
import { FeedGame } from './components/FeedGame';
import { ModeTabSvg } from './components/KitchenIllustrations';
import { KitchenStage } from './components/KitchenStage';
import { MapHub } from './components/MapHub';
import { SplashScreen } from './components/SplashScreen';
import { HelperCorner } from './components/HelperCorner';
import { PizzaMission } from './components/PizzaMission';
import { IceCreamMission } from './components/IceCreamMission';
import { SoupMission } from './components/SoupMission';
import { SandwichMission } from './components/SandwichMission';
import { DrinksMission } from './components/DrinksMission';
import { PlayRouter, REMADE_MODES } from './components/PlayRouter';
import { PLAY_MODES, PlayMode } from './data/kitchenData';
import { CakeMission } from './components/CakeMission';
import { playVoice, setVoiceEnabled } from './utils/voice';
import { SimonGame } from './components/SimonGame';
import { BigSmallGame } from './components/BigSmallGame';
import { EmotionsGame } from './components/EmotionsGame';
import { TvGame } from './components/TvGame';
import { warmTvCache } from './utils/tvCache';
import { MemoryGame } from './components/MemoryGame';
import { ModeToolbar } from './components/ModeToolbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PuzzleGame } from './components/PuzzleGame';
import { ShadowGame } from './components/ShadowGame';
import { TShirtColorPanel } from './components/TShirtColorPanel';
import { TShirtStage } from './components/TShirtStage';
import { WashStage } from './components/WashStage';
import { WeatherDressGame } from './components/WeatherDressGame';
import { loadMiniGamesProgress, saveSoundPreference } from './data/miniGamesData';
import { PAINT_COLORS, PatternStampId, STICKERS, TSHIRT_COLORS } from './data/artTools';
import { CHARACTERS, CharacterItem } from './data/characters';
import {
  AllGameMode,
  CakeCandleId,
  CakeFlavorId,
  CakeRosetteId,
  CakeState,
  CakeToolTab,
  CakeToppingId,
  DRINK_FLAVORS,
  DrinkAddonId,
  DrinkCategoryId,
  DrinkState,
  IceCreamBaseId,
  IceCreamGarnishId,
  IceCreamState,
  INITIAL_CAKE_STATE,
  INITIAL_DRINK_STATE,
  INITIAL_ICECREAM_STATE,
  INITIAL_PIZZA_STATE,
  INITIAL_SANDWICH_STATE,
  INITIAL_SOUP_STATE,
  KitchenMode,
  MessType,
  PizzaState,
  PizzaToppingId,
  PlacedCakeItem,
  SandwichBreadId,
  SandwichFillingId,
  SandwichState,
  SoupIngredientId,
  SoupState,
  WashToolMode,
} from './data/kitchenData';
import {
  PaintOperation,
  PlacedFaceArtMask,
  PlacedSticker,
} from './utils/canvasRender';
import {
  DONE_PRAISE,
  soundEngine,
} from './utils/soundEngine';
import {
  CharacterWashState,
  createInitialWashState,
  WashOperation,
} from './utils/washRender';

interface CharacterArtworkState {
  faceArtMask: PlacedFaceArtMask | null;
  paintOps: PaintOperation[];
  stickers: PlacedSticker[];
  history: Array<
    | { kind: 'paint'; id: string }
    | { kind: 'sticker'; uid: string }
    | { kind: 'mask'; previousMask: PlacedFaceArtMask | null }
  >;
}

interface CharacterTShirtState {
  tshirtColor: string;
  paintOps: PaintOperation[];
  stickers: PlacedSticker[];
  history: Array<{ kind: 'paint'; id: string } | { kind: 'sticker'; uid: string }>;
}

const EMPTY_ARTWORK: CharacterArtworkState = {
  faceArtMask: null,
  paintOps: [],
  stickers: [],
  history: [],
};

const EMPTY_TSHIRT: CharacterTShirtState = {
  tshirtColor: TSHIRT_COLORS[1].hex, // cheerful sky blue default
  paintOps: [],
  stickers: [],
  history: [],
};

const MODE_TITLES: Record<AllGameMode, string> = {
  face: 'Аквагрим',
  tshirt: 'Футболка',
  wash: 'Мытьё',
  pizza: 'Пицца',
  icecream: 'Мороженое',
  drinks: 'Напитки',
  soup: 'Суп',
  sandwich: 'Бутерброд',
  cake: 'Торт',
  feed: 'Покорми',
  shadow: 'Найди тень',
  bubbles: 'Пузыри',
  memory: 'Найди пару',
  puzzle: 'Пазл',
  weather: 'По погоде',
  coloring: 'Раскраска',
  simon: 'Повтори за героями',
  bigsmall: 'Большой и маленький',
  emotions: 'Эмоции',
  tv: 'Мультики',
  milkshake: 'Милкшейк',
  pancakes: 'Блинчики',
  cookies: 'Печенье',
  popcorn: 'Попкорн',
  skewers: 'Фруктовые шашлычки',
  picnic: 'Пикник',
  bedtime: 'Уложи спать',
  doctor: 'Доктор',
  garden: 'Садик',
  laundry: 'Стирка',
  popit: 'Попит',
  phone: 'Телефон',
  numbers: 'Цифры',
  letters: 'Буквы',
};

const KITCHEN_MODES = ['pizza', 'icecream', 'drinks', 'soup', 'sandwich', 'cake'];
const stageBackground = (mode: string) =>
  KITCHEN_MODES.includes(mode)
    ? '/assets/princess/bg/bg_kitchen.webp'
    : mode === 'wash'
    ? '/assets/design/bg/bathroom.webp'
    : mode === 'face' || mode === 'tshirt' || mode === 'coloring'
    ? '/assets/princess/bg/bg_workshop.webp'
    : '/assets/princess/bg/bg_playground.webp';

export default function App() {
  useEffect(() => {
    warmTvCache();
  }, []);

  const [screen, setScreen] = useState<'menu' | 'play'>('menu');
  const [splashDone, setSplashDone] = useState(false);
  const [gameMode, setGameMode] = useState<AllGameMode>('face');
  const [randomHero, setRandomHero] = useState<(typeof CHARACTERS)[number] | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('baby');

  const [toolMode, setToolMode] = useState<ToolMode>('paint');
  const [selectedColor, setSelectedColor] = useState<string>(PAINT_COLORS[0].hex);
  const [brushSize, setBrushSize] = useState<'medium' | 'large'>('large');
  const [selectedStamp, setSelectedStamp] = useState<PatternStampId>('star');
  const [selectedStickerId, setSelectedStickerId] = useState<string>(STICKERS[0].id);
  const [selectedTShirtStickerUid, setSelectedTShirtStickerUid] = useState<string | null>(null);

  const [washTool, setWashTool] = useState<WashToolMode>('soap');
  const [selectedPizzaTopping, setSelectedPizzaTopping] =
    useState<PizzaToppingId>('pepperoni');

  const [cakeTab, setCakeTab] = useState<CakeToolTab>('pipe');
  const [selectedCakeRosette, setSelectedCakeRosette] = useState<CakeRosetteId>('pink');
  const [selectedCakeTopping, setSelectedCakeTopping] = useState<CakeToppingId>('strawberry');
  const [selectedCakeCandle, setSelectedCakeCandle] = useState<CakeCandleId>('pink');

  const [soundEnabled] = useState<boolean>(true); // звук всегда включён
  useEffect(() => { setVoiceEnabled(soundEnabled); }, [soundEnabled]);
  const [faceArtByChar, setFaceArtByChar] = useState<Record<string, CharacterArtworkState>>({});
  const [tshirtArtByChar, setTshirtArtByChar] = useState<Record<string, CharacterTShirtState>>({});
  const [washByChar, setWashByChar] = useState<Record<string, CharacterWashState>>({});
  const [pizzaByChar, setPizzaByChar] = useState<Record<string, PizzaState>>({});
  const [iceCreamByChar, setIceCreamByChar] = useState<Record<string, IceCreamState>>({});
  const [drinkByChar, setDrinkByChar] = useState<Record<string, DrinkState>>({});
  const [soupByChar, setSoupByChar] = useState<Record<string, SoupState>>({});
  const [sandwichByChar, setSandwichByChar] = useState<Record<string, SandwichState>>({});
  const [cakeByChar, setCakeByChar] = useState<Record<string, CakeState>>({});

  const [praiseBubble, setPraiseBubble] = useState<string | null>(null);

  const creativeCountRef = useRef<number>(0);
  const praiseTimerRef = useRef<number | null>(null);
  const kitchenSvgRef = useRef<SVGSVGElement | null>(null);
  const soupSoundAccumRef = useRef<number>(0);

  const activeCharacter = useMemo(() => {
    return CHARACTERS.find((c) => c.id === selectedCharacterId) ?? CHARACTERS[0];
  }, [selectedCharacterId]);

  const currentFaceArt = faceArtByChar[activeCharacter.id] ?? EMPTY_ARTWORK;
  const currentTShirtArt = tshirtArtByChar[activeCharacter.id] ?? EMPTY_TSHIRT;
  const currentWash = washByChar[activeCharacter.id] ?? createInitialWashState('mix', 1);
  const currentPizza = pizzaByChar[activeCharacter.id] ?? INITIAL_PIZZA_STATE;
  const currentIceCream = iceCreamByChar[activeCharacter.id] ?? INITIAL_ICECREAM_STATE;
  const currentDrink = drinkByChar[activeCharacter.id] ?? INITIAL_DRINK_STATE;
  const currentSoup = soupByChar[activeCharacter.id] ?? INITIAL_SOUP_STATE;
  const currentSandwich = sandwichByChar[activeCharacter.id] ?? INITIAL_SANDWICH_STATE;
  const currentCake = cakeByChar[activeCharacter.id] ?? INITIAL_CAKE_STATE;

  const selectedPlacedTShirtSticker = useMemo(() => {
    if (gameMode !== 'tshirt' || !selectedTShirtStickerUid) return null;
    return currentTShirtArt.stickers.find((s) => s.uid === selectedTShirtStickerUid) ?? null;
  }, [gameMode, selectedTShirtStickerUid, currentTShirtArt.stickers]);

  const fireConfetti = useCallback((strong = false) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void confetti({
      particleCount: strong ? 70 : 28,
      spread: strong ? 75 : 55,
      origin: { y: 0.62 },
      colors: ['#FF3B5C', '#FFC700', '#10C97A', '#38BDF8', '#A855F7', '#FF7A1A'],
      disableForReducedMotion: true,
    });
  }, []);

  const showPraiseBubble = useCallback((text: string) => {
    setPraiseBubble(text);
    if (praiseTimerRef.current) {
      window.clearTimeout(praiseTimerRef.current);
    }
    praiseTimerRef.current = window.setTimeout(() => {
      setPraiseBubble(null);
    }, 3200);
  }, []);

  const triggerMilestonePraise = useCallback(
    (_char: CharacterItem) => {
      creativeCountRef.current += 1;
      if (creativeCountRef.current % 3 !== 0) return;

      const phrase = soundEngine.getNextRandomPraise();
      showPraiseBubble(phrase.text);
      fireConfetti(false);
      soundEngine.speakPraise(phrase, soundEnabled, false);
    },
    [fireConfetti, showPraiseBubble, soundEnabled]
  );

  const handleAddPaintOp = useCallback(
    (op: PaintOperation) => {
      if (gameMode === 'face') {
        setFaceArtByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? EMPTY_ARTWORK;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              paintOps: [...existing.paintOps, op],
              history: [...existing.history, { kind: 'paint', id: op.id }],
            },
          };
        });
      } else {
        setTshirtArtByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? EMPTY_TSHIRT;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              paintOps: [...existing.paintOps, op],
              history: [...existing.history, { kind: 'paint', id: op.id }],
            },
          };
        });
      }
      if (op.kind !== 'erase') {
        triggerMilestonePraise(activeCharacter);
      }
    },
    [activeCharacter, gameMode, triggerMilestonePraise]
  );

  const handleAddSticker = useCallback(
    (sticker: PlacedSticker) => {
      if (gameMode === 'face') {
        setFaceArtByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? EMPTY_ARTWORK;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              stickers: [...existing.stickers, sticker],
              history: [...existing.history, { kind: 'sticker', uid: sticker.uid }],
            },
          };
        });
      } else {
        setTshirtArtByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? EMPTY_TSHIRT;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              stickers: [...existing.stickers, sticker],
              history: [...existing.history, { kind: 'sticker', uid: sticker.uid }],
            },
          };
        });
      }
      triggerMilestonePraise(activeCharacter);
    },
    [activeCharacter, gameMode, triggerMilestonePraise]
  );

  const handleSelectFaceArtMask = useCallback(
    (maskId: string | null, dropPoint?: { x: number; y: number }) => {
      setFaceArtByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? EMPTY_ARTWORK;
        const previousMask = existing.faceArtMask;
        const nextMask: PlacedFaceArtMask | null = maskId
          ? {
              maskId,
              x: dropPoint?.x ?? previousMask?.x ?? 0.5,
              y: dropPoint?.y ?? previousMask?.y ?? activeCharacter.faceMaskAnchor.y,
              scale: previousMask?.scale ?? activeCharacter.faceMaskAnchor.scale,
              rotation: previousMask?.rotation ?? 0,
            }
          : null;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            faceArtMask: nextMask,
            history: [...existing.history, { kind: 'mask', previousMask }],
          },
        };
      });
      if (maskId) {
        soundEngine.playStickerChime(soundEnabled);
        triggerMilestonePraise(activeCharacter);
      } else {
        soundEngine.playEraseSwoosh(soundEnabled);
      }
    },
    [activeCharacter, soundEnabled, triggerMilestonePraise]
  );

  const handleUpdateFaceArtMask = useCallback(
    (patch: Partial<PlacedFaceArtMask>) => {
      setFaceArtByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || !existing.faceArtMask) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            faceArtMask: { ...existing.faceArtMask, ...patch },
          },
        };
      });
    },
    [activeCharacter.id]
  );

  const handleTransformFaceArtMask = useCallback(
    (action: 'smaller' | 'bigger' | 'up' | 'down' | 'reset' | 'remove') => {
      if (action === 'remove') {
        handleSelectFaceArtMask(null);
        return;
      }
      const existingMask = currentFaceArt.faceArtMask;
      if (!existingMask) return;

      if (action === 'smaller') {
        handleUpdateFaceArtMask({
          scale: Math.max(0.55, +(existingMask.scale - 0.08).toFixed(2)),
        });
      } else if (action === 'bigger') {
        handleUpdateFaceArtMask({
          scale: Math.min(1.45, +(existingMask.scale + 0.08).toFixed(2)),
        });
      } else if (action === 'up') {
        handleUpdateFaceArtMask({ y: Math.max(0.2, +(existingMask.y - 0.025).toFixed(3)) });
      } else if (action === 'down') {
        handleUpdateFaceArtMask({ y: Math.min(0.8, +(existingMask.y + 0.025).toFixed(3)) });
      } else if (action === 'reset') {
        handleUpdateFaceArtMask({
          x: 0.5,
          y: activeCharacter.faceMaskAnchor.y,
          scale: activeCharacter.faceMaskAnchor.scale,
          rotation: 0,
        });
      }
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [
      activeCharacter.faceMaskAnchor.scale,
      activeCharacter.faceMaskAnchor.y,
      currentFaceArt.faceArtMask,
      handleSelectFaceArtMask,
      handleUpdateFaceArtMask,
      soundEnabled,
    ]
  );

  const handleUpdateFaceSticker = useCallback(
    (uid: string, patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'scale' | 'rotation'>>) => {
      setFaceArtByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            stickers: existing.stickers.map((s) => (s.uid === uid ? { ...s, ...patch } : s)),
          },
        };
      });
    },
    [activeCharacter.id]
  );

  const handleUpdateTShirtSticker = useCallback(
    (uid: string, patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'scale' | 'rotation'>>) => {
      setTshirtArtByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            stickers: existing.stickers.map((s) => (s.uid === uid ? { ...s, ...patch } : s)),
          },
        };
      });
    },
    [activeCharacter.id]
  );

  const handleRemoveSticker = useCallback(
    (uid: string) => {
      if (gameMode === 'face') {
        setFaceArtByChar((prev) => {
          const existing = prev[activeCharacter.id];
          if (!existing) return prev;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              stickers: existing.stickers.filter((s) => s.uid !== uid),
              history: existing.history.filter(
                (h) => !(h.kind === 'sticker' && h.uid === uid)
              ),
            },
          };
        });
      } else {
        setTshirtArtByChar((prev) => {
          const existing = prev[activeCharacter.id];
          if (!existing) return prev;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              stickers: existing.stickers.filter((s) => s.uid !== uid),
              history: existing.history.filter(
                (h) => !(h.kind === 'sticker' && h.uid === uid)
              ),
            },
          };
        });
      }
    },
    [activeCharacter.id, gameMode]
  );

  const handleTransformSelectedTShirtSticker = useCallback(
    (action: 'smaller' | 'bigger' | 'rotateLeft' | 'rotateRight' | 'delete') => {
      if (!selectedPlacedTShirtSticker) return;
      const { uid, scale, rotation } = selectedPlacedTShirtSticker;

      if (action === 'delete') {
        handleRemoveSticker(uid);
        setSelectedTShirtStickerUid(null);
        soundEngine.playEraseSwoosh(soundEnabled);
        return;
      }

      if (action === 'smaller') {
        handleUpdateTShirtSticker(uid, { scale: Math.max(0.45, +(scale - 0.16).toFixed(2)) });
      } else if (action === 'bigger') {
        handleUpdateTShirtSticker(uid, { scale: Math.min(2.3, +(scale + 0.16).toFixed(2)) });
      } else if (action === 'rotateLeft') {
        handleUpdateTShirtSticker(uid, { rotation: rotation - Math.PI / 12 });
      } else if (action === 'rotateRight') {
        handleUpdateTShirtSticker(uid, { rotation: rotation + Math.PI / 12 });
      }
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [handleRemoveSticker, handleUpdateTShirtSticker, selectedPlacedTShirtSticker, soundEnabled]
  );

  const handleSelectTShirtColor = useCallback(
    (hex: string) => {
      setTshirtArtByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? EMPTY_TSHIRT;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            tshirtColor: hex,
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 2);
    },
    [activeCharacter.id, soundEnabled]
  );

  // ==================== WASH HANDLERS ====================
  const handleAddWashOp = useCallback(
    (op: WashOperation) => {
      setWashByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? createInitialWashState('mix', 1);
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            ops: [...existing.ops, op],
          },
        };
      });
    },
    [activeCharacter.id]
  );

  const handleMarkCleanCelebrated = useCallback(() => {
    setWashByChar((prev) => {
      const existing = prev[activeCharacter.id] ?? createInitialWashState('mix', 1);
      if (existing.celebrated) return prev;
      return {
        ...prev,
        [activeCharacter.id]: {
          ...existing,
          celebrated: true,
        },
      };
    });
    soundEngine.playCelebrationFanfare(soundEnabled);
    fireConfetti(true);
    const phrase = soundEngine.getRandomWashPraise();
    showPraiseBubble(phrase.text);
    soundEngine.speakPraise(phrase, soundEnabled, true);
  }, [activeCharacter.id, fireConfetti, showPraiseBubble, soundEnabled]);

  const handleResetMess = useCallback(
    (messType?: MessType) => {
      if (messType) playVoice(`wash_mess_${messType}`, soundEnabled, undefined, 'replace');
      setWashByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? createInitialWashState('mix', 1);
        return {
          ...prev,
          [activeCharacter.id]: createInitialWashState(
            messType ?? existing.messType,
            existing.messSeed + 1
          ),
        };
      });
      soundEngine.playBubblePop(soundEnabled);
    },
    [activeCharacter.id, soundEnabled]
  );

  const washUseSaidRef = useRef<Record<string, number>>({});
  const handleWashToolSound = useCallback(
    (kind: WashToolMode) => {
      // раз в ~15 секунд помощник комментирует, чем сейчас моем
      const nowMs = Date.now();
      if (nowMs - (washUseSaidRef.current[kind] ?? 0) > 15000) {
        washUseSaidRef.current[kind] = nowMs;
        window.setTimeout(() => playVoice(`wash_use_${kind}`, soundEnabled), 700);
      }
      if (kind === 'soap') soundEngine.playBubblePop(soundEnabled);
      else if (kind === 'sponge') soundEngine.playScrub(soundEnabled);
      else if (kind === 'shower') soundEngine.playWaterRinse(soundEnabled);
      else soundEngine.playHairDryer(soundEnabled);
    },
    [soundEnabled]
  );

  // ==================== PIZZA HANDLERS ====================
  const handleUpdatePizza = useCallback(
    (patch: Partial<PizzaState>) => {
      setPizzaByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_PIZZA_STATE;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            sauceId: existing.sauceId || 'tomato',
            ...patch,
          },
        };
      });
      if (patch.isBaked) {
        soundEngine.playOvenDing(soundEnabled);
        fireConfetti(false);
      } else {
        soundEngine.playTapPop(soundEnabled, 3);
      }
    },
    [activeCharacter.id, fireConfetti, soundEnabled]
  );

  const handlePlacePizzaTopping = useCallback(
    (x: number, y: number, overrideId?: PizzaToppingId) => {
      const toppingId = overrideId ?? selectedPizzaTopping;
      setPizzaByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_PIZZA_STATE;
        const clampedLen = Math.hypot(x, y);
        const factor = clampedLen > 0.92 ? 0.92 / clampedLen : 1;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            sauceId: existing.sauceId || 'tomato',
            toppings: [
              ...existing.toppings,
              {
                uid: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                toppingId,
                x: x * factor,
                y: y * factor,
                rotation: Math.round((Math.random() - 0.5) * 60),
                scale: 0.9 + Math.random() * 0.25,
              },
            ],
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 4);
    },
    [activeCharacter.id, selectedPizzaTopping, soundEnabled]
  );

  const handleScatterPizzaTopping = useCallback(
    (toppingId: PizzaToppingId) => {
      setPizzaByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_PIZZA_STATE;
        const extra = Array.from({ length: 4 }).map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const r = 0.25 + Math.random() * 0.6;
          return {
            uid: `pt_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
            toppingId,
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            rotation: Math.round((Math.random() - 0.5) * 80),
            scale: 0.9 + Math.random() * 0.22,
          };
        });
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            sauceId: existing.sauceId || 'tomato',
            toppings: [...existing.toppings, ...extra].slice(-36),
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 2);
    },
    [activeCharacter.id, soundEnabled]
  );

  // ==================== ICE CREAM HANDLERS ====================
  const handleSelectIceCreamBase = useCallback(
    (baseId: IceCreamBaseId) => {
      setIceCreamByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: {
          ...(prev[activeCharacter.id] ?? INITIAL_ICECREAM_STATE),
          baseId,
        },
      }));
      soundEngine.playTapPop(soundEnabled, 1);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleAddIceCreamScoop = useCallback(
    (flavorId: string) => {
      setIceCreamByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_ICECREAM_STATE;
        if (existing.scoops.length >= 4) {
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              scoops: [...existing.scoops.slice(1), flavorId],
            },
          };
        }
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            scoops: [...existing.scoops, flavorId],
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 5);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handlePopIceCreamScoop = useCallback(() => {
    setIceCreamByChar((prev) => {
      const existing = prev[activeCharacter.id] ?? INITIAL_ICECREAM_STATE;
      if (existing.scoops.length === 0) return prev;
      return {
        ...prev,
        [activeCharacter.id]: {
          ...existing,
          scoops: existing.scoops.slice(0, -1),
        },
      };
    });
    soundEngine.playEraseSwoosh(soundEnabled);
  }, [activeCharacter.id, soundEnabled]);

  const handleSelectIceCreamSyrup = useCallback(
    (syrupId: string) => {
      setIceCreamByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: {
          ...(prev[activeCharacter.id] ?? INITIAL_ICECREAM_STATE),
          syrupId,
        },
      }));
      soundEngine.playBubblePop(soundEnabled);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleToggleIceCreamGarnish = useCallback(
    (garnishId: IceCreamGarnishId) => {
      setIceCreamByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_ICECREAM_STATE;
        const has = existing.garnishes.includes(garnishId);
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            garnishes: has
              ? existing.garnishes.filter((g) => g !== garnishId)
              : [...existing.garnishes, garnishId],
          },
        };
      });
      soundEngine.playStickerChime(soundEnabled);
    },
    [activeCharacter.id, soundEnabled]
  );

  // ==================== DRINKS HANDLERS ====================
  const handleSelectDrinkCategory = useCallback(
    (category: DrinkCategoryId) => {
      const defaultFlavor =
        DRINK_FLAVORS.find((f) => f.category === category)?.id ?? DRINK_FLAVORS[0].id;
      setDrinkByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_DRINK_STATE;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            category,
            flavorId: defaultFlavor,
            pourLevel: 0,
            stirAngle: 0,
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 2);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleSelectDrinkFlavor = useCallback(
    (flavorId: string) => {
      setDrinkByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: {
          ...(prev[activeCharacter.id] ?? INITIAL_DRINK_STATE),
          flavorId,
          pourLevel: 0,
          stirAngle: 0,
        },
      }));
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleToggleDrinkAddon = useCallback(
    (addonId: DrinkAddonId) => {
      setDrinkByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_DRINK_STATE;
        const has = existing.addons.includes(addonId);
        const fallbackFlavor =
          DRINK_FLAVORS.find((f) => f.category === existing.category)?.id ?? DRINK_FLAVORS[0].id;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            flavorId: existing.flavorId || fallbackFlavor,
            addons: has
              ? existing.addons.filter((a) => a !== addonId)
              : [...existing.addons, addonId],
          },
        };
      });
      soundEngine.playBubblePop(soundEnabled);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleStirDrink = useCallback(() => {
    setDrinkByChar((prev) => {
      const existing = prev[activeCharacter.id] ?? INITIAL_DRINK_STATE;
      return {
        ...prev,
        [activeCharacter.id]: {
          ...existing,
          stirAngle: existing.stirAngle + 45,
        },
      };
    });
    soundEngine.playBubblePop(soundEnabled);
  }, [activeCharacter.id, soundEnabled]);

  const handleSetDrinkPourLevel = useCallback(
    (pourLevel: number) => {
      setDrinkByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_DRINK_STATE;
        if (Math.abs(existing.pourLevel - pourLevel) < 0.001) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            pourLevel,
          },
        };
      });
    },
    [activeCharacter.id]
  );

  // ==================== SOUP HANDLERS ====================
  const handleSelectSoupBroth = useCallback(
    (brothId: string) => {
      setSoupByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: {
          ...(prev[activeCharacter.id] ?? INITIAL_SOUP_STATE),
          brothId,
        },
      }));
      soundEngine.playBubblePop(soundEnabled);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleAddSoupIngredient = useCallback(
    (ingredientId: SoupIngredientId, dropPos?: { radius: number; angle: number }) => {
      setSoupByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_SOUP_STATE;
        const nextItem = {
          uid: `soup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ingredientId,
          radius: dropPos ? dropPos.radius : 0.18 + Math.random() * 0.65,
          angle: dropPos ? dropPos.angle : Math.random() * Math.PI * 2,
          rotation: Math.round((Math.random() - 0.5) * 60),
        };
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            brothId: existing.brothId || 'chicken',
            ingredients: [...existing.ingredients, nextItem].slice(-28),
          },
        };
      });
      soundEngine.playBubblePop(soundEnabled);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleStirSoupBy = useCallback(
    (deltaDeg: number) => {
      setSoupByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_SOUP_STATE;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            brothId: existing.brothId || 'chicken',
            stirAngle: existing.stirAngle + deltaDeg,
          },
        };
      });
      soupSoundAccumRef.current += Math.abs(deltaDeg);
      if (soupSoundAccumRef.current >= 45) {
        soupSoundAccumRef.current = 0;
        soundEngine.playBubblePop(soundEnabled);
      }
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleToggleSoupBowl = useCallback(() => {
    setSoupByChar((prev) => {
      const existing = prev[activeCharacter.id] ?? INITIAL_SOUP_STATE;
      return {
        ...prev,
        [activeCharacter.id]: {
          ...existing,
          inBowl: !existing.inBowl,
        },
      };
    });
    soundEngine.playTapPop(soundEnabled, 3);
  }, [activeCharacter.id, soundEnabled]);

  // ==================== SANDWICH HANDLERS ====================
  const handleSelectSandwichBread = useCallback(
    (breadId: SandwichBreadId) => {
      setSandwichByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_SANDWICH_STATE;
        const isEmpty =
          existing.spreadId === 'none' && existing.layers.length === 0 && !existing.hasTopBread;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            breadId,
            spreadId: isEmpty ? 'butter' : existing.spreadId,
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 1);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleSelectSandwichSpread = useCallback(
    (spreadId: string) => {
      setSandwichByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: {
          ...(prev[activeCharacter.id] ?? INITIAL_SANDWICH_STATE),
          spreadId,
        },
      }));
      soundEngine.playTapPop(soundEnabled, 2);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleAddSandwichFilling = useCallback(
    (fillingId: SandwichFillingId) => {
      setSandwichByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_SANDWICH_STATE;
        const nextLayers =
          existing.layers.length >= 7
            ? [...existing.layers.slice(1), fillingId]
            : [...existing.layers, fillingId];
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            layers: nextLayers,
          },
        };
      });
      soundEngine.playTapPop(soundEnabled, 4);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handlePopSandwichFilling = useCallback(() => {
    setSandwichByChar((prev) => {
      const existing = prev[activeCharacter.id] ?? INITIAL_SANDWICH_STATE;
      if (existing.layers.length === 0) return prev;
      return {
        ...prev,
        [activeCharacter.id]: {
          ...existing,
          layers: existing.layers.slice(0, -1),
        },
      };
    });
    soundEngine.playEraseSwoosh(soundEnabled);
  }, [activeCharacter.id, soundEnabled]);

  const handleToggleSandwichTopBread = useCallback(() => {
    setSandwichByChar((prev) => {
      const existing = prev[activeCharacter.id] ?? INITIAL_SANDWICH_STATE;
      return {
        ...prev,
        [activeCharacter.id]: {
          ...existing,
          hasTopBread: !existing.hasTopBread,
        },
      };
    });
    soundEngine.playTapPop(soundEnabled, 2);
  }, [activeCharacter.id, soundEnabled]);

  // ==================== CAKE HANDLERS ====================
  const handleSelectCakeTab = useCallback(
    (tab: CakeToolTab) => {
      setCakeTab(tab);
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [soundEnabled]
  );

  const handleSelectCakeBase = useCallback(
    (cakeId: CakeFlavorId) => {
      setCakeByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: {
          ...(prev[activeCharacter.id] ?? INITIAL_CAKE_STATE),
          cakeId,
        },
      }));
      soundEngine.playTapPop(soundEnabled, 2);
    },
    [activeCharacter.id, soundEnabled]
  );

  const handleSelectCakeRosette = useCallback(
    (rosetteId: CakeRosetteId) => {
      setSelectedCakeRosette(rosetteId);
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [soundEnabled]
  );

  const handleSelectCakeTopping = useCallback(
    (toppingId: CakeToppingId) => {
      setSelectedCakeTopping(toppingId);
      soundEngine.playTapPop(soundEnabled, 4);
    },
    [soundEnabled]
  );

  const handleSelectCakeCandle = useCallback(
    (candleId: CakeCandleId) => {
      setSelectedCakeCandle(candleId);
      soundEngine.playTapPop(soundEnabled, 5);
    },
    [soundEnabled]
  );

  const handleAddCakeItem = useCallback(
    (item: Omit<PlacedCakeItem, 'uid' | 't0'>) => {
      const nextItem: PlacedCakeItem = {
        ...item,
        uid: `ck_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        t0: performance.now(),
      };
      setCakeByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_CAKE_STATE;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            items: [...existing.items, nextItem].slice(-260),
            blown: item.type === 'candle' ? false : existing.blown,
          },
        };
      });
      triggerMilestonePraise(activeCharacter);
    },
    [activeCharacter, triggerMilestonePraise]
  );

  const handleUpdateCakeItems = useCallback(
    (items: PlacedCakeItem[], blown?: boolean) => {
      setCakeByChar((prev) => {
        const existing = prev[activeCharacter.id] ?? INITIAL_CAKE_STATE;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            items,
            blown: blown !== undefined ? blown : existing.blown,
          },
        };
      });
    },
    [activeCharacter.id]
  );

  const handleFeedCharacter = useCallback(() => {
    soundEngine.playCrunchYum(soundEnabled);
    fireConfetti(true);
    const phrase = soundEngine.getRandomFeedPraise();
    showPraiseBubble(phrase.text);
    soundEngine.speakPraise(phrase, soundEnabled, true);
  }, [fireConfetti, showPraiseBubble, soundEnabled]);

  const handleResetDishToEmpty = useCallback(
    (mode: KitchenMode) => {
      if (mode === 'pizza') {
        setPizzaByChar((prev) => ({
          ...prev,
          [activeCharacter.id]: {
            sauceId: '',
            hasCheese: false,
            toppings: [],
            isBaked: false,
            isSliced: false,
          },
        }));
      } else if (mode === 'icecream') {
        setIceCreamByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? INITIAL_ICECREAM_STATE;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              scoops: [],
              syrupId: 'none',
              garnishes: [],
            },
          };
        });
      } else if (mode === 'drinks') {
        setDrinkByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? INITIAL_DRINK_STATE;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              addons: [],
              stirAngle: 0,
              pourLevel: 0,
            },
          };
        });
      } else if (mode === 'soup') {
        setSoupByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? INITIAL_SOUP_STATE;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              brothId: '',
              ingredients: [],
              stirAngle: 0,
            },
          };
        });
      } else if (mode === 'sandwich') {
        setSandwichByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? INITIAL_SANDWICH_STATE;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              spreadId: 'none',
              layers: [],
              hasTopBread: false,
            },
          };
        });
      } else if (mode === 'cake') {
        setCakeByChar((prev) => {
          const existing = prev[activeCharacter.id] ?? INITIAL_CAKE_STATE;
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              items: [],
              blown: false,
            },
          };
        });
      }
    },
    [activeCharacter.id]
  );

  const handleUndo = useCallback(() => {
    if (gameMode === 'face') {
      setFaceArtByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || existing.history.length === 0) return prev;
        const last = existing.history[existing.history.length - 1];
        const nextHistory = existing.history.slice(0, -1);

        if (last.kind === 'paint') {
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              paintOps: existing.paintOps.filter((op) => op.id !== last.id),
              history: nextHistory,
            },
          };
        }
        if (last.kind === 'mask') {
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              faceArtMask: last.previousMask,
              history: nextHistory,
            },
          };
        }
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            stickers: existing.stickers.filter((s) => s.uid !== last.uid),
            history: nextHistory,
          },
        };
      });
    } else if (gameMode === 'tshirt') {
      setTshirtArtByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || existing.history.length === 0) return prev;
        const last = existing.history[existing.history.length - 1];
        const nextHistory = existing.history.slice(0, -1);

        if (last.kind === 'paint') {
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              paintOps: existing.paintOps.filter((op) => op.id !== last.id),
              history: nextHistory,
            },
          };
        }
        if (selectedTShirtStickerUid === last.uid) {
          setSelectedTShirtStickerUid(null);
        }
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            stickers: existing.stickers.filter((s) => s.uid !== last.uid),
            history: nextHistory,
          },
        };
      });
    } else if (gameMode === 'wash') {
      setWashByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || existing.ops.length === 0) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            ops: existing.ops.slice(0, -1),
            celebrated: false,
          },
        };
      });
    } else if (gameMode === 'pizza') {
      setPizzaByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || existing.toppings.length === 0) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            toppings: existing.toppings.slice(0, -1),
          },
        };
      });
    } else if (gameMode === 'icecream') {
      handlePopIceCreamScoop();
      return;
    } else if (gameMode === 'soup') {
      setSoupByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || existing.ingredients.length === 0) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            ingredients: existing.ingredients.slice(0, -1),
          },
        };
      });
    } else if (gameMode === 'sandwich') {
      handlePopSandwichFilling();
      return;
    } else if (gameMode === 'drinks') {
      setDrinkByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing) return prev;
        if (existing.addons.length > 0) {
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              addons: existing.addons.slice(0, -1),
            },
          };
        }
        if (existing.pourLevel > 0) {
          return {
            ...prev,
            [activeCharacter.id]: {
              ...existing,
              pourLevel: 0,
              stirAngle: 0,
            },
          };
        }
        return prev;
      });
    } else if (gameMode === 'cake') {
      setCakeByChar((prev) => {
        const existing = prev[activeCharacter.id];
        if (!existing || existing.items.length === 0) return prev;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...existing,
            items: existing.items.slice(0, -1),
          },
        };
      });
    }
    soundEngine.playEraseSwoosh(soundEnabled);
  }, [
    activeCharacter.id,
    gameMode,
    handlePopIceCreamScoop,
    handlePopSandwichFilling,
    selectedTShirtStickerUid,
    soundEnabled,
  ]);

  const handleClear = useCallback(() => {
    if (gameMode === 'face') {
      setFaceArtByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: EMPTY_ARTWORK,
      }));
    } else if (gameMode === 'tshirt') {
      setSelectedTShirtStickerUid(null);
      setTshirtArtByChar((prev) => {
        const prevColor = prev[activeCharacter.id]?.tshirtColor ?? EMPTY_TSHIRT.tshirtColor;
        return {
          ...prev,
          [activeCharacter.id]: {
            ...EMPTY_TSHIRT,
            tshirtColor: prevColor,
          },
        };
      });
    } else if (gameMode === 'wash') {
      handleResetMess();
      return;
    } else if (gameMode === 'pizza') {
      setPizzaByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: INITIAL_PIZZA_STATE,
      }));
    } else if (gameMode === 'icecream') {
      setIceCreamByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: INITIAL_ICECREAM_STATE,
      }));
    } else if (gameMode === 'drinks') {
      setDrinkByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: INITIAL_DRINK_STATE,
      }));
    } else if (gameMode === 'soup') {
      setSoupByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: INITIAL_SOUP_STATE,
      }));
    } else if (gameMode === 'sandwich') {
      setSandwichByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: INITIAL_SANDWICH_STATE,
      }));
    } else if (gameMode === 'cake') {
      setCakeByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: INITIAL_CAKE_STATE,
      }));
    }
    soundEngine.playEraseSwoosh(soundEnabled);
  }, [activeCharacter.id, gameMode, handleResetMess, soundEnabled]);

  const handleTapFeedback = useCallback(
    (kind: 'paint' | 'stamp' | 'sticker' | 'erase') => {
      if (kind === 'paint' || kind === 'stamp') {
        soundEngine.playTapPop(soundEnabled, creativeCountRef.current);
      } else if (kind === 'sticker') {
        soundEngine.playStickerChime(soundEnabled);
      } else {
        soundEngine.playEraseSwoosh(soundEnabled);
      }
    },
    [soundEnabled]
  );

  const handleCelebrateDone = useCallback(() => {
    soundEngine.playCelebrationFanfare(soundEnabled);
    fireConfetti(true);
    const phrase = soundEngine.getNextRandomPraise();
    showPraiseBubble(phrase.text || DONE_PRAISE.text);
    soundEngine.speakPraise(phrase, soundEnabled, true);
  }, [fireConfetti, showPraiseBubble, soundEnabled]);

  const handleSelectCharacter = (char: CharacterItem) => {
    setSelectedCharacterId(char.id);
    setSelectedTShirtStickerUid(null);
    soundEngine.playTapPop(soundEnabled, 2);
  };

  const hasArtwork =
    gameMode === 'face'
      ? currentFaceArt.paintOps.length > 0 ||
        currentFaceArt.stickers.length > 0 ||
        Boolean(currentFaceArt.faceArtMask)
      : gameMode === 'tshirt'
      ? currentTShirtArt.paintOps.length > 0 || currentTShirtArt.stickers.length > 0
      : gameMode === 'wash'
      ? currentWash.ops.length > 0 || currentWash.celebrated
      : gameMode === 'pizza'
      ? currentPizza.toppings.length > 0 || currentPizza.isBaked
      : gameMode === 'icecream'
      ? currentIceCream.scoops.length > 0 || currentIceCream.garnishes.length > 0
      : gameMode === 'soup'
      ? currentSoup.ingredients.length > 0
      : gameMode === 'sandwich'
      ? currentSandwich.layers.length > 0
      : gameMode === 'cake'
      ? currentCake.items.length > 0 || currentCake.cakeId !== INITIAL_CAKE_STATE.cakeId
      : currentDrink.pourLevel > 0.01 || currentDrink.addons.length > 0;

  const handleSelectToolMode = useCallback(
    (m: ToolMode) => {
      setToolMode(m);
      if (m !== 'sticker') {
        setSelectedTShirtStickerUid(null);
      }
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [soundEnabled]
  );

  const handleSelectPaintColor = useCallback(
    (hex: string) => {
      setSelectedColor(hex);
      soundEngine.playTapPop(soundEnabled, 1);
    },
    [soundEnabled]
  );

  const handleSelectStampItem = useCallback(
    (id: PatternStampId) => {
      setSelectedStamp(id);
      soundEngine.playTapPop(soundEnabled, 4);
    },
    [soundEnabled]
  );

  const handleSelectStickerItem = useCallback(
    (id: string) => {
      setSelectedStickerId(id);
      soundEngine.playStickerChime(soundEnabled);
    },
    [soundEnabled]
  );

  const handleSelectWashTool = useCallback(
    (tool: WashToolMode) => {
      setWashTool(tool);
      soundEngine.playTapPop(soundEnabled, 2);
      playVoice(`wash_tool_${tool}`, soundEnabled, undefined, 'replace');
      washUseSaidRef.current[tool] = Date.now();
    },
    [soundEnabled]
  );

  const handleSelectPizzaToppingItem = useCallback(
    (id: PizzaToppingId) => {
      setSelectedPizzaTopping(id);
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [soundEnabled]
  );

  const handleStartMode = useCallback(
    (mode: AllGameMode) => {
      setGameMode(mode);
      playVoice(`name_${mode}`, soundEnabled);
      // В играх с героем (кроме рисования и футболки) герой каждый раз случайный
      setRandomHero(
        mode === 'feed' || mode === 'puzzle' || mode === 'weather'
          ? CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
          : null,
      );
      if (mode !== 'tshirt') {
        setSelectedTShirtStickerUid(null);
      }
      if (mode === 'tshirt' && toolMode === 'mask') {
        setToolMode('paint');
      }
      setPraiseBubble(null);
      setScreen('play');
      soundEngine.playTapPop(soundEnabled, 3);
    },
    [soundEnabled, toolMode]
  );

  const handleReturnToMenu = useCallback(() => {
    setSelectedTShirtStickerUid(null);
    setPraiseBubble(null);
    setScreen('menu');
    soundEngine.playTapPop(soundEnabled, 1);
  }, [soundEnabled]);


  return (
    <DragProvider>
    <div
      className={`relative h-[100dvh] flex flex-col text-[#24211D] overflow-hidden ${screen === 'play' ? 'toy-stage-bg' : 'bg-[#FAF8F4]'}`}
      style={screen === 'play' ? { backgroundImage: `linear-gradient(rgba(255,248,235,0.35), rgba(255,248,235,0.35)), url(${stageBackground(gameMode)})` } : undefined}
    >
      {/* Верхняя полоска: только иконки (домик и звук), без заголовков и текста */}
      {screen === 'play' ? (
        <header className="relative z-40 flex items-center justify-between gap-2 px-3 sm:px-5 py-2 shrink-0">
          <button
            type="button"
            onClick={handleReturnToMenu}
            aria-label="В дом"
            className="w-14 h-14 sm:w-16 sm:h-16 cursor-pointer outline-none active:scale-90 transition-transform drop-shadow-[0_5px_5px_rgba(0,0,0,0.25)]"
          >
            <img src="/assets/design/ui/btn_home.webp" alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
          </div>
        </header>
      ) : (
        <div className="absolute right-3 top-3 z-40 flex items-center gap-2">
          <PWAInstallButton />
        </div>
      )}

      {screen === 'play' && <HelperCorner />}
      {!splashDone && <SplashScreen voiceEnabled={soundEnabled} onDone={() => setSplashDone(true)} />}
      {screen === 'menu' ? (
        <MapHub
          characters={CHARACTERS}
          selectedCharacterId={activeCharacter.id}
          onSelectCharacter={handleSelectCharacter}
          onStartMode={handleStartMode}
          voiceEnabled={soundEnabled}
          onTap={(pitch = 2) => soundEngine.playTapPop(soundEnabled, pitch)}
        />
      ) : (PLAY_MODES as string[]).includes(gameMode) || REMADE_MODES.includes(gameMode) ? (
        <main className="flex-1 min-h-0">
          <PlayRouter mode={gameMode} character={activeCharacter} soundEnabled={soundEnabled} />
        </main>
      ) : gameMode === 'feed' ||
        gameMode === 'shadow' ||
        gameMode === 'bubbles' ||
        gameMode === 'memory' ||
        gameMode === 'puzzle' ||
        gameMode === 'weather' ||
        gameMode === 'simon' ||
        gameMode === 'bigsmall' ||
        gameMode === 'emotions' ||
        gameMode === 'tv' ||
        gameMode === 'coloring' ? (
        <main className="flex-1 flex flex-col p-2 sm:p-4 max-w-[1160px] w-full mx-auto min-h-0 overflow-hidden">
          {gameMode === 'feed' && (
            <FeedGame
              initialCharacter={randomHero ?? activeCharacter}
              soundEnabled={soundEnabled}
            />
          )}
          {gameMode === 'shadow' && (
            <ShadowGame soundEnabled={soundEnabled} />
          )}
          {gameMode === 'bubbles' && (
            <BubblesGame soundEnabled={soundEnabled} />
          )}
          {gameMode === 'memory' && (
            <MemoryGame
              selectedCharacterId={activeCharacter.id}
              soundEnabled={soundEnabled}
            />
          )}
          {gameMode === 'puzzle' && (
            <PuzzleGame
              initialCharacter={randomHero ?? activeCharacter}
              soundEnabled={soundEnabled}
            />
          )}
          {gameMode === 'weather' && (
            <WeatherDressGame
              initialCharacter={randomHero ?? activeCharacter}
              soundEnabled={soundEnabled}
            />
          )}
          {gameMode === 'simon' && <SimonGame soundEnabled={soundEnabled} />}
          {gameMode === 'bigsmall' && <BigSmallGame soundEnabled={soundEnabled} />}
          {gameMode === 'tv' && <TvGame soundEnabled={soundEnabled} />}
          {gameMode === 'emotions' && (
            <EmotionsGame soundEnabled={soundEnabled} />
          )}
          {gameMode === 'coloring' && (
            <ColoringGame soundEnabled={soundEnabled} />
          )}
        </main>
      ) : (
      /* Focused Gameplay Workspace — only active stage + tools needed for this mode */
      <main className="relative flex-1 flex flex-col lg:flex-row items-stretch gap-1.5 sm:gap-3 lg:gap-4 p-2 sm:p-4 max-w-[1320px] w-full mx-auto min-h-0 overflow-hidden">
        {/* T-shirt colors panel: Top on portrait / Left on desktop */}
        {gameMode === 'tshirt' && (
          <TShirtColorPanel
            tshirtColor={currentTShirtArt.tshirtColor}
            onSelectTShirtColor={handleSelectTShirtColor}
          />
        )}

        {/* Center: Interactive Stage + Quick Controls */}
        <section className={`order-2 lg:order-2 flex-1 flex flex-col items-center justify-between gap-1.5 sm:gap-2.5 min-h-0 min-w-0 ${gameMode === 'face' || gameMode === 'tshirt' ? 'px-[104px] sm:px-[160px]' : ''}`}>

          {/* Active Stage */}
          <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
            {(gameMode === 'face' || gameMode === 'tshirt') && !hasArtwork && (
              <div className="pointer-events-none absolute left-1/2 top-[58%] z-30 -translate-x-1/2 animate-hand-bob">
                <svg viewBox="0 0 64 64" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]">
                  <path d="M27 6c3 0 5 2 5 5v18l4-2c3-1 6 1 6 4l1-1c3-1 6 1 6 4l1-1c3-1 6 1 6 5v12c0 8-6 14-14 14H33c-6 0-10-3-13-8L8 37c-2-3 0-6 3-6 2 0 4 1 5 3l6 8V11c0-3 2-5 5-5z" fill="#FFE0BD" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M27 6c3 0 5 2 5 5v18" fill="none" stroke="#E8A66B" strokeWidth="1.5" />
                </svg>
              </div>
            )}
            {gameMode === 'face' ? (
              <FaceArtStage
                character={activeCharacter}
                toolMode={toolMode}
                selectedColor={selectedColor}
                brushSize={brushSize}
                selectedStamp={selectedStamp}
                selectedStickerId={selectedStickerId}
                faceArtMask={currentFaceArt.faceArtMask}
                paintOps={currentFaceArt.paintOps}
                stickers={currentFaceArt.stickers}
                praiseBubble={praiseBubble}
                onSelectToolMode={handleSelectToolMode}
                onSelectColor={handleSelectPaintColor}
                onSelectStamp={handleSelectStampItem}
                onSelectSticker={handleSelectStickerItem}
                onSelectFaceArtMask={handleSelectFaceArtMask}
                onAddPaintOp={handleAddPaintOp}
                onAddSticker={handleAddSticker}
                onUpdateSticker={handleUpdateFaceSticker}
                onRemoveSticker={handleRemoveSticker}
                onUpdateFaceArtMask={handleUpdateFaceArtMask}
                onTapFeedback={handleTapFeedback}
              />
            ) : gameMode === 'tshirt' ? (
              <TShirtStage
                character={activeCharacter}
                tshirtColor={currentTShirtArt.tshirtColor}
                toolMode={toolMode}
                selectedColor={selectedColor}
                brushSize={brushSize}
                selectedStamp={selectedStamp}
                selectedStickerId={selectedStickerId}
                paintOps={currentTShirtArt.paintOps}
                stickers={currentTShirtArt.stickers}
                selectedStickerUid={selectedTShirtStickerUid}
                praiseBubble={praiseBubble}
                onSelectTShirtColor={handleSelectTShirtColor}
                onSelectToolMode={handleSelectToolMode}
                onSelectColor={handleSelectPaintColor}
                onSelectStamp={handleSelectStampItem}
                onSelectSticker={handleSelectStickerItem}
                onSelectStickerUid={setSelectedTShirtStickerUid}
                onAddPaintOp={handleAddPaintOp}
                onAddSticker={handleAddSticker}
                onUpdateSticker={handleUpdateTShirtSticker}
                onRemoveSticker={handleRemoveSticker}
                onTapFeedback={handleTapFeedback}
              />
            ) : gameMode === 'wash' ? (
              <WashStage
                character={activeCharacter}
                washTool={washTool}
                washState={currentWash}
                praiseBubble={praiseBubble}
                onSelectWashTool={handleSelectWashTool}
                onResetMess={handleResetMess}
                onAddWashOp={handleAddWashOp}
                onMarkCleanCelebrated={handleMarkCleanCelebrated}
                onToolSound={handleWashToolSound}
              />
            ) : gameMode === 'pizza' ? (
              <PizzaMission character={activeCharacter} soundEnabled={soundEnabled} />
            ) : gameMode === 'icecream' ? (
              <IceCreamMission character={activeCharacter} soundEnabled={soundEnabled} />
            ) : gameMode === 'soup' ? (
              <SoupMission character={activeCharacter} soundEnabled={soundEnabled} />
            ) : gameMode === 'sandwich' ? (
              <SandwichMission character={activeCharacter} soundEnabled={soundEnabled} />
            ) : gameMode === 'cake' ? (
              <CakeMission character={activeCharacter} soundEnabled={soundEnabled} />
            ) : gameMode === 'drinks' ? (
              <DrinksMission character={activeCharacter} soundEnabled={soundEnabled} />
            ) : (
              <KitchenStage
                mode={gameMode as KitchenMode}
                character={activeCharacter}
                pizza={currentPizza}
                selectedPizzaTopping={selectedPizzaTopping}
                iceCream={currentIceCream}
                drink={currentDrink}
                soup={currentSoup}
                sandwich={currentSandwich}
                cake={currentCake}
                cakeTab={cakeTab}
                selectedCakeRosette={selectedCakeRosette}
                selectedCakeTopping={selectedCakeTopping}
                selectedCakeCandle={selectedCakeCandle}
                praiseBubble={praiseBubble}
                soundEnabled={soundEnabled}
                svgExportRef={kitchenSvgRef}
                onSelectPizzaTopping={handleSelectPizzaToppingItem}
                onUpdatePizza={handleUpdatePizza}
                onPlacePizzaTopping={handlePlacePizzaTopping}
                onSelectIceCreamBase={handleSelectIceCreamBase}
                onAddIceCreamScoop={handleAddIceCreamScoop}
                onPopIceCreamScoop={handlePopIceCreamScoop}
                onSelectIceCreamSyrup={handleSelectIceCreamSyrup}
                onToggleIceCreamGarnish={handleToggleIceCreamGarnish}
                onSelectDrinkCategory={handleSelectDrinkCategory}
                onSelectDrinkFlavor={handleSelectDrinkFlavor}
                onToggleDrinkAddon={handleToggleDrinkAddon}
                onStirDrink={handleStirDrink}
                onSetDrinkPourLevel={handleSetDrinkPourLevel}
                onSelectSoupBroth={handleSelectSoupBroth}
                onToggleSoupBowl={handleToggleSoupBowl}
                onAddSoupIngredient={handleAddSoupIngredient}
                onStirSoupBy={handleStirSoupBy}
                onSelectSandwichBread={handleSelectSandwichBread}
                onToggleSandwichTopBread={handleToggleSandwichTopBread}
                onSelectSandwichSpread={handleSelectSandwichSpread}
                onAddSandwichFilling={handleAddSandwichFilling}
                onSelectCakeBase={handleSelectCakeBase}
                onAddCakeItem={handleAddCakeItem}
                onUpdateCakeItems={handleUpdateCakeItems}
                onFeedCharacter={handleFeedCharacter}
                onResetDishToEmpty={handleResetDishToEmpty}
              />
            )}
          </div>

          {/* Кнопки-иконки: вернуть, очистить, готово (без текста) */}
          <div className={`flex items-center justify-center gap-4 sm:gap-6 shrink-0 ${gameMode === 'pizza' || gameMode === 'icecream' || gameMode === 'soup' || gameMode === 'sandwich' || gameMode === 'cake' || gameMode === 'drinks' ? 'hidden' : ''}`}>
            <button
              type="button"
              onClick={handleUndo}
              disabled={!hasArtwork}
              aria-label="Отменить"
              className="w-14 h-14 sm:w-16 sm:h-16 cursor-pointer outline-none active:scale-90 transition-transform disabled:opacity-40 disabled:grayscale drop-shadow-[0_5px_5px_rgba(0,0,0,0.25)]"
            >
              <img src="/assets/design/ui/btn_replay.webp" alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
            </button>

            {(gameMode === 'face' || gameMode === 'tshirt') && (
              <button
                type="button"
                onClick={() => handleSelectToolMode('eraser')}
                aria-label="Ластик"
                className={`w-14 h-14 sm:w-16 sm:h-16 cursor-pointer outline-none transition-transform active:scale-90 flex items-center justify-center rounded-full ${toolMode === 'eraser' ? 'toy-chip-on' : ''}`}
              >
                <img src="/assets/design/tools/eraser.webp" alt="" draggable={false} className="w-[80%] h-[80%] object-contain pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasArtwork && gameMode !== 'wash'}
              aria-label="Очистить"
              className="w-14 h-14 sm:w-16 sm:h-16 cursor-pointer outline-none active:scale-90 transition-transform disabled:opacity-40 disabled:grayscale drop-shadow-[0_5px_5px_rgba(0,0,0,0.25)]"
            >
              <img src="/assets/design/ui/btn_trash.webp" alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
            </button>

            <button
              type="button"
              onClick={handleCelebrateDone}
              aria-label="Готово"
              className="w-14 h-14 sm:w-16 sm:h-16 cursor-pointer outline-none active:scale-90 transition-transform disabled:opacity-40 disabled:grayscale drop-shadow-[0_5px_5px_rgba(0,0,0,0.25)]"
            >
              <img src="/assets/design/ui/btn_check.webp" alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
            </button>
          </div>
        </section>

        {/* Right on Desktop / Top or Bottom on Portrait: Mode-Appropriate Palette, Kitchen Ingredients, or Wash Tools */}
        {gameMode === 'face' || gameMode === 'tshirt' ? (
          <ArtToolbar
            gameMode={gameMode as GameMode}
            toolMode={toolMode}
            selectedColor={selectedColor}
            brushSize={brushSize}
            selectedStamp={selectedStamp}
            selectedStickerId={selectedStickerId}
            selectedPlacedSticker={selectedPlacedTShirtSticker}
            activeFaceArtMask={currentFaceArt.faceArtMask}
            onSelectToolMode={handleSelectToolMode}
            onSelectColor={handleSelectPaintColor}
            onSelectBrushSize={setBrushSize}
            onSelectStamp={handleSelectStampItem}
            onSelectSticker={handleSelectStickerItem}
            onSelectFaceArtMask={handleSelectFaceArtMask}
            onTransformFaceArtMask={handleTransformFaceArtMask}
            onTransformSelectedSticker={handleTransformSelectedTShirtSticker}
            onClearAll={handleClear}
          />
        ) : gameMode === 'pizza' || gameMode === 'icecream' || gameMode === 'soup' || gameMode === 'sandwich' || gameMode === 'cake' || gameMode === 'drinks' ? null : (
          <ModeToolbar
            mode={gameMode as Exclude<typeof gameMode, PlayMode>}
            washTool={washTool}
            messType={currentWash.messType}
            onSelectWashTool={handleSelectWashTool}
            onResetMess={handleResetMess}
            pizza={currentPizza}
            selectedPizzaTopping={selectedPizzaTopping}
            onSelectPizzaTopping={handleSelectPizzaToppingItem}
            onUpdatePizza={handleUpdatePizza}
            onScatterPizzaTopping={handleScatterPizzaTopping}
            iceCream={currentIceCream}
            onSelectIceCreamBase={handleSelectIceCreamBase}
            onAddIceCreamScoop={handleAddIceCreamScoop}
            onPopIceCreamScoop={handlePopIceCreamScoop}
            onSelectIceCreamSyrup={handleSelectIceCreamSyrup}
            onToggleIceCreamGarnish={handleToggleIceCreamGarnish}
            drink={currentDrink}
            onSelectDrinkCategory={handleSelectDrinkCategory}
            onSelectDrinkFlavor={handleSelectDrinkFlavor}
            onToggleDrinkAddon={handleToggleDrinkAddon}
            onStirDrink={handleStirDrink}
            soup={currentSoup}
            onSelectSoupBroth={handleSelectSoupBroth}
            onAddSoupIngredient={handleAddSoupIngredient}
            onStirSoup={() => handleStirSoupBy(38)}
            onToggleSoupBowl={handleToggleSoupBowl}
            sandwich={currentSandwich}
            onSelectSandwichBread={handleSelectSandwichBread}
            onSelectSandwichSpread={handleSelectSandwichSpread}
            onAddSandwichFilling={handleAddSandwichFilling}
            onPopSandwichFilling={handlePopSandwichFilling}
            onToggleSandwichTopBread={handleToggleSandwichTopBread}
            cake={currentCake}
            cakeTab={cakeTab}
            selectedCakeRosette={selectedCakeRosette}
            selectedCakeTopping={selectedCakeTopping}
            selectedCakeCandle={selectedCakeCandle}
            onSelectCakeTab={handleSelectCakeTab}
            onSelectCakeBase={handleSelectCakeBase}
            onSelectCakeRosette={handleSelectCakeRosette}
            onSelectCakeTopping={handleSelectCakeTopping}
            onSelectCakeCandle={handleSelectCakeCandle}
          />
        )}
      </main>
      )}

      <OfflineIndicator />
    </div>
    </DragProvider>
  );
}
