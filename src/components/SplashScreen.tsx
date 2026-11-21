import React, { useState } from 'react';
import { CharacterItem } from '../data/characters';
import { HelperId, setActiveHelper } from '../utils/activeHelper';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { HeroPicker } from './HeroPicker';

const NAMES: Record<HelperId, string> = { zuba: 'Зуба', slonya: 'Слоня' };

/**
 * Заставка: 1) нажми на Зубу или Слоню — это твой помощник; 2) «Кто к нам сегодня в гости?» — выбери героя.
 */
export const SplashScreen: React.FC<{
  voiceEnabled: boolean;
  characters: CharacterItem[];
  selectedCharacterId: string;
  onSelectCharacter: (c: CharacterItem) => void;
  onDone: () => void;
}> = ({ voiceEnabled, characters, selectedCharacterId, onSelectCharacter, onDone }) => {
  const [chosen, setChosen] = useState<HelperId | null>(null);
  const [phase, setPhase] = useState<'helper' | 'guest'>('helper');
  const [guest, setGuest] = useState<string | null>(null);

  const choose = (h: HelperId) => {
    if (chosen) return;
    setActiveHelper(h);
    setChosen(h);
    playVoice('splash', voiceEnabled);
    window.setTimeout(() => whenVoiceIdle(() => {
      setPhase('guest');
      playVoice('guest_who', voiceEnabled);
    }), voiceEnabled ? 1500 : 700);
  };
  const pickGuest = (c: CharacterItem) => {
    if (guest) return;
    setGuest(c.id);
    onSelectCharacter(c);
    playVoice(`hero_${c.id}`, voiceEnabled, undefined, 'replace');
    window.setTimeout(() => whenVoiceIdle(() => window.setTimeout(onDone, 300)), 900);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/princess/bg/map_splash.webp')" }}>
      <div className="absolute inset-0 bg-black/20" />
      {phase === 'helper' ? (
        <div className="relative flex items-end justify-center gap-6 sm:gap-14">
          {(['zuba', 'slonya'] as HelperId[]).map((h, i) => (
            <button key={h} type="button" aria-label={NAMES[h]} onClick={() => choose(h)}
              className={`relative flex flex-col items-center cursor-pointer outline-none transition-all duration-500 ${chosen === h ? 'scale-125' : chosen ? 'opacity-0 scale-75' : 'active:scale-95'}`}>
              <img src={`/assets/princess/helpers/${h}.webp`} alt="" draggable={false}
                className={`h-[38vh] max-h-[340px] object-contain drop-shadow-2xl pointer-events-none ${chosen === h ? 'r-hop' : chosen ? '' : 'animate-bounce'}`}
                style={{ animationDelay: `${i * 0.25}s` }} />
              {!chosen && <span className="toy-pill mt-3 px-6 py-2 text-3xl animate-pulse" aria-hidden="true">👆</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center gap-3 px-3 py-4">
          {chosen && (
            <img src={`/assets/princess/helpers/${chosen}.webp`} alt="" draggable={false}
              className="hidden sm:block h-[34vh] max-h-[300px] object-contain drop-shadow-2xl shrink-0 animate-[bob_1.4s_ease-in-out_infinite]" />
          )}
          <div className="flex-1 min-w-0 h-full flex items-center justify-center">
            <HeroPicker characters={characters} selectedId={selectedCharacterId} pickedId={guest} onPick={pickGuest} />
          </div>
        </div>
      )}
    </div>
  );
};
