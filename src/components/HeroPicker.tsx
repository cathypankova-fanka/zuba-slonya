import React from 'react';
import { CharacterItem } from '../data/characters';

/** Крупные карточки героев: выбор гостя (на заставке и на карте). */
export const HeroPicker: React.FC<{
  characters: CharacterItem[];
  selectedId?: string;
  onPick: (c: CharacterItem) => void;
  pickedId?: string | null;
}> = ({ characters, selectedId, onPick, pickedId }) => (
  <div className="w-full max-w-[900px] max-h-full overflow-y-auto no-scrollbar bg-[#FFF3E0] rounded-[2rem] p-3 sm:p-5 shadow-2xl border-4 border-white">
    <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
      {characters.map((c, i) => {
        const sel = c.id === (pickedId ?? selectedId);
        return (
          <button key={c.id} type="button" aria-label={`герой ${c.name}`} onClick={() => onPick(c)}
            style={{ backgroundColor: c.accentBg, animationDelay: `${i * 0.03}s` }}
            className={`aspect-square rounded-3xl overflow-hidden cursor-pointer outline-none transition-all duration-300 active:scale-90 animate-pop-in ${
              sel ? 'ring-[6px] ring-[#FF6B4A] scale-105 shadow-xl' : 'shadow-[0_5px_0_rgba(0,0,0,0.12)]'
            } ${pickedId && !sel ? 'opacity-30 scale-90' : ''}`}>
            <img src={c.imageSrc} alt="" className="w-full h-full object-cover object-top pointer-events-none" draggable={false} />
          </button>
        );
      })}
    </div>
  </div>
);
