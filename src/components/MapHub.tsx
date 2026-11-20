import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { AllGameMode, PLAY_MODES } from '../data/kitchenData';
import { MAP_DECOR, MAP_MARKERS, MapMarker, START_POS, WORLD } from '../data/mapLayout';

/**
 * «Карта королевства»: большой мир, по которому можно ездить пальцем.
 * Игры стоят на карте вывесками (Зуба, Слоня и принцессы заняты этой игрой).
 * Нажал на вывеску — помощник Зуба и гость-герой бегут туда смешным способом
 * и открывается игра. Предметы карты (облачка, деревья, пруд…) оживают по нажатию.
 */

// Помнит, где остановился помощник, чтобы после игры он стоял там же
let lastHelperPos = { ...START_POS };
import { HelperId, getActiveHelper } from '../utils/activeHelper';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';

let greeted = false;

// чередуем фразы при беге (без повтора подряд)
let lastGoVariant = 0;
const pickGoVariant = () => {
  let n = 1 + Math.floor(Math.random() * 3);
  if (n === lastGoVariant) n = (n % 3) + 1;
  lastGoVariant = n;
  return n;
};


const TRAVEL_STYLES = ['r-hop', 'r-wobble', 'r-dance', 'r-jelly', 'r-sway'];
const HELPER_REACTIONS = ['r-hop', 'r-spin', 'r-jelly', 'r-zoom', 'r-flip', 'r-dance'];

interface Burst {
  id: number;
  x: number;
  y: number;
  e: string;
  bx: number;
  by: number;
  br: number;
}

interface MapHubProps {
  characters: CharacterItem[];
  selectedCharacterId: string;
  onSelectCharacter: (character: CharacterItem) => void;
  onStartMode: (mode: AllGameMode) => void;
  onTap?: (pitch?: number) => void;
  voiceEnabled?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const MapHub: React.FC<MapHubProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onStartMode,
  voiceEnabled = true,
  onTap,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState({ w: 800, h: 600 });
  const scale = clamp(Math.min(view.w, view.h) / 1250, 0.4, 1);

  const camLimits = useCallback(
    (sc: number, vw: number, vh: number) => ({
      maxX: Math.max(0, WORLD.w - vw / sc),
      maxY: Math.max(0, WORLD.h - vh / sc),
    }),
    [],
  );

  const centerOn = useCallback(
    (px: number, py: number, sc = scale, vw = view.w, vh = view.h) => {
      const { maxX, maxY } = camLimits(sc, vw, vh);
      return { x: clamp(px - vw / sc / 2, 0, maxX), y: clamp(py - vh / sc / 2, 0, maxY) };
    },
    [camLimits, scale, view.h, view.w],
  );

  const [cam, setCam] = useState(() => ({ x: lastHelperPos.x - 400, y: lastHelperPos.y - 350 }));
  const [camSmooth, setCamSmooth] = useState(false);
  const [helper, setHelper] = useState({ ...lastHelperPos });
  const [facingLeft, setFacingLeft] = useState(false);
  const helperId: HelperId = getActiveHelper();
  const [walking, setWalking] = useState<{ style: string; ms: number } | null>(null);
  const [helperReaction, setHelperReaction] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [picking, setPicking] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const timers = useRef<number[]>([]);
  const burstId = useRef(0);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean; id: number } | null>(null);
  const suppressClick = useRef(false);

  const active = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];

  // Размер экрана → камера на помощнике
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const apply = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(300, r.width);
      const h = Math.max(300, r.height);
      setView({ w, h });
      const sc = clamp(Math.min(w, h) / 1250, 0.4, 1);
      const c = centerOn(lastHelperPos.x, lastHelperPos.y - 120, sc, w, h);
      setCam(c);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const addBursts = (x: number, y: number, emojis: string[]) => {
    const list: Burst[] = emojis.map((e, i) => ({
      id: ++burstId.current,
      x,
      y,
      e,
      bx: (i - (emojis.length - 1) / 2) * 90 + (Math.random() * 40 - 20),
      by: -(130 + Math.random() * 90),
      br: Math.random() * 60 - 30,
    }));
    setBursts((b) => [...b, ...list]);
    later(() => setBursts((b) => b.filter((x2) => !list.some((l) => l.id === x2.id))), 1400);
  };

  // ---- Движение камеры пальцем ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (!greeted) {
      greeted = true;
      sayRandom('hello', 4, voiceEnabled);
    }
    if (walking || picking) return;
    drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false, id: e.pointerId };
    suppressClick.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 10) {
      d.moved = true;
      suppressClick.current = true;
      setShowHint(false);
      setCamSmooth(false);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (d.moved) {
      const { maxX, maxY } = camLimits(scale, view.w, view.h);
      setCam({ x: clamp(d.cx - dx / scale, 0, maxX), y: clamp(d.cy - dy / scale, 0, maxY) });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) {
      const wasMoved = drag.current.moved;
      drag.current = null;
      if (wasMoved) window.setTimeout(() => (suppressClick.current = false), 60);
    }
  };

  // ---- Путешествие к игре ----
  const goTo = (m: MapMarker) => {
    if (suppressClick.current || walking || picking) return;
    onTap?.(3);
    playVoice(`go_${m.mode}_${(PLAY_MODES as string[]).includes(m.mode) ? 1 : pickGoVariant()}`, voiceEnabled);
    const dx = m.x - helper.x;
    const dy = m.y + 120 - helper.y;
    const dist = Math.hypot(dx, dy);
    const ms = clamp((dist / 750) * 1000, 2400, 3400);
    const style = TRAVEL_STYLES[Math.floor(Math.random() * TRAVEL_STYLES.length)];
    setFacingLeft(dx < 0);
    setWalking({ style, ms });
    setShowHint(false);
    setCamSmooth(true);
    setCam(centerOn(m.x, m.y, scale, view.w, view.h));
    setHelper({ x: m.x, y: m.y + 120 });
    lastHelperPos = { x: m.x, y: m.y + 120 };
    // по пути — смайлики за помощником
    const steps = Math.max(2, Math.round(ms / 500));
    for (let i = 1; i <= steps; i++) {
      later(() => {
        const t = i / (steps + 1);
        addBursts(helper.x + dx * t, helper.y + dy * t - 150, [['⭐', '✨', '🎵', '💫'][i % 4]]);
        onTap?.(i);
      }, (ms * i) / (steps + 1));
    }
    later(() => {
      setWalking(null);
      setCamSmooth(false);
      // фраза «Бежим играть в…» договаривается до конца, потом открывается игра
      whenVoiceIdle(() => onStartMode(m.mode));
    }, ms + 250);
  };

  const tapDecor = (d: (typeof MAP_DECOR)[number]) => {
    if (suppressClick.current) return;
    onTap?.(d.pitch);
    addBursts(d.x, d.y - 40, d.emojis);
  };

  const tapHelper = () => {
    if (suppressClick.current || walking) return;
    onTap?.(Math.floor(Math.random() * 6));
    sayRandom('tap', 20, voiceEnabled);
    const r = HELPER_REACTIONS[Math.floor(Math.random() * HELPER_REACTIONS.length)];
    setHelperReaction(r);
    addBursts(helper.x, helper.y - 230, ['😂', '✨', '🎉']);
    later(() => setHelperReaction(null), 1600);
  };

  return (
    <div
      ref={rootRef}
      className="relative flex-1 min-h-0 overflow-hidden bg-[#9CCB5A] select-none"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Мир */}
      <div
        className="absolute left-0 top-0"
        style={{
          width: WORLD.w,
          height: WORLD.h,
          transformOrigin: '0 0',
          transform: `scale(${scale}) translate(${-cam.x}px, ${-cam.y}px)`,
          transition: camSmooth ? 'transform 1.3s cubic-bezier(0.45, 0, 0.25, 1)' : 'none',
          willChange: 'transform',
        }}
      >
        <img
          src="/assets/princess/bg/map.webp"
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Оживающие предметы карты */}
        {MAP_DECOR.map((d, i) => (
          <button
            key={i}
            type="button"
            aria-label={d.aria}
            onClick={() => tapDecor(d)}
            className="absolute rounded-full cursor-pointer outline-none active:scale-95 transition-transform"
            style={{ left: d.x - d.r, top: d.y - d.r, width: d.r * 2, height: d.r * 2 }}
          />
        ))}

        {/* Вывески игр */}
        {MAP_MARKERS.map((m, i) => (
          <button
            key={m.mode}
            type="button"
            aria-label={m.aria}
            onClick={() => goTo(m)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none active:scale-90 transition-transform"
            style={{ left: m.x, top: m.y, width: 260, height: 260 }}
          >
            <span
              className="block w-full h-full animate-[gentle-float_3.4s_ease-in-out_infinite]"
              style={{ animationDelay: `${(i % 7) * 0.35}s` }}
            >
              <img
                src={`/assets/princess/markers/${m.img}.webp`}
                alt=""
                draggable={false}
                className="w-full h-full object-contain rounded-full ring-[10px] ring-white shadow-[0_18px_26px_rgba(60,40,0,0.35)] pointer-events-none"
              />
            </span>
          </button>
        ))}

        {/* Помощник и гость */}
        <div
          className="absolute"
          style={{
            left: helper.x,
            top: helper.y,
            width: 0,
            height: 0,
            transition: walking ? `left ${walking.ms}ms ease-in-out, top ${walking.ms}ms ease-in-out` : 'none',
            zIndex: 20,
          }}
        >
          <button
            type="button"
            aria-label={helperId === 'zuba' ? 'Зуба' : 'Слоня'}
            onClick={tapHelper}
            className="absolute outline-none cursor-pointer"
            style={{ left: -170, top: -320, width: 340, height: 320 }}
          >
            <div
              className={`relative w-full h-full ${walking ? walking.style : helperReaction ?? 'animate-hero-breathe'}`}
              style={{ transformOrigin: '50% 100%' }}
            >
              <img
                src={`/assets/princess/helpers/${helperId}.webp`}
                alt=""
                draggable={false}
                className={`absolute bottom-0 left-0 pointer-events-none drop-shadow-[0_10px_8px_rgba(0,0,0,0.35)] ${
                  helperId === 'zuba' ? 'w-[58%]' : 'w-[88%]'
                }`}
                style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}
              />
            </div>
          </button>

          {/* Аватарка гостя бегает вместе с помощником; нажми — выбрать другого героя */}
          <button
            type="button"
            aria-label="Выбрать героя"
            onClick={(e) => {
              e.stopPropagation();
              if (suppressClick.current || walking) return;
              onTap?.(2);
              setPicking(true);
            }}
            className={`absolute rounded-full overflow-hidden border-[7px] border-white shadow-[0_8px_8px_rgba(0,0,0,0.3)] cursor-pointer outline-none active:scale-90 transition-transform ${
              walking ? walking.style : 'animate-gentle-float'
            }`}
            style={{ left: 40, top: -140, width: 120, height: 120, backgroundColor: active.accentBg, zIndex: 2 }}
          >
            <img src={active.imageSrc} alt="" className="w-full h-full object-cover object-top pointer-events-none" draggable={false} />
          </button>
        </div>

        {/* Смайлики-салют */}
        {bursts.map((b) => (
          <span
            key={b.id}
            className="map-burst absolute text-[76px] leading-none"
            style={
              { left: b.x, top: b.y, zIndex: 30, '--bx': `${b.bx}px`, '--by': `${b.by}px`, '--br': `${b.br}deg` } as React.CSSProperties
            }
          >
            {b.e}
          </span>
        ))}
      </div>

      {/* Подсказка: можно двигать карту */}
      {showHint && !walking && (
        <div className="absolute left-1/2 bottom-[18%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
          <div className="map-hint text-6xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.35)]">👆</div>
          <div className="mt-1 flex gap-10 text-4xl text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
            <span>◀</span>
            <span>▶</span>
          </div>
        </div>
      )}

      {/* Выбор героя */}
      {picking && (
        <div
          className="absolute inset-0 z-40 bg-[#2E1A47]/70 backdrop-blur-sm flex items-center justify-center p-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-[860px] max-h-full overflow-y-auto no-scrollbar bg-[#FFF3E0] rounded-[2rem] p-3 sm:p-5 shadow-2xl border-4 border-white">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
              {characters.map((c) => {
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
                    style={{ backgroundColor: c.accentBg }}
                    className={`aspect-square rounded-3xl overflow-hidden cursor-pointer outline-none transition-transform active:scale-90 ${
                      sel ? 'ring-[6px] ring-[#FF6B4A] scale-105 shadow-xl' : 'shadow-[0_5px_0_rgba(0,0,0,0.12)]'
                    }`}
                  >
                    <img src={c.imageSrc} alt="" className="w-full h-full object-cover object-top pointer-events-none" />
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            aria-label="Готово"
            onClick={() => setPicking(false)}
            className="absolute right-4 bottom-4 w-20 h-20 cursor-pointer outline-none active:scale-90 transition-transform drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)]"
          >
            <img src="/assets/design/ui/btn_check.webp" alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
};
