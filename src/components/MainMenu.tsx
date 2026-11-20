import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { CharacterItem } from '../data/characters';
import { AllGameMode } from '../data/kitchenData';
import { ModeTabSvg } from './KitchenIllustrations';

interface MainMenuProps {
  characters: CharacterItem[];
  selectedCharacterId: string;
  onSelectCharacter: (character: CharacterItem) => void;
  onStartMode: (mode: AllGameMode) => void;
}

const GAME_MODES: Array<{
  id: AllGameMode;
  label: string;
  cardBg: string;
  borderColor: string;
  shadowColor: string;
}> = [
  {
    id: 'face',
    label: 'Аквагрим',
    cardBg: '#FFF1F2',
    borderColor: '#FECDD3',
    shadowColor: '#FDA4AF',
  },
  {
    id: 'tshirt',
    label: 'Футболка',
    cardBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    shadowColor: '#93C5FD',
  },
  {
    id: 'wash',
    label: 'Мытьё',
    cardBg: '#ECFEFF',
    borderColor: '#A5F3FC',
    shadowColor: '#67E8F9',
  },
  {
    id: 'pizza',
    label: 'Пицца',
    cardBg: '#FEF3C7',
    borderColor: '#FDE68A',
    shadowColor: '#FCD34D',
  },
  {
    id: 'icecream',
    label: 'Мороженое',
    cardBg: '#FCE7F3',
    borderColor: '#FBCFE8',
    shadowColor: '#F9A8D4',
  },
  {
    id: 'drinks',
    label: 'Напитки',
    cardBg: '#E0F2FE',
    borderColor: '#BAE6FD',
    shadowColor: '#7DD3FC',
  },
  {
    id: 'soup',
    label: 'Суп',
    cardBg: '#FFEDD5',
    borderColor: '#FED7AA',
    shadowColor: '#FDBA74',
  },
  {
    id: 'sandwich',
    label: 'Бутерброд',
    cardBg: '#ECFCCB',
    borderColor: '#D9F99D',
    shadowColor: '#BEF264',
  },
  {
    id: 'cake',
    label: 'Торт',
    cardBg: '#F5F3FF',
    borderColor: '#DDD6FE',
    shadowColor: '#C4B5FD',
  },
  {
    id: 'feed',
    label: 'Покорми',
    cardBg: '#FFF1F2',
    borderColor: '#FECDD3',
    shadowColor: '#FDA4AF',
  },
  {
    id: 'shadow',
    label: 'Найди тень',
    cardBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    shadowColor: '#7DD3FC',
  },
  {
    id: 'bubbles',
    label: 'Пузыри',
    cardBg: '#ECFEFF',
    borderColor: '#A5F3FC',
    shadowColor: '#67E8F9',
  },
  {
    id: 'memory',
    label: 'Найди пару',
    cardBg: '#FAF5FF',
    borderColor: '#E9D5FF',
    shadowColor: '#D8B4FE',
  },
  {
    id: 'puzzle',
    label: 'Пазл',
    cardBg: '#EDE9FE',
    borderColor: '#DDD6FE',
    shadowColor: '#C4B5FD',
  },
  {
    id: 'weather',
    label: 'По погоде',
    cardBg: '#FEF9C3',
    borderColor: '#FDE047',
    shadowColor: '#FACC15',
  },
  {
    id: 'coloring',
    label: 'Раскраска',
    cardBg: '#FDF2F8',
    borderColor: '#FBCFE8',
    shadowColor: '#F472B6',
  },
];

const CharacterCard: React.FC<{
  character: CharacterItem;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ character, isSelected, onSelect }) => {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-150 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-[#FF6B4A] ${
        isSelected
          ? 'bg-white ring-4 ring-[#FF6B4A] shadow-lg scale-[1.03]'
          : 'bg-white/85 border-2 border-[#EAE2D3] hover:bg-white hover:scale-[1.02] active:scale-95'
      }`}
    >
      {isSelected && (
        <span
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FF6B4A] text-white flex items-center justify-center shadow-md z-10"
          aria-hidden="true"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
      <div
        className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: character.accentBg }}
      >
        {!failed ? (
          <img
            src={character.imageSrc}
            alt={character.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200 pointer-events-none"
          />
        ) : (
          <span className="font-display font-bold text-lg text-[#24211D]">
            {character.name.slice(0, 2)}
          </span>
        )}
      </div>
      <span className="font-display font-extrabold text-[11px] sm:text-xs text-[#24211D] whitespace-nowrap truncate max-w-full">
        {character.name}
      </span>
    </button>
  );
};

export const MainMenu: React.FC<MainMenuProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onStartMode,
}) => {
  const activeChar =
    characters.find((c) => c.id === selectedCharacterId) ?? characters[0];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 sm:px-6 py-3 sm:py-5">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5 sm:gap-7 pb-4">
        {/* Step 1: Pick a Character */}
        <section aria-label="Выбери героя" className="flex flex-col gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="font-display font-extrabold text-base sm:text-xl text-[#24211D]">
              1. Выбери героя
            </h2>
            <div className="flex items-center gap-2 bg-white border border-[#EAE2D3] rounded-full pl-1.5 pr-3 py-1 shadow-xs">
              <div
                className="w-6 h-6 rounded-full overflow-hidden shrink-0"
                style={{ backgroundColor: activeChar.accentBg }}
              >
                <img
                  src={activeChar.imageSrc}
                  alt={activeChar.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span className="font-display font-bold text-xs sm:text-sm text-[#24211D]">
                {activeChar.name}
              </span>
            </div>
          </div>

          <div className="grid grid-flow-col grid-rows-2 auto-cols-[84px] sm:auto-cols-[100px] lg:grid-flow-row lg:grid-rows-none lg:grid-cols-10 gap-2 sm:gap-2.5 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-1.5 bg-[#F3EFE6]/80 border border-[#E6DFD0] rounded-3xl">
            {characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                isSelected={char.id === selectedCharacterId}
                onSelect={() => onSelectCharacter(char)}
              />
            ))}
          </div>
        </section>

        {/* Step 2: Pick a Game Mode */}
        <section aria-label="Во что играем" className="flex flex-col gap-2.5 sm:gap-3">
          <h2 className="font-display font-extrabold text-base sm:text-xl text-[#24211D] px-1">
            2. Во что играем?
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {GAME_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onStartMode(m.id)}
                style={{
                  backgroundColor: m.cardBg,
                  borderColor: m.borderColor,
                  boxShadow: `0 5px 0 ${m.shadowColor}`,
                }}
                className="group flex flex-col items-center justify-center gap-2 p-3.5 sm:p-5 rounded-3xl border-2 cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:translate-y-1 outline-none focus-visible:ring-3 focus-visible:ring-[#FF6B4A]"
              >
                <ModeTabSvg
                  mode={m.id}
                  className="w-16 h-16 sm:w-20 sm:h-20 group-hover:scale-110 transition-transform duration-150"
                />
                <span className="font-display font-extrabold text-sm sm:text-base text-[#24211D]">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

