import React from 'react';
import { TSHIRT_COLORS } from '../data/artTools';
import { DraggableToolButton } from './DragContext';
import { TShirtColorSvgIcon } from './KitchenIllustrations';

interface TShirtColorPanelProps {
  tshirtColor: string;
  onSelectTShirtColor: (hex: string) => void;
}

export const TShirtColorPanel: React.FC<TShirtColorPanelProps> = ({
  tshirtColor,
  onSelectTShirtColor,
}) => {
  return (
    <aside
      aria-label="Цвета футболки"
      className="order-1 lg:order-1 bg-[#F7F3EA]/90 border border-[#EAE2D3] rounded-2xl lg:rounded-3xl p-1.5 sm:p-2 lg:p-3 w-full lg:w-[152px] shrink-0 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto no-scrollbar"
    >
      <div className="flex lg:grid lg:grid-cols-2 items-center justify-items-center gap-1.5 sm:gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x px-2 py-1 lg:p-1">
        {TSHIRT_COLORS.map((c) => {
          const isSelected = tshirtColor === c.hex;
          return (
            <DraggableToolButton
              key={c.id}
              dragItem={{ kind: 'tshirt_color', hex: c.hex, ringHex: c.ringHex, label: c.name }}
              onTap={() => onSelectTShirtColor(c.hex)}
              aria-label={`Футболка: ${c.name}`}
              title={c.name}
              className={`p-1.5 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-150 cursor-pointer bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A] ${
                isSelected
                  ? 'scale-105 ring-3 ring-[#FF6B4A] bg-white shadow-md'
                  : 'hover:scale-105 active:scale-95 drop-shadow-xs'
              }`}
            >
              <TShirtColorSvgIcon
                color={c.hex}
                ringColor={c.ringHex}
                className="w-10 h-10 lg:w-12 lg:h-12"
              />
            </DraggableToolButton>
          );
        })}
      </div>
    </aside>
  );
};
