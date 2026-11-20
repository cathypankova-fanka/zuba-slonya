import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  PAINT_COLORS,
  PATTERN_STAMPS,
  PatternStampId,
  STICKERS,
  stickerToDataUrl,
} from '../data/artTools';
import { FACE_ART_MASKS, faceArtMaskToDataUrl } from '../data/faceArtMasks';
import { PlacedFaceArtMask, PlacedSticker } from '../utils/canvasRender';
import { getFaceMaskAssetUrl, getStickerAssetUrl } from '../utils/itemAssets';
import { DraggableToolButton } from './DragContext';
import { ToolMode } from './FaceArtStage';
import { ArtToolSvgIcon, ColorPencilSvgIcon } from './KitchenIllustrations';
import { StampPreviewIcon } from './StampPreviewIcon';

export type GameMode = 'face' | 'tshirt';

interface ArtToolbarProps {
  gameMode: GameMode;
  toolMode: ToolMode;
  selectedColor: string;
  brushSize: 'medium' | 'large';
  selectedStamp: PatternStampId;
  selectedStickerId: string;
  selectedPlacedSticker: PlacedSticker | null;
  activeFaceArtMask: PlacedFaceArtMask | null;
  onSelectToolMode: (mode: ToolMode) => void;
  onSelectColor: (hex: string) => void;
  onSelectBrushSize: (size: 'medium' | 'large') => void;
  onSelectStamp: (stampId: PatternStampId) => void;
  onSelectSticker: (stickerId: string) => void;
  onSelectFaceArtMask: (maskId: string | null) => void;
  onTransformFaceArtMask: (
    action: 'smaller' | 'bigger' | 'up' | 'down' | 'reset' | 'remove'
  ) => void;
  onTransformSelectedSticker: (
    action: 'smaller' | 'bigger' | 'rotateLeft' | 'rotateRight' | 'delete'
  ) => void;
  onClearAll: () => void;
}

const iconCircleCls = (active: boolean) =>
  `toy-chip p-1.5 flex items-center justify-center shrink-0 cursor-pointer outline-none ${active ? 'toy-chip-on' : ''}`;

export const ArtToolbar: React.FC<ArtToolbarProps> = ({
  gameMode,
  toolMode,
  selectedColor,
  brushSize,
  selectedStamp,
  selectedStickerId,
  selectedPlacedSticker,
  activeFaceArtMask,
  onSelectToolMode,
  onSelectColor,
  onSelectBrushSize,
  onSelectStamp,
  onSelectSticker,
  onSelectFaceArtMask,
  onTransformFaceArtMask,
  onTransformSelectedSticker,
  onClearAll,
}) => {
  const decorating = toolMode === 'stamp' || toolMode === 'sticker';
  const mainTabs: Array<{ id: ToolMode; label: string; img: string; active: boolean }> = [
    ...(gameMode === 'face'
      ? [{ id: 'mask' as ToolMode, label: 'Аквагрим', img: 'mask', active: toolMode === 'mask' }]
      : []),
    { id: 'paint', label: 'Краска', img: 'paint', active: toolMode === 'paint' },
    { id: 'stamp', label: 'Узоры', img: 'stamp', active: toolMode === 'stamp' },
    { id: 'sticker', label: gameMode === 'tshirt' ? 'Картинки' : 'Стикеры', img: 'sticker', active: toolMode === 'sticker' },
  ];

  return (
    <>
    <aside
      aria-label="Инструменты"
      className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-30 toy-panel p-1.5 sm:p-2 flex flex-col"
    >
      {/* Главный выбор: что делаем? (3 крупные картинки) */}
      <div className="flex flex-col items-center gap-2.5 shrink-0">
        {mainTabs.map((m) => (
          <DraggableToolButton
            key={m.id}
            dragItem={{ kind: 'art_tool', tool: m.id, label: m.label }}
            onTap={() => onSelectToolMode(m.id)}
            aria-label={m.label}
            title={m.label}
            className={iconCircleCls(m.active)}
          >
            <img src={`/assets/design/tools/${m.img}.webp`} alt="" draggable={false} className="w-10 h-10 lg:w-16 lg:h-16 object-contain pointer-events-none" />
          </DraggableToolButton>
        ))}
      </div>

    </aside>
    <aside
      aria-label="Выбор"
      className="absolute right-1.5 sm:right-3 top-16 bottom-24 z-30 toy-panel p-1.5 sm:p-2 w-[112px] sm:w-[132px] overflow-y-auto no-scrollbar flex flex-col gap-2"
    >
      {/* Full Face-Art Mask (Аквагрим) Picker */}
      {gameMode === 'face' && toolMode === 'mask' && (
        <div className="flex flex-col gap-2">
          {activeFaceArtMask && (
            <div className="flex items-center justify-between gap-1.5 px-1">
              <button
                type="button"
                onClick={() => onTransformFaceArtMask('smaller')}
                title="Уменьшить"
                aria-label="Уменьшить аквагрим"
                className={iconCircleCls(false)}
              >
                <ZoomOut className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformFaceArtMask('bigger')}
                title="Увеличить"
                aria-label="Увеличить аквагрим"
                className={iconCircleCls(false)}
              >
                <ZoomIn className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformFaceArtMask('up')}
                title="Выше"
                aria-label="Поднять аквагрим выше"
                className={iconCircleCls(false)}
              >
                <ArrowUp className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformFaceArtMask('down')}
                title="Ниже"
                aria-label="Опустить аквагрим ниже"
                className={iconCircleCls(false)}
              >
                <ArrowDown className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformFaceArtMask('reset')}
                title="По центру"
                aria-label="Сбросить положение аквагрима"
                className={iconCircleCls(false)}
              >
                <RotateCcw className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformFaceArtMask('remove')}
                title="Снять маску"
                aria-label="Снять аквагрим"
                className={iconCircleCls(false)}
              >
                <Trash2 className="w-6 h-6 text-[#EF4444]" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 justify-items-center">
            {FACE_ART_MASKS.map((mask) => {
              const active = activeFaceArtMask?.maskId === mask.id;
              return (
                <DraggableToolButton
                  key={mask.id}
                  dragItem={{
                    kind: 'face_mask',
                    maskId: mask.id,
                    svg: mask.svg,
                    previewBg: mask.previewBg,
                    label: mask.name,
                  }}
                  onTap={() => onSelectFaceArtMask(active ? null : mask.id)}
                  aria-label={mask.name}
                  title={mask.name}
                  className={iconCircleCls(active)}
                >
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center p-1 overflow-hidden"
                    style={{ backgroundColor: mask.previewBg }}
                  >
                    <img
                      src={getFaceMaskAssetUrl(mask.id, mask.svg)}
                      alt={mask.name}
                      draggable={false}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1';
                          img.src = faceArtMaskToDataUrl(mask.svg);
                        }
                      }}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                </DraggableToolButton>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Palette (Shown for Paint and Stamp modes) */}
      {(toolMode === 'paint' || toolMode === 'stamp') && (
        <div className="flex flex-col gap-2">
          <div className="hidden">
            <button
              type="button"
              onClick={() => onSelectBrushSize('medium')}
              aria-label="Средний размер"
              title="Средний размер"
              className={iconCircleCls(brushSize === 'medium')}
            >
              <span className="w-3 h-3 rounded-full bg-[#7C5A3A] block m-3" />
            </button>
            <button
              type="button"
              onClick={() => onSelectBrushSize('large')}
              aria-label="Большой размер"
              title="Большой размер"
              className={iconCircleCls(brushSize === 'large')}
            >
              <span className="w-8 h-8 rounded-full bg-[#7C5A3A] block m-1.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 justify-items-center">
            {PAINT_COLORS.map((c) => {
              const isSelected = selectedColor === c.hex;
              return (
                <DraggableToolButton
                  key={c.id}
                  dragItem={{ kind: 'paint_color', hex: c.hex, ringHex: c.ringHex, label: c.name }}
                  onTap={() => onSelectColor(c.hex)}
                  aria-label={c.name}
                  title={c.name}
                  className={iconCircleCls(isSelected)}
                >
                  <ColorPencilSvgIcon
                    color={c.hex}
                    ringColor={c.ringHex}
                    className="w-9 h-10 lg:w-10 lg:h-11"
                  />
                </DraggableToolButton>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern Stamps Picker (Pure large icons) */}
      {toolMode === 'stamp' && (
        <div className="grid grid-cols-2 gap-1.5 justify-items-center">
          {PATTERN_STAMPS.map((s) => (
            <DraggableToolButton
              key={s.id}
              dragItem={{ kind: 'stamp', stampId: s.id, color: selectedColor, label: s.name }}
              onTap={() => onSelectStamp(s.id)}
              aria-label={s.name}
              title={s.name}
              className={iconCircleCls(selectedStamp === s.id)}
            >
              <StampPreviewIcon stampId={s.id} color={selectedColor} />
            </DraggableToolButton>
          ))}
        </div>
      )}

      {/* Sticker / Print Picker (Pure large icons) */}
      {toolMode === 'sticker' && (
        <div className="flex flex-col gap-2">
          {gameMode === 'tshirt' && selectedPlacedSticker && (
            <div className="flex items-center justify-around gap-1.5 py-0.5">
              <button
                type="button"
                onClick={() => onTransformSelectedSticker('smaller')}
                title="Уменьшить"
                aria-label="Уменьшить картинку"
                className={iconCircleCls(false)}
              >
                <ZoomOut className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformSelectedSticker('bigger')}
                title="Увеличить"
                aria-label="Увеличить картинку"
                className={iconCircleCls(false)}
              >
                <ZoomIn className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformSelectedSticker('rotateLeft')}
                title="Повернуть влево"
                aria-label="Повернуть влево"
                className={iconCircleCls(false)}
              >
                <RotateCcw className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformSelectedSticker('rotateRight')}
                title="Повернуть вправо"
                aria-label="Повернуть вправо"
                className={iconCircleCls(false)}
              >
                <RotateCw className="w-6 h-6 text-[#3F3A34]" />
              </button>
              <button
                type="button"
                onClick={() => onTransformSelectedSticker('delete')}
                title="Удалить картинку"
                aria-label="Удалить картинку"
                className={iconCircleCls(false)}
              >
                <Trash2 className="w-6 h-6 text-[#EF4444]" />
              </button>
            </div>
          )}

          <div className="hidden">
            <button
              type="button"
              onClick={() => onSelectBrushSize('medium')}
              aria-label="Обычный размер"
              title="Обычный размер"
              className={iconCircleCls(brushSize === 'medium')}
            >
              <span className="w-3 h-3 rounded-full bg-[#7C5A3A] block m-3" />
            </button>
            <button
              type="button"
              onClick={() => onSelectBrushSize('large')}
              aria-label="Большой размер"
              title="Большой размер"
              className={iconCircleCls(brushSize === 'large')}
            >
              <span className="w-8 h-8 rounded-full bg-[#7C5A3A] block m-1.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 justify-items-center">
            {STICKERS.map((stk) => (
              <DraggableToolButton
                key={stk.id}
                dragItem={{ kind: 'sticker', stickerId: stk.id, svg: stk.svg, label: stk.name }}
                onTap={() => onSelectSticker(stk.id)}
                aria-label={stk.name}
                title={stk.name}
                className={iconCircleCls(selectedStickerId === stk.id)}
              >
                <img
                  src={getStickerAssetUrl(stk.id, stk.svg)}
                  alt={stk.name}
                  draggable={false}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = '1';
                      img.src = stickerToDataUrl(stk.svg);
                    }
                  }}
                  className="w-11 h-11 lg:w-12 lg:h-12 object-contain pointer-events-none"
                />
              </DraggableToolButton>
            ))}
          </div>
        </div>
      )}

      {/* Eraser Panel */}
      {toolMode === 'eraser' && (
        <div className="toy-tray flex items-center justify-center py-3">
          <button
            type="button"
            onClick={onClearAll}
            aria-label={gameMode === 'tshirt' ? 'Очистить футболку' : 'Очистить всё лицо'}
            title={gameMode === 'tshirt' ? 'Очистить футболку' : 'Очистить всё лицо'}
            className={iconCircleCls(false)}
          >
            <Trash2 className="w-10 h-10 text-[#EF4444]" />
          </button>
        </div>
      )}
    </aside>
    </>
  );
};
