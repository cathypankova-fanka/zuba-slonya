import React, { useState } from 'react';
import { HelperId, setActiveHelper } from '../utils/activeHelper';
import { playVoice } from '../utils/voice';

const NAMES: Record<HelperId, string> = { zuba: 'Зуба', slonya: 'Слоня' };

/** Заставка: Зуба и Слоня встречают гостя. Нажми на того, кто будет помощником (нажатие нужно и для звука). */
export const SplashScreen: React.FC<{ voiceEnabled: boolean; onDone: () => void }> = ({ voiceEnabled, onDone }) => {
  const [chosen, setChosen] = useState<HelperId | null>(null);
  const choose = (h: HelperId) => {
    if (chosen) return;
    setActiveHelper(h);
    setChosen(h);
    playVoice('splash', voiceEnabled);
    window.setTimeout(onDone, voiceEnabled ? 4200 : 900);
  };
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/princess/bg/map_splash.webp')" }}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex items-end justify-center gap-6 sm:gap-14">
        {(['zuba', 'slonya'] as HelperId[]).map((h, i) => (
          <button key={h} type="button" aria-label={NAMES[h]} onClick={() => choose(h)}
            className={`relative flex flex-col items-center cursor-pointer outline-none transition-all duration-500 ${chosen === h ? 'scale-125' : chosen ? 'opacity-0 scale-75' : 'active:scale-95'}`}>
            <img src={`/assets/princess/helpers/${h}.webp`} alt="" draggable={false}
              className={`h-[38vh] max-h-[340px] object-contain drop-shadow-2xl pointer-events-none ${chosen === h ? 'r-hop' : chosen ? '' : 'animate-bounce'}`}
              style={{ animationDelay: `${i * 0.25}s` }} />
            {!chosen && <span className="toy-pill mt-3 px-6 py-2 text-3xl font-display font-bold text-[#7C2D12] animate-pulse" aria-hidden="true">👆</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
