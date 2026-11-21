import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dices, RotateCw, Sparkles } from 'lucide-react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import {
  getCharacterEatAnimationUrl,
  MAX_GAME_LEVELS,
  loadMiniGamesProgress,
  recordGameMistake,
  recordRoundComplete,
  setManualGameLevel,
} from '../data/miniGamesData';
import puzzleFrames from '../data/puzzleFrames.json';
import { soundEngine } from '../utils/soundEngine';
import {
  IdleHandPointer,
  LevelStarsBar,
  RoundReplayOverlay,
  useIdleHint,
} from './MiniGameShell';

interface PuzzleGameProps {
  initialCharacter: CharacterItem;
  soundEnabled: boolean;
}

interface JigsawPiece {
  id: string;
  row: number;
  col: number;
  dataUrl: string;
  // Fraction of board width/height covering the piece canvas (including tab margins)
  padPx: number;
  cellW: number;
  cellH: number;
  canvasW: number;
  canvasH: number;
  placed: boolean;
}

interface GridConfig {
  cols: number;
  rows: number;
}

function getPuzzleGrid(level: number): GridConfig {
  if (level <= 1) return { cols: 2, rows: 1 };
  if (level === 2) return { cols: 2, rows: 2 };
  return { cols: 3, rows: 2 };
}

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function traceJigsawPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  topEdge: number,
  rightEdge: number,
  bottomEdge: number,
  leftEdge: number,
  tabR: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);

  // Top edge
  if (topEdge === 0) {
    ctx.lineTo(x + w, y);
  } else {
    const mid = x + w / 2;
    const dir = -topEdge;
    ctx.lineTo(mid - tabR * 0.9, y);
    ctx.bezierCurveTo(
      mid - tabR * 0.5,
      y + dir * tabR * 1.35,
      mid + tabR * 0.5,
      y + dir * tabR * 1.35,
      mid + tabR * 0.9,
      y
    );
    ctx.lineTo(x + w, y);
  }

  // Right edge
  if (rightEdge === 0) {
    ctx.lineTo(x + w, y + h);
  } else {
    const mid = y + h / 2;
    const dir = rightEdge;
    ctx.lineTo(x + w, mid - tabR * 0.9);
    ctx.bezierCurveTo(
      x + w + dir * tabR * 1.35,
      mid - tabR * 0.5,
      x + w + dir * tabR * 1.35,
      mid + tabR * 0.5,
      x + w,
      mid + tabR * 0.9
    );
    ctx.lineTo(x + w, y + h);
  }

  // Bottom edge
  if (bottomEdge === 0) {
    ctx.lineTo(x, y + h);
  } else {
    const mid = x + w / 2;
    const dir = bottomEdge;
    ctx.lineTo(mid + tabR * 0.9, y + h);
    ctx.bezierCurveTo(
      mid + tabR * 0.5,
      y + h + dir * tabR * 1.35,
      mid - tabR * 0.5,
      y + h + dir * tabR * 1.35,
      mid - tabR * 0.9,
      y + h
    );
    ctx.lineTo(x, y + h);
  }

  // Left edge
  if (leftEdge === 0) {
    ctx.lineTo(x, y);
  } else {
    const mid = y + h / 2;
    const dir = -leftEdge;
    ctx.lineTo(x, mid + tabR * 0.9);
    ctx.bezierCurveTo(
      x + dir * tabR * 1.35,
      mid + tabR * 0.5,
      x + dir * tabR * 1.35,
      mid - tabR * 0.5,
      x,
      mid - tabR * 0.9
    );
    ctx.lineTo(x, y);
  }

  ctx.closePath();
}

async function generateCharacterPuzzlePieces(
  hero: CharacterItem,
  cols: number,
  rows: number
): Promise<{
  pieces: JigsawPiece[];
  boardOutlineSvg: string;
  boardSize: number;
}> {
  const boardSize = 360;
  const cellW = boardSize / cols;
  const cellH = boardSize / rows;
  const tabR = Math.min(cellW, cellH) * 0.22;
  const padPx = Math.ceil(tabR * 1.45);

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = hero.imageSrc;
  });

  // Prepare normalized 360x360 source board canvas (object-cover object-top)
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = boardSize;
  srcCanvas.height = boardSize;
  const sCtx = srcCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = hero.accentBg;
    sCtx.fillRect(0, 0, boardSize, boardSize);
    if (img) {
      const iw = img.naturalWidth || boardSize;
      const ih = img.naturalHeight || boardSize;
      const scale = Math.max(boardSize / iw, boardSize / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (boardSize - dw) / 2;
      const dy = 0; // object-top framing
      sCtx.drawImage(img, dx, dy, dw, dh);
    }
  }

  // Edge orientations: +1 = outward tab on left/top piece, -1 = inward slot
  const hEdges: number[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: Math.max(0, cols - 1) }, (_, c) => ((r + c) % 2 === 0 ? 1 : -1))
  );
  const vEdges: number[][] = Array.from({ length: Math.max(0, rows - 1) }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ((r + c) % 2 === 0 ? -1 : 1))
  );

  const pieces: JigsawPiece[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top = r === 0 ? 0 : -vEdges[r - 1][c];
      const right = c === cols - 1 ? 0 : hEdges[r][c];
      const bottom = r === rows - 1 ? 0 : vEdges[r][c];
      const left = c === 0 ? 0 : -hEdges[r][c - 1];

      const canvasW = Math.round(cellW + padPx * 2);
      const canvasH = Math.round(cellH + padPx * 2);
      const pCanvas = document.createElement('canvas');
      pCanvas.width = canvasW;
      pCanvas.height = canvasH;
      const pCtx = pCanvas.getContext('2d');

      if (pCtx) {
        pCtx.save();
        traceJigsawPath(pCtx, padPx, padPx, cellW, cellH, top, right, bottom, left, tabR);
        pCtx.clip();
        pCtx.drawImage(srcCanvas, padPx - c * cellW, padPx - r * cellH);
        pCtx.restore();

        // Crisp subtle puzzle piece outline
        pCtx.save();
        traceJigsawPath(pCtx, padPx, padPx, cellW, cellH, top, right, bottom, left, tabR);
        pCtx.strokeStyle = 'rgba(255,255,255,0.92)';
        pCtx.lineWidth = 3.5;
        pCtx.stroke();
        pCtx.strokeStyle = 'rgba(15,23,42,0.14)';
        pCtx.lineWidth = 1.2;
        pCtx.stroke();
        pCtx.restore();
      }

      pieces.push({
        id: `${r}_${c}`,
        row: r,
        col: c,
        dataUrl: pCanvas.toDataURL('image/png'),
        padPx,
        cellW,
        cellH,
        canvasW,
        canvasH,
        placed: false,
      });
    }
  }

  // Generate SVG path overlay for slot grid lines
  let svgLines = '';
  for (let r = 0; r < rows - 1; r++) {
    const y = (r + 1) * cellH;
    svgLines += `M 0 ${y.toFixed(1)} `;
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW;
      const mid = x0 + cellW / 2;
      const dir = vEdges[r][c];
      svgLines += `L ${(mid - tabR * 0.9).toFixed(1)} ${y.toFixed(1)} C ${(mid - tabR * 0.5).toFixed(1)} ${(y + dir * tabR * 1.35).toFixed(1)}, ${(mid + tabR * 0.5).toFixed(1)} ${(y + dir * tabR * 1.35).toFixed(1)}, ${(mid + tabR * 0.9).toFixed(1)} ${y.toFixed(1)} L ${(x0 + cellW).toFixed(1)} ${y.toFixed(1)} `;
    }
  }
  for (let c = 0; c < cols - 1; c++) {
    const x = (c + 1) * cellW;
    svgLines += `M ${x.toFixed(1)} 0 `;
    for (let r = 0; r < rows; r++) {
      const y0 = r * cellH;
      const mid = y0 + cellH / 2;
      const dir = hEdges[r][c];
      svgLines += `L ${x.toFixed(1)} ${(mid - tabR * 0.9).toFixed(1)} C ${(x + dir * tabR * 1.35).toFixed(1)} ${(mid - tabR * 0.5).toFixed(1)}, ${(x + dir * tabR * 1.35).toFixed(1)} ${(mid + tabR * 0.5).toFixed(1)}, ${x.toFixed(1)} ${(mid + tabR * 0.9).toFixed(1)} L ${x.toFixed(1)} ${(y0 + cellH).toFixed(1)} `;
    }
  }

  return { pieces, boardOutlineSvg: svgLines, boardSize };
}

/** Кадры из мультфильма про супер-принцесс: файл + число деталей, подобранное под сложность картинки */
const CARTOON_PUZZLES: Array<{ src: string; cols: number; rows: number }> = (
  puzzleFrames as Array<{ file: string; cols: number; rows: number }>
).map((p) => ({ src: `/assets/princess/puzzles/${p.file}`, cols: p.cols, rows: p.rows }));

/** Кадр мультфильма (6–12 деталей) или портрет героя (6 деталей) */
const pickPuzzle = (heroSrc: string, base: GridConfig): { src: string; grid: GridConfig } => {
  if (CARTOON_PUZZLES.length > 0 && Math.random() < 0.75) {
    const p = CARTOON_PUZZLES[Math.floor(Math.random() * CARTOON_PUZZLES.length)];
    return { src: p.src, grid: { ...base, cols: p.cols, rows: p.rows } };
  }
  return { src: heroSrc, grid: base };
};

export const PuzzleGame: React.FC<PuzzleGameProps> = ({ initialCharacter, soundEnabled }) => {
  const [hero, setHero] = useState<CharacterItem>(initialCharacter);
  const [puzzleImage, setPuzzleImage] = useState<string>(initialCharacter.imageSrc);
  // Только самый сложный уровень — выбор сложности убран
  const level = MAX_GAME_LEVELS.puzzle;
  const setLevel = (_lvl: number) => {};
  const [grid, setGrid] = useState<GridConfig>(() => getPuzzleGrid(level));

  const [pieces, setPieces] = useState<JigsawPiece[]>([]);
  const [outlinePath, setOutlinePath] = useState('');
  const [boardSize] = useState(360);
  const [mistakesInRound, setMistakesInRound] = useState(0);
  const [mistakesOnCurrent, setMistakesOnCurrent] = useState(0);
  const [snappedId, setSnappedId] = useState<string | null>(null);
  const [shakingPieceId, setShakingPieceId] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [roundDone, setRoundDone] = useState(false);

  const [dragState, setDragState] = useState<{
    piece: JigsawPiece;
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const trayOrderRef = useRef<string[]>([]);

  const { showHint, resetIdle } = useIdleHint(6000, !roundDone && !celebrating);

  const loadRound = useCallback(
    async (targetHero: CharacterItem, targetLevel: number) => {
      const baseGrid = getPuzzleGrid(targetLevel);
      let picked = pickPuzzle(targetHero.imageSrc, baseGrid);
      // страховка: если кадр не загрузился — собираем портрет героя
      if (picked.src !== targetHero.imageSrc) {
        const ok = await new Promise<boolean>((resolve) => {
          const probe = new Image();
          probe.onload = () => resolve(probe.naturalWidth > 0);
          probe.onerror = () => resolve(false);
          probe.src = picked.src;
        });
        if (!ok) picked = { src: targetHero.imageSrc, grid: baseGrid };
      }
      const g = picked.grid;
      setGrid(g);
      setRoundDone(false);
      setCelebrating(false);
      setMistakesInRound(0);
      setMistakesOnCurrent(0);
      setSnappedId(null);
      setHoveredSlotId(null);
      const chosenImage = picked.src;
      setPuzzleImage(chosenImage);
      const { pieces: generated, boardOutlineSvg } = await generateCharacterPuzzlePieces(
        { ...targetHero, imageSrc: chosenImage },
        g.cols,
        g.rows
      );
      const shuffledIds = shuffleArr(generated.map((p) => p.id));
      trayOrderRef.current = shuffledIds;
      setPieces(generated);
      setOutlinePath(boardOutlineSvg);
      resetIdle();
    },
    [resetIdle]
  );

  useEffect(() => {
    void loadRound(hero, level);
    // Initial round setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findMatchingHoverSlot = useCallback(
    (piece: JigsawPiece, clientX: number, clientY: number): string | null => {
      const board = boardRef.current;
      if (!board) return null;
      const r = board.getBoundingClientRect();
      const slotCenterX = r.left + ((piece.col + 0.5) / grid.cols) * r.width;
      const slotCenterY = r.top + ((piece.row + 0.5) / grid.rows) * r.height;
      const snapRadius = Math.max(r.width / grid.cols, r.height / grid.rows) * 0.58;
      if (Math.hypot(clientX - slotCenterX, clientY - slotCenterY) <= snapRadius) {
        return piece.id;
      }
      return null;
    },
    [grid.cols, grid.rows]
  );

  const isInsideBoard = useCallback((clientX: number, clientY: number): boolean => {
    const board = boardRef.current;
    if (!board) return false;
    const r = board.getBoundingClientRect();
    return (
      clientX >= r.left - 20 &&
      clientX <= r.right + 20 &&
      clientY >= r.top - 20 &&
      clientY <= r.bottom + 20
    );
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
      setHoveredSlotId(findMatchingHoverSlot(dragState.piece, e.clientX, e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const hitSlot = findMatchingHoverSlot(dragState.piece, e.clientX, e.clientY);
      const droppedOnBoard = isInsideBoard(e.clientX, e.clientY);
      const activePiece = dragState.piece;

      setDragState(null);
      setHoveredSlotId(null);

      if (hitSlot === activePiece.id) {
        const nextPieces = pieces.map((p) =>
          p.id === activePiece.id ? { ...p, placed: true } : p
        );
        const placedCount = nextPieces.filter((p) => p.placed).length;
        setPieces(nextPieces);
        setSnappedId(activePiece.id);
        setMistakesOnCurrent(0);
        soundEngine.playGameOk(soundEnabled, placedCount - 1);

        window.setTimeout(() => {
          setSnappedId((prev) => (prev === activePiece.id ? null : prev));
        }, 450);

        if (placedCount >= nextPieces.length) {
          setCelebrating(true);
          const nextLvl = recordRoundComplete('puzzle', mistakesInRound === 0);
          setLevel(nextLvl);
          window.setTimeout(() => {
            setRoundDone(true);
          }, 1150);
        }
      } else if (droppedOnBoard) {
        setShakingPieceId(activePiece.id);
        setMistakesInRound((m) => m + 1);
        setMistakesOnCurrent((m) => m + 1);
        const nextLvl = recordGameMistake('puzzle');
        setLevel(nextLvl);
        soundEngine.playGameFail(soundEnabled);
        window.setTimeout(() => {
          setShakingPieceId((prev) => (prev === activePiece.id ? null : prev));
        }, 680);
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
  }, [
    dragState,
    findMatchingHoverSlot,
    isInsideBoard,
    mistakesInRound,
    pieces,
    soundEnabled,
  ]);

  const unplacedTrayPieces = useMemo(() => {
    const order = trayOrderRef.current;
    return pieces
      .filter((p) => !p.placed)
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [pieces]);

  const placedCount = useMemo(() => pieces.filter((p) => p.placed).length, [pieces]);
  const hintedPiece = unplacedTrayPieces[0] ?? null;
  const shouldHighlightHintSlot = (showHint || mistakesOnCurrent >= 2) && Boolean(hintedPiece);

  const handleCycleHero = () => {
    resetIdle();
    const others = CHARACTERS.filter((c) => c.id !== hero.id);
    const nextHero = others[Math.floor(Math.random() * others.length)] ?? CHARACTERS[0];
    setHero(nextHero);
    soundEngine.playGamePop(soundEnabled, 4);
    void loadRound(nextHero, level);
  };

  const handleManualLevel = (lvl: number) => {
    resetIdle();
    const updated = setManualGameLevel('puzzle', lvl);
    setLevel(updated);
    soundEngine.playGamePop(soundEnabled, lvl);
    void loadRound(hero, updated);
  };

  const handleReplayNextHero = () => {
    const others = CHARACTERS.filter((c) => c.id !== hero.id);
    const nextHero = others[Math.floor(Math.random() * others.length)] ?? hero;
    setHero(nextHero);
    void loadRound(nextHero, level);
  };

  return (
    <div
      onPointerDown={resetIdle}
      className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 bg-gradient-to-b from-[#FFFDF7] via-[#F5F3FF] to-[#EDE9FE] rounded-3xl border-2 border-[#DDD6FE] shadow-sm overflow-hidden select-none touch-none"
    >
      {/* Top Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCycleHero}
            aria-label="Другой герой"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-[#FEF3C7] border-2 border-[#F59E0B] text-[#D97706] shadow-[0_4px_0_#F59E0B] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          >
            <Dices className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 border-2 border-[#DDD6FE] rounded-full px-3.5 py-2 shadow-xs">
          {pieces.map((p, idx) => (
            <span
              key={p.id || idx}
              className={`rounded-full transition-all duration-300 ${
                p.placed ? 'w-4 h-4 bg-[#10C97A] scale-110' : 'w-3 h-3 bg-[#CBD5E1]'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            void loadRound(hero, level);
          }}
          aria-label="Собрать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Puzzle Board */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <div
          ref={boardRef}
          style={{ backgroundColor: hero.accentBg }}
          className={`relative aspect-square h-full w-auto max-h-[min(64vw,270px)] sm:max-h-[min(42vh,340px)] rounded-[32px] border-4 border-white shadow-[0_14px_32px_rgba(91,33,182,0.16)] overflow-visible transition-transform duration-300 ${
            celebrating ? 'scale-105 ring-4 ring-[#FACC15]' : ''
          }`}
        >
          {/* Rounded inner clip for ghost + board + celebration */}
          <div className="relative w-full h-full rounded-[28px] overflow-hidden">
            {/* Ghost guide portrait */}
            <img
              src={puzzleImage}
              alt=""
              draggable={false}
              className="w-full h-full object-cover object-top opacity-25 pointer-events-none select-none"
            />

            {/* Slot grid lines */}
            {outlinePath && !celebrating && (
              <svg
                viewBox={`0 0 ${boardSize} ${boardSize}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <path
                  d={outlinePath}
                  fill="none"
                  stroke="#6D28D9"
                  strokeOpacity="0.45"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Hovered or hinted target slot glow */}
            {(hoveredSlotId || shouldHighlightHintSlot) && !celebrating && (
              <div
                aria-hidden="true"
                style={{
                  left: `${(((hoveredSlotId ? pieces.find((p) => p.id === hoveredSlotId)?.col : hintedPiece?.col) ?? 0) / grid.cols) * 100}%`,
                  top: `${(((hoveredSlotId ? pieces.find((p) => p.id === hoveredSlotId)?.row : hintedPiece?.row) ?? 0) / grid.rows) * 100}%`,
                  width: `${100 / grid.cols}%`,
                  height: `${100 / grid.rows}%`,
                }}
                className={`absolute rounded-2xl pointer-events-none transition-all duration-150 ${
                  hoveredSlotId
                    ? 'bg-[#10C97A]/25 ring-4 ring-[#10C97A]'
                    : 'bg-[#FACC15]/25 ring-4 ring-[#FACC15] animate-pulse'
                }`}
              />
            )}

            {/* Snapped pieces rendered seamlessly in exact coordinates */}
            {pieces
              .filter((p) => p.placed)
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    left: `${((p.col * p.cellW - p.padPx) / boardSize) * 100}%`,
                    top: `${((p.row * p.cellH - p.padPx) / boardSize) * 100}%`,
                    width: `${(p.canvasW / boardSize) * 100}%`,
                    height: `${(p.canvasH / boardSize) * 100}%`,
                  }}
                  className={`absolute pointer-events-none ${
                    snappedId === p.id ? 'animate-pop-in z-20' : 'z-10'
                  }`}
                >
                  <img
                    src={p.dataUrl}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-fill select-none"
                  />
                  {snappedId === p.id && (
                    <Sparkles className="absolute top-1 right-1 w-7 h-7 text-[#FACC15] fill-[#FACC15]" />
                  )}
                </div>
              ))}

            {/* Animated Celebration Overlay inside completed frame */}
            {celebrating && (
              <img
                src={getCharacterEatAnimationUrl(hero.id)}
                alt={hero.name}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover object-top z-30 animate-pop-in pointer-events-none select-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tray of Unplaced Pieces */}
      <div className="w-full max-w-[780px] min-h-[104px] sm:min-h-[126px] flex flex-wrap items-center justify-center gap-2 sm:gap-5 px-2 sm:px-3 py-2.5 toy-panel z-20 shrink-0">
        {unplacedTrayPieces.length === 0 ? (
          <div className="flex items-center gap-2 text-[#10C97A] animate-pop-in" aria-hidden="true">
            <Sparkles className="w-8 h-8 fill-[#FACC15] text-[#F59E0B]" />
          </div>
        ) : (
          unplacedTrayPieces.map((piece) => {
            const isDragged = dragState?.piece.id === piece.id;
            const isShaking = shakingPieceId === piece.id;
            const isHintTarget = showHint && hintedPiece?.id === piece.id && !dragState;

            return (
              <div key={piece.id} className="relative">
                <button
                  type="button"
                  disabled={celebrating || roundDone}
                  onPointerDown={(e) => {
                    if (celebrating || roundDone) return;
                    e.preventDefault();
                    resetIdle();
                    soundEngine.playGamePop(soundEnabled, placedCount);
                    setDragState({
                      piece,
                      x: e.clientX,
                      y: e.clientY,
                      pointerId: e.pointerId,
                    });
                  }}
                  aria-label="Часть пазла"
                  className={`w-[min(18vw,17vh,86px)] h-[min(18vw,17vh,86px)] sm:w-[min(108px,17vh)] sm:h-[min(108px,17vh)] toy-chip p-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none transition-all ${
                    isDragged
                      ? 'opacity-25 scale-90 bg-[#F5F3FF]'
                      : isHintTarget
                      ? 'toy-chip-on'
                      : 'hover:scale-105'
                  } ${isShaking ? 'animate-gentle-shake' : ''}`}
                >
                  <img
                    src={piece.dataUrl}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.16)]"
                  />
                </button>
                {isHintTarget && <IdleHandPointer className="absolute -top-7 right-0" />}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Dragged Jigsaw Piece */}
      {dragState && (
        <div
          aria-hidden="true"
          style={{
            left: dragState.x,
            top: dragState.y,
            transform: 'translate(-50%, -50%) scale(1.16)',
          }}
          className="fixed z-50 w-28 h-28 sm:w-36 sm:h-36 pointer-events-none select-none"
        >
          <img
            src={dragState.piece.dataUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_14px_20px_rgba(0,0,0,0.28)]"
          />
        </div>
      )}

      {/* Round Replay Overlay */}
      <RoundReplayOverlay
        open={roundDone}
        soundEnabled={soundEnabled}
        onReplay={handleReplayNextHero}
      />
    </div>
  );
};
