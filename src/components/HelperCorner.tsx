import React, { useEffect, useRef, useState } from 'react';
import { getActiveHelper } from '../utils/activeHelper';
import { isVoiceEnabled, sayRandom } from '../utils/voice';

const IDLES = ['idle_1', 'idle_2', 'idle_3', 'idle_4'];
// реакции на события игры
const BY_EVENT: Record<string, string[]> = {
  win: ['dance', 'jumpspin', 'partypop', 'superhero', 'wave'],
  hint: ['bigeyes', 'peekaboo', 'wave'],
  retry: ['dizzy', 'raspberry'],
  idle: ['wave', 'bigeyes', 'raspberry', 'partypop', 'sleepy'],
};
const RANDOM_PLAY = ['sleepy', 'peekaboo', 'wave', 'bigeyes', 'dance'];
const ALL = [...IDLES, 'dance', 'jumpspin', 'partypop', 'superhero', 'wave', 'bigeyes', 'dizzy', 'raspberry', 'peekaboo', 'sleepy'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Маленький помощник в углу: циклы ожидания (ping-pong), случайные шалости и реакции на события игры. */
export const HelperCorner: React.FC = () => {
  const helper = getActiveHelper();
  const url = (n: string) => `/assets/helper_anim/${helper}/${n}.webp`;
  const [clip, setClip] = useState(() => pick(IDLES));
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);

  const play = (name: string, ms = 3200) => {
    busyRef.current = true; setBusy(true); setClip(name);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { busyRef.current = false; setBusy(false); setClip(pick(IDLES)); }, ms);
  };

  useEffect(() => {
    ALL.forEach((n) => { const i = new Image(); i.src = url(n); }); // прогрев кэша
    const onEvt = (e: Event) => {
      const k = (e as CustomEvent<string>).detail;
      play(pick(BY_EVENT[k] ?? BY_EVENT.idle));
    };
    window.addEventListener('helper-say', onEvt);
    // смена idle-петель и случайные шалости
    const t = window.setInterval(() => {
      if (busyRef.current) return;
      if (Math.random() < 0.4) play(pick(RANDOM_PLAY));
      else setClip(pick(IDLES));
    }, 7000);
    return () => { window.removeEventListener('helper-say', onEvt); window.clearInterval(t); window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      aria-label="Помощник"
      onClick={() => { sayRandom('tap', 20, isVoiceEnabled()); }}
      className="helper-corner fixed z-30 right-2 bottom-2 sm:right-4 sm:bottom-4 w-[88px] h-[88px] sm:w-[124px] sm:h-[124px] select-none cursor-pointer p-0 rounded-full overflow-hidden bg-white border-4 border-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] active:scale-95 transition-transform"
      style={{ touchAction: 'manipulation' }}
    >
      <img src={url(clip)} alt="" draggable={false} className={`w-full h-full object-cover scale-110 ${busy ? '' : ''}`} />
    </button>
  );
};
