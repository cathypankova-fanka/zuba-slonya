import React, { useState } from 'react';
import { CharacterItem } from '../data/characters';
import { AllGameMode } from '../data/kitchenData';
import { ModeTabSvg } from './KitchenIllustrations';

/**
 * «Дом героя» — главный экран-игра вместо меню-«сайта».
 * Дом нарисован картинкой, комнаты — нажимаемые зоны, предметы в комнатах — кнопки игр.
 * Никакого текста на экране: названия только в aria-label.
 */

type RoomId = 'studio' | 'playroom' | 'kitchen' | 'bathroom';

interface Hotspot {
  /** Куда ведёт: комната или сразу игра (зеркало → аквагрим) */
  target: { room: RoomId } | { mode: AllGameMode } | null;
  aria: string;
  /** % от картинки дома */
  x: number;
  y: number;
  w: number;
  h: number;
}

// Координаты комнат на картинке /assets/design/bg/hub.webp (3:2)
const HOTSPOTS: Hotspot[] = [
  { target: { room: 'studio' }, aria: 'Студия', x: 14.5, y: 31, w: 27, h: 25 },
  { target: { room: 'playroom' }, aria: 'Игровая', x: 42.5, y: 31, w: 21.5, h: 25 },
  { target: null, aria: 'Спальня', x: 65, y: 31, w: 20.5, h: 25 },
  { target: { room: 'kitchen' }, aria: 'Кухня', x: 14.5, y: 57, w: 27, h: 24 },
  { target: { room: 'bathroom' }, aria: 'Ванная', x: 42.5, y: 57, w: 21.5, h: 24 },
  { target: { mode: 'face' }, aria: 'Зеркало: аквагрим', x: 65, y: 57, w: 20.5, h: 24 },
];

interface RoomObject {
  mode: AllGameMode;
  aria: string;
  /** картинка предмета; если нет — иконка режима в «игрушечной» кнопке */
  src?: string;
  /** центр предмета, % комнаты */
  x: number;
  /** низ предмета, % комнаты */
  y: number;
  /** ширина, % комнаты */
  w: number;
}

const D = '/assets/design';

const ROOMS: Record<RoomId, { bg: string; objects: RoomObject[] }> = {
  kitchen: {
    bg: `${D}/bg/kitchen.webp`,
    objects: [
      { mode: 'pizza', aria: 'Пицца', src: `${D}/objects/oven.webp`, x: 13, y: 62, w: 17 },
      { mode: 'icecream', aria: 'Мороженое', src: `${D}/objects/fridge.webp`, x: 30, y: 62, w: 12 },
      { mode: 'soup', aria: 'Суп', src: `${D}/objects/pot.webp`, x: 46, y: 62, w: 15 },
      { mode: 'sandwich', aria: 'Бутерброд', src: `${D}/objects/toaster.webp`, x: 62, y: 62, w: 15 },
      { mode: 'drinks', aria: 'Напитки', src: '/assets/pour/teapot.webp', x: 77, y: 62, w: 15 },
      { mode: 'cake', aria: 'Торт', src: '/assets/cake/cakes/pink.webp', x: 91, y: 62, w: 14 },
    ],
  },
  studio: {
    bg: `${D}/bg/studio.webp`,
    objects: [
      { mode: 'coloring', aria: 'Раскраска', src: `${D}/objects/easel.webp`, x: 30, y: 82, w: 25 },
      { mode: 'tshirt', aria: 'Футболка', src: `${D}/objects/clothes_rack.webp`, x: 70, y: 82, w: 22 },
    ],
  },
  playroom: {
    bg: `${D}/bg/playroom.webp`,
    objects: [
      { mode: 'memory', aria: 'Найди пару', x: 18, y: 62, w: 14 },
      { mode: 'shadow', aria: 'Найди тень', x: 34, y: 62, w: 14 },
      { mode: 'bubbles', aria: 'Пузыри', x: 50, y: 62, w: 14 },
      { mode: 'puzzle', aria: 'Пазл', x: 66, y: 62, w: 14 },
      { mode: 'weather', aria: 'По погоде', x: 82, y: 62, w: 14 },
      { mode: 'feed', aria: 'Покорми', x: 18, y: 92, w: 14 },
      { mode: 'simon', aria: 'Повтори за героями', x: 34, y: 92, w: 14 },
      { mode: 'bigsmall', aria: 'Большой и маленький', x: 50, y: 92, w: 14 },
      { mode: 'emotions', aria: 'Эмоции', x: 66, y: 92, w: 14 },
    ],
  },
  bathroom: {
    bg: `${D}/bg/bathroom.webp`,
    objects: [{ mode: 'wash', aria: 'Мытьё', src: `${D}/objects/bathtub.webp`, x: 50, y: 82, w: 34 }],
  },
};

const TOY_BG: Partial<Record<AllGameMode, string>> = {
  memory: 'from-fuchsia-300 to-purple-400',
  shadow: 'from-sky-300 to-indigo-400',
  bubbles: 'from-cyan-200 to-sky-400',
  puzzle: 'from-violet-300 to-purple-500',
  weather: 'from-yellow-200 to-amber-400',
  feed: 'from-rose-300 to-pink-400',
  simon: 'from-emerald-300 to-teal-500',
  bigsmall: 'from-orange-300 to-red-400',
  emotions: 'from-yellow-300 to-orange-400',
};

const TOY_EMOJI: Partial<Record<AllGameMode, string>> = {
  simon: '🎵',
  bigsmall: '🐘',
  emotions: '😊',
};

interface HouseHubProps {
  characters: CharacterItem[];
  selectedCharacterId: string;
  onSelectCharacter: (character: CharacterItem) => void;
  onStartMode: (mode: AllGameMode) => void;
  onTap?: () => void;
}

const IconButton: React.FC<{
  src: string;
  aria: string;
  onClick: () => void;
  className?: string;
}> = ({ src, aria, onClick, className = '' }) => (
  <button
    type="button"
    aria-label={aria}
    onClick={onClick}
    className={`cursor-pointer outline-none active:scale-90 transition-transform duration-100 drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)] ${className}`}
  >
    <img src={src} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
  </button>
);

export const HouseHub: React.FC<HouseHubProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onStartMode,
  onTap,
}) => {
  const [room, setRoom] = useState<RoomId | null>(null);
  const [picking, setPicking] = useState(false);
  const active = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];
  const tap = () => onTap?.();

  const scene = room ? ROOMS[room] : null;

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-[#F6E2CC]">
      {/* Сцена: дом или комната, вписана в экран с сохранением пропорций 3:2 */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ containerType: 'size' }}>
        <div
          key={room ?? 'house'}
          className="relative animate-[pop-in_0.35s_ease-out]"
          style={{ width: 'min(100cqw, 150cqh)', aspectRatio: '3 / 2' }}
        >
          <img
            src={scene ? scene.bg : `${D}/bg/hub.webp`}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />

          {!scene &&
            HOTSPOTS.map((h) => (
              <button
                key={h.aria}
                type="button"
                aria-label={h.aria}
                disabled={!h.target}
                onClick={() => {
                  if (!h.target) return;
                  tap();
                  if ('room' in h.target) setRoom(h.target.room);
                  else onStartMode(h.target.mode);
                }}
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
                className={`absolute rounded-[10%] outline-none ${
                  h.target
                    ? 'cursor-pointer animate-[room-glow_2.6s_ease-in-out_infinite] hover:bg-white/20 active:bg-white/30 active:scale-[0.97] transition-transform'
                    : 'cursor-default'
                }`}
              />
            ))}

          {scene &&
            scene.objects.map((o, i) => (
              <button
                key={o.mode}
                type="button"
                aria-label={o.aria}
                onClick={() => {
                  tap();
                  onStartMode(o.mode);
                }}
                style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, animationDelay: `${i * 0.3}s` }}
                className="absolute -translate-x-1/2 -translate-y-full cursor-pointer outline-none animate-[gentle-float_3.2s_ease-in-out_infinite] active:scale-90 transition-transform"
              >
                {o.src ? (
                  <img
                    src={o.src}
                    alt=""
                    draggable={false}
                    className="w-full h-auto drop-shadow-[0_10px_8px_rgba(60,30,0,0.35)] pointer-events-none"
                  />
                ) : (
                  <span
                    className={`block aspect-square w-full rounded-[28%] bg-gradient-to-b ${
                      TOY_BG[o.mode] ?? 'from-orange-200 to-orange-400'
                    } border-[3px] border-white/80 shadow-[0_8px_0_rgba(0,0,0,0.18),inset_0_6px_8px_rgba(255,255,255,0.55)] flex items-center justify-center`}
                  >
                    {TOY_EMOJI[o.mode] ? (
                      <span className="text-[2.6rem] leading-none pointer-events-none">{TOY_EMOJI[o.mode]}</span>
                    ) : (
                      <ModeTabSvg mode={o.mode} className="w-[72%] h-[72%] pointer-events-none" />
                    )}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Назад в дом (иконка домика) — только внутри комнаты */}
      {scene && (
        <IconButton
          src={`${D}/ui/btn_home.webp`}
          aria="В дом"
          onClick={() => {
            tap();
            setRoom(null);
          }}
          className="absolute left-3 top-3 w-16 h-16 sm:w-20 sm:h-20 z-20"
        />
      )}

      {/* Герой: тап — выбрать другого */}
      <button
        type="button"
        aria-label="Выбрать героя"
        onClick={() => {
          tap();
          setPicking(true);
        }}
        className="absolute left-3 bottom-3 z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full cursor-pointer outline-none active:scale-90 transition-transform shadow-[0_6px_0_rgba(0,0,0,0.2)] border-[5px] border-white overflow-hidden animate-[gentle-float_3s_ease-in-out_infinite]"
        style={{ backgroundColor: active.accentBg }}
      >
        <img src={active.imageSrc} alt="" className="w-full h-full object-cover object-top pointer-events-none" />
      </button>

      {/* Выбор героя: портреты-«окошки», без заголовков */}
      {picking && (
        <div className="absolute inset-0 z-30 bg-[#2E1A47]/70 backdrop-blur-sm flex items-center justify-center p-3 animate-[pop-in_0.25s_ease-out]">
          <div className="w-full max-w-[860px] max-h-full overflow-y-auto no-scrollbar bg-[#FFF3E0] rounded-[2rem] p-3 sm:p-5 shadow-2xl border-4 border-white">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
              {characters.map((c, i) => {
                const sel = c.id === selectedCharacterId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.name}
                    onClick={() => {
                      onSelectCharacter(c);
                      setPicking(false);
                    }}
                    style={{ backgroundColor: c.accentBg, animationDelay: `${i * 25}ms` }}
                    className={`aspect-square rounded-3xl overflow-hidden cursor-pointer outline-none transition-transform active:scale-90 animate-[pop-in_0.3s_ease-out_both] ${
                      sel ? 'ring-[6px] ring-[#FF6B4A] scale-105 shadow-xl' : 'shadow-[0_5px_0_rgba(0,0,0,0.12)]'
                    }`}
                  >
                    <img src={c.imageSrc} alt="" className="w-full h-full object-cover object-top pointer-events-none" />
                  </button>
                );
              })}
            </div>
          </div>
          <IconButton
            src={`${D}/ui/btn_check.webp`}
            aria="Готово"
            onClick={() => setPicking(false)}
            className="absolute right-4 bottom-4 w-20 h-20"
          />
        </div>
      )}
    </div>
  );
};
