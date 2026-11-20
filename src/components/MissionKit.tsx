import React from 'react';
import { CharacterItem } from '../data/characters';
import { Reaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { sayRandom } from '../utils/voice';

/** Общая панель шагов миссии: пиктограммы, выполненные зелёные, текущий мигает. */
export const StepBar: React.FC<{ icons: string[]; idx: number; onTap?: (i: number) => void }> = ({ icons, idx, onTap }) => (
  <div className="toy-pill flex items-center gap-1 px-2 py-1 z-10">
    {icons.map((ic, i) => (
      <button
        key={i}
        type="button"
        aria-label={`шаг ${i + 1}`}
        onClick={() => onTap?.(i)}
        className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full text-lg sm:text-2xl flex items-center justify-center transition-all ${
          i < idx ? 'bg-[#10C97A] text-white scale-90' : i === idx ? 'bg-[#FFB800] animate-pulse scale-110' : 'bg-white/70 opacity-60'
        }`}
      >
        {i < idx ? '✓' : ic}
      </button>
    ))}
  </div>
);

/** Карточка-подсказка цели в углу: готовое блюдо крупно сверху, под ним — только то, что нужно на ЭТОМ шаге. */
export const GoalCard: React.FC<{ images: string[]; dish?: string; dishNode?: React.ReactNode; numbered?: boolean }> = ({ images, dish, dishNode, numbered }) => (
  <div className="absolute right-2 top-16 z-10 bg-white/95 rounded-3xl p-2 shadow-xl flex flex-col items-center w-[132px] gap-2 border-2 border-[#FDE68A]">
    {dishNode ?? (dish && <img src={dish} alt="" className="w-[116px] h-[100px] object-contain drop-shadow" />)}
    {images.length > 0 && (dish || dishNode) && <div className="w-full h-[3px] rounded bg-[#FDE68A]" />}
    <div className="flex flex-wrap gap-1.5 justify-center">
      {images.map((s, i) => (
        <span key={i} className="relative">
          <img src={s} alt="" className="w-9 h-9 object-contain" />
          {numbered && <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#FF3B5C] text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>}
        </span>
      ))}
    </div>
  </div>
);

/**
 * Финал миссии: готовое блюдо нужно перетащить на аватар героя (или просто нажать на блюдо) — герой его съедает.
 */
export const FeedServe: React.FC<{
  character: CharacterItem;
  reaction: Reaction;
  runKey: number;
  dish: React.ReactNode;
  soundEnabled: boolean;
  onRestart: () => void;
}> = ({ character, reaction, runKey, dish, soundEnabled, onRestart }) => {
  const [fed, setFed] = React.useState(false);
  const [off, setOff] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  const dishRef = React.useRef<HTMLDivElement>(null);
  const start = React.useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const feed = () => {
    if (fed) return;
    setFed(true);
    setDragging(false);
    // блюдо «улетает» в рот
    const a = avatarRef.current?.getBoundingClientRect();
    const d = dishRef.current?.getBoundingClientRect();
    if (a && d) setOff((o) => ({ x: o.x + (a.left + a.width / 2 - (d.left + d.width / 2)), y: o.y + (a.top + a.height / 2 - (d.top + d.height / 2)) }));
    soundEngine.playGameChomp(soundEnabled);
    window.setTimeout(() => soundEngine.playGameReward(soundEnabled), 700);
    window.setTimeout(() => sayRandom('win', 6, soundEnabled), 900);
  };

  const down = (e: React.PointerEvent) => {
    if (fed) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    setDragging(true);
  };
  const move = (e: React.PointerEvent) => {
    if (!start.current || fed) return;
    const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y;
    if (Math.hypot(dx, dy) > 8) start.current.moved = true;
    setOff({ x: dx, y: dy });
  };
  const up = (e: React.PointerEvent) => {
    if (!start.current || fed) return;
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (!s.moved) { feed(); return; } // обычное нажатие тоже кормит
    const a = avatarRef.current?.getBoundingClientRect();
    if (a) {
      const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < a.width * 0.65) { feed(); return; }
    }
    setOff({ x: 0, y: 0 }); // не попал — блюдо возвращается
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div ref={avatarRef} className={`relative rounded-full overflow-hidden shadow-2xl border-4 ${fed ? 'border-white' : 'border-[#FFB800] animate-pulse'}`}
        style={{ width: 'min(50vw, 30vh)', height: 'min(50vw, 30vh)', background: character.accentBg }}>
        {fed ? (
          <ReactionHero character={character} reaction={reaction} runKey={`feed-${runKey}`} eatSrc={`/assets/eat-animations/${character.id}.webp?run=${runKey}`} />
        ) : (
          <img src={character.imageSrc} alt="" draggable={false} className="w-full h-full object-cover object-top" />
        )}
        {!fed && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-4xl">😮</span>}
      </div>
      {!fed && <div className="text-4xl animate-bounce">⬆️</div>}
      <div
        ref={dishRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="cursor-grab active:cursor-grabbing"
        style={{
          touchAction: 'none',
          transform: `translate(${off.x}px, ${off.y}px) scale(${fed ? 0.1 : dragging ? 1.12 : 1})`,
          opacity: fed ? 0 : 1,
          transition: dragging ? 'none' : 'transform 0.6s cubic-bezier(.3,.7,.4,1), opacity 0.6s',
          zIndex: 30,
        }}
      >
        {dish}
      </div>
      {fed && (
        <>
          <div className="text-4xl animate-bounce">⭐⭐⭐</div>
          <button type="button" aria-label="Ещё раз" onClick={onRestart} className="toy-pill px-6 py-3 text-4xl active:scale-90 transition-transform">🔄</button>
        </>
      )}
    </div>
  );
};
