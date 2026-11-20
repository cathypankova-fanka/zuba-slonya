import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Heart, RotateCw, Star } from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import {
  getCharacterEatAnimationUrl,
  MAX_GAME_LEVELS,
  MiniGameAssetItem,
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
  GlossyStar,
  RoundReplayOverlay,
  useIdleHint,
} from './MiniGameShell';

interface MemoryGameProps {
  selectedCharacterId: string;
  soundEnabled: boolean;
}

type CardBackDesign = 'stars' | 'clouds' | 'hearts';

interface MemoryCard {
  uid: string;
  item: MiniGameAssetItem;
  faceUp: boolean;
  matched: boolean;
}

function getMemoryLevelConfig(level: number): {
  pairs: number;
  cols: number;
  rows: number;
  peekMs: number;
  sets: Array<keyof typeof STICKER_SETS>;
  distinctColors: boolean;
} {
  if (level <= 1) {
    return { pairs: 2, cols: 2, rows: 2, peekMs: 3000, sets: ['food'], distinctColors: true };
  }
  if (level === 2) {
    return {
      pairs: 3,
      cols: 3,
      rows: 2,
      peekMs: 2000,
      sets: ['food', 'animals'],
      distinctColors: true,
    };
  }
  if (level === 3) {
    return { pairs: 4, cols: 4, rows: 2, peekMs: 0, sets: ['animals'], distinctColors: true };
  }
  if (level === 4) {
    return {
      pairs: 6,
      cols: 4,
      rows: 3,
      peekMs: 0,
      sets: ['transport', 'objects'],
      distinctColors: false,
    };
  }
  return {
    pairs: 8,
    cols: 4,
    rows: 4,
    peekMs: 0,
    sets: ['food', 'animals', 'transport', 'objects'],
    distinctColors: false,
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

function buildDeck(level: number): { cards: MemoryCard[]; cols: number; rows: number; peekMs: number } {
  const cfg = getMemoryLevelConfig(level);
  const rawPool = cfg.sets.flatMap((key) => STICKER_SETS[key]);
  const shuffledPool = shuffleArr(rawPool);

  const chosen: MiniGameAssetItem[] = [];
  const usedColorGroups = new Set<string>();

  for (const candidate of shuffledPool) {
    if (chosen.length >= cfg.pairs) break;
    if (cfg.distinctColors && candidate.colorGroup && usedColorGroups.has(candidate.colorGroup)) {
      continue;
    }
    chosen.push(candidate);
    if (candidate.colorGroup) {
      usedColorGroups.add(candidate.colorGroup);
    }
  }
  // Fallback fill if strict color filter didn't yield enough
  for (const candidate of shuffledPool) {
    if (chosen.length >= cfg.pairs) break;
    if (!chosen.some((c) => c.id === candidate.id)) {
      chosen.push(candidate);
    }
  }

  let deck: MemoryCard[] = [];
  chosen.forEach((item) => {
    deck.push({ uid: `${item.id}_a_${Math.random()}`, item, faceUp: cfg.peekMs > 0, matched: false });
    deck.push({ uid: `${item.id}_b_${Math.random()}`, item, faceUp: cfg.peekMs > 0, matched: false });
  });
  deck = shuffleArr(deck);

  // De-adjacent identical pairs horizontally/vertically when grid allows
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < deck.length; i++) {
      const rightIdx = (i + 1) % cfg.cols !== 0 ? i + 1 : -1;
      const downIdx = i + cfg.cols < deck.length ? i + cfg.cols : -1;
      const conflictIdx =
        rightIdx !== -1 && deck[i].item.id === deck[rightIdx].item.id
          ? rightIdx
          : downIdx !== -1 && deck[i].item.id === deck[downIdx].item.id
          ? downIdx
          : -1;
      if (conflictIdx !== -1) {
        const swapWith = (conflictIdx + 2) % deck.length;
        if (deck[swapWith].item.id !== deck[i].item.id) {
          [deck[conflictIdx], deck[swapWith]] = [deck[swapWith], deck[conflictIdx]];
        }
      }
    }
  }

  return { cards: deck, cols: cfg.cols, rows: cfg.rows, peekMs: cfg.peekMs };
}

export const MemoryGame: React.FC<MemoryGameProps> = ({
  selectedCharacterId,
  soundEnabled,
}) => {
  // Только самый сложный уровень — выбор сложности убран
  const level = MAX_GAME_LEVELS.memory;
  const setLevel = (_lvl: number) => {};
  const [backDesign, setBackDesign] = useState<CardBackDesign>('stars');

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);

  const [firstUid, setFirstUid] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [hadMistakeInRound, setHadMistakeInRound] = useState(false);
  const [hintUid, setHintUid] = useState<string | null>(null);
  const [dancingHero, setDancingHero] = useState(false);
  const [roundDone, setRoundDone] = useState(false);

  const [cardPx, setCardPx] = useState(110);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const peekTimerRef = useRef<number | null>(null);
  const unflipTimerRef = useRef<number | null>(null);

  const activeHero = useMemo(
    () => CHARACTERS.find((c) => c.id === selectedCharacterId) ?? CHARACTERS[0],
    [selectedCharacterId]
  );

  const { showHint, resetIdle } = useIdleHint(6000, !roundDone && !peeking && !locked);

  const startRound = useCallback(
    (lvl: number) => {
      if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
      if (unflipTimerRef.current) window.clearTimeout(unflipTimerRef.current);

      const { cards: newDeck, cols, rows, peekMs } = buildDeck(lvl);
      setCards(newDeck);
      setGridCols(cols);
      setGridRows(rows);
      setFirstUid(null);
      setConsecutiveMisses(0);
      setHadMistakeInRound(false);
      setHintUid(null);
      setDancingHero(false);
      setRoundDone(false);
      resetIdle();

      if (peekMs > 0) {
        setPeeking(true);
        setLocked(true);
        peekTimerRef.current = window.setTimeout(() => {
          setCards((prev) => prev.map((c) => ({ ...c, faceUp: false })));
          setPeeking(false);
          setLocked(false);
        }, peekMs);
      } else {
        setPeeking(false);
        setLocked(false);
      }
    },
    [resetIdle]
  );

  useEffect(() => {
    startRound(level);
    return () => {
      if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
      if (unflipTimerRef.current) window.clearTimeout(unflipTimerRef.current);
    };
    // Initial start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically compute large cards (>= 88px whenever viewport allows) without scrolling
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const recalc = () => {
      const r = el.getBoundingClientRect();
      const gap = 14;
      const effectiveCols = r.width < 430 && gridCols === 4 && gridRows === 2 ? 3 : gridCols;
      const effectiveRows = Math.ceil(cards.length / Math.max(1, effectiveCols)) || gridRows;
      const maxW = (r.width - 16 - gap * (effectiveCols - 1)) / Math.max(1, effectiveCols);
      const maxH = (r.height - 16 - gap * (effectiveRows - 1)) / Math.max(1, effectiveRows);
      const best = Math.floor(Math.min(maxW, maxH, 165));
      setCardPx(Math.max(76, best));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cards.length, gridCols, gridRows]);

  const matchedPairs = useMemo(
    () => cards.filter((c) => c.matched).length / 2,
    [cards]
  );
  const totalPairs = Math.max(1, cards.length / 2);

  const handleTapCard = (tapped: MemoryCard) => {
    if (locked || peeking || tapped.faceUp || tapped.matched || roundDone) return;
    resetIdle();
    soundEngine.playGameFlip(soundEnabled);

    const flippedCards = cards.map((c) => (c.uid === tapped.uid ? { ...c, faceUp: true } : c));
    setCards(flippedCards);

    if (!firstUid) {
      setFirstUid(tapped.uid);
      if (consecutiveMisses >= 2) {
        const pairCard = flippedCards.find(
          (c) => c.uid !== tapped.uid && c.item.id === tapped.item.id && !c.matched
        );
        setHintUid(pairCard?.uid ?? null);
      }
      return;
    }

    const firstCard = flippedCards.find((c) => c.uid === firstUid);
    if (!firstCard) {
      setFirstUid(null);
      return;
    }

    setLocked(true);
    setHintUid(null);

    if (firstCard.item.id === tapped.item.id) {
      // Match!
      const step = matchedPairs;
      const afterMatch = flippedCards.map((c) =>
        c.uid === firstCard.uid || c.uid === tapped.uid ? { ...c, matched: true } : c
      );
      setCards(afterMatch);
      setFirstUid(null);
      setConsecutiveMisses(0);
      soundEngine.playGameOk(soundEnabled, step);

      window.setTimeout(() => {
        setLocked(false);
        if (afterMatch.every((c) => c.matched)) {
          setDancingHero(true);
          const nextLevel = recordRoundComplete('memory', !hadMistakeInRound);
          setLevel(nextLevel);
          window.setTimeout(() => {
            setRoundDone(true);
          }, 950);
        }
      }, 360);
    } else {
      // Mismatch: gentle hold 1.2s then flip back
      const nextMisses = consecutiveMisses + 1;
      setConsecutiveMisses(nextMisses);
      setHadMistakeInRound(true);
      const nextLvl = recordGameMistake('memory');
      setLevel(nextLvl);

      window.setTimeout(() => {
        soundEngine.playGameFail(soundEnabled);
      }, 250);

      unflipTimerRef.current = window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.uid === firstCard.uid || c.uid === tapped.uid ? { ...c, faceUp: false } : c
          )
        );
        setFirstUid(null);
        setLocked(false);
      }, 1200);
    }
  };

  const handleManualLevel = (lvl: number) => {
    resetIdle();
    const updated = setManualGameLevel('memory', lvl);
    setLevel(updated);
    soundEngine.playGamePop(soundEnabled, lvl);
    startRound(updated);
  };

  const idleHintUid = useMemo(() => {
    if (!showHint || roundDone || peeking || locked) return null;
    if (firstUid) {
      const firstCard = cards.find((c) => c.uid === firstUid);
      return (
        cards.find(
          (c) => c.uid !== firstUid && c.item.id === firstCard?.item.id && !c.matched
        )?.uid ?? null
      );
    }
    return cards.find((c) => !c.faceUp && !c.matched)?.uid ?? null;
  }, [cards, firstUid, locked, peeking, roundDone, showHint]);

  const backTheme = useMemo(() => {
    if (backDesign === 'stars') {
      return {
        gradient: 'linear-gradient(135deg, #A855F7 0%, #EC4899 52%, #F59E0B 100%)',
        border: '#DDD6FE',
        Icon: Star,
      };
    }
    if (backDesign === 'clouds') {
      return {
        gradient: 'linear-gradient(135deg, #38BDF8 0%, #60A5FA 55%, #818CF8 100%)',
        border: '#BAE6FD',
        Icon: Cloud,
      };
    }
    return {
      gradient: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 55%, #F97316 100%)',
      border: '#FECDD3',
      Icon: Heart,
    };
  }, [backDesign]);

  const BackIcon = backTheme.Icon;

  return (
    <div
      onPointerDown={resetIdle}
      className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 bg-gradient-to-b from-[#FAF5FF] via-[#FFFDF7] to-[#FCE7F3] rounded-3xl border-2 border-[#E9D5FF] shadow-sm overflow-hidden select-none touch-none"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-end gap-2 z-20 shrink-0">
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

      {/* Card Grid */}
      <div
        ref={boardWrapRef}
        className="flex-1 w-full flex items-center justify-center min-h-0 p-1"
      >
        <div
          className="grid gap-3 sm:gap-4 justify-center items-center"
          style={{
            gridTemplateColumns: `repeat(${
              typeof window !== 'undefined' && window.innerWidth < 430 && gridCols === 4 && gridRows === 2
                ? 3
                : gridCols
            }, ${cardPx}px)`,
          }}
        >
          {cards.map((card) => {
            const isFlipped = card.faceUp || card.matched;
            const isHintPulse = hintUid === card.uid && !card.faceUp;
            const showHand = idleHintUid === card.uid;

            return (
              <div
                key={card.uid}
                style={{ width: cardPx, height: cardPx }}
                className="relative perspective-900"
              >
                <button
                  type="button"
                  onClick={() => handleTapCard(card)}
                  aria-label={isFlipped ? card.item.label : 'Закрытая карточка'}
                  className={`relative w-full h-full preserve-3d transition-transform duration-350 cursor-pointer touch-none outline-none ${
                    isFlipped ? 'rotate-y-180' : 'hover:scale-[1.03] active:scale-95'
                  }`}
                >
                  {/* Card Back */}
                  <div
                    style={{
                      backgroundImage: backTheme.gradient,
                      borderColor: isHintPulse ? '#FACC15' : '#FFFFFF',
                    }}
                    className={`absolute inset-0 backface-hidden rounded-[24px] border-4 shadow-[0_6px_0_rgba(148,163,184,0.35),0_10px_20px_rgba(0,0,0,0.08)] flex items-center justify-center ${
                      isHintPulse ? 'ring-4 ring-[#FDE047] animate-pulse' : ''
                    }`}
                  >
                    <div className="w-[68%] h-[68%] rounded-2xl border-2 border-dashed border-white/55 flex items-center justify-center bg-white/15">
                      <BackIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white/85 drop-shadow-xs" />
                    </div>
                  </div>

                  {/* Card Front */}
                  <div
                    className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] border-4 p-2.5 sm:p-3 flex items-center justify-center transition-all ${
                      card.matched
                        ? 'bg-[#FFFBEB] border-[#FACC15] shadow-[0_0_20px_rgba(250,204,21,0.45)] scale-[0.98]'
                        : 'bg-white border-[#BAE6FD] shadow-[0_6px_0_#CBD5E1]'
                    }`}
                  >
                    <img
                      src={card.item.src}
                      alt={card.item.label}
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]"
                    />
                  </div>
                </button>

                {showHand && <IdleHandPointer className="absolute -top-5 -right-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dancing Hero Celebration before Replay Overlay */}
      {dancingHero && !roundDone && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none"
        >
          <div
            className="w-44 h-44 sm:w-56 sm:h-56 rounded-[36px] border-4 border-[#FACC15] shadow-2xl overflow-hidden animate-pop-in"
            style={{ backgroundColor: activeHero.accentBg }}
          >
            <img
              src={getCharacterEatAnimationUrl(activeHero.id)}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          </div>
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
