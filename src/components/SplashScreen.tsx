import React, { useState } from 'react';
import { getActiveHelper } from '../utils/activeHelper';
import { playVoice } from '../utils/voice';

/** Заставка при запуске: Зуба и Слоня встречают гостя. Нажатие нужно для звука. */
export const SplashScreen: React.FC<{ voiceEnabled: boolean; onDone: () => void }> = ({ voiceEnabled, onDone }) => {
  const [started, setStarted] = useState(false);
  const start = () => {
    if (started) return;
    setStarted(true);
    playVoice('splash', voiceEnabled);
    window.setTimeout(onDone, voiceEnabled ? 4200 : 900);
  };
  const first = getActiveHelper();
  const second = first === 'zuba' ? 'slonya' : 'zuba';
  return (
    <button
      type="button"
      onClick={start}
      aria-label="Играть"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-cover bg-center cursor-pointer"
      style={{ backgroundImage: "url('/assets/princess/bg/map.webp')" }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex items-end justify-center gap-4 sm:gap-10">
        {[second, first].map((h, i) => (
          <img
            key={h}
            src={`/assets/princess/helpers/${h}.webp`}
            alt=""
            draggable={false}
            className={`h-[38vh] max-h-[340px] object-contain drop-shadow-2xl ${started ? 'r-hop' : 'animate-bounce'}`}
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>
      <div
        className={`relative toy-pill px-8 py-4 text-5xl ${started ? 'opacity-0' : 'animate-pulse'} transition-opacity`}
        aria-hidden="true"
      >
        ▶️
      </div>
    </button>
  );
};
