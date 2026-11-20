import React from 'react';
import { Download, Trash2, X } from 'lucide-react';

export interface SavedArtwork {
  id: string;
  characterName: string;
  dataUrl: string;
  createdAt: number;
}

interface GalleryModalProps {
  isOpen: boolean;
  artworks: SavedArtwork[];
  onClose: () => void;
  onDownloadItem: (item: SavedArtwork) => void;
  onDeleteItem: (id: string) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  artworks,
  onClose,
  onDownloadItem,
  onDeleteItem,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Мои сохранённые рисунки"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] bg-[#FAF8F4] border-2 border-[#E5DFD2] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFD2] bg-white">
          <h2 className="font-display font-bold text-xl text-[#24211D]">
            Мои рисунки
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть галерею"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-[#F3F0E8] text-[#24211D] hover:bg-[#EAE4D7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {artworks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-display font-bold text-lg text-[#4A443D]">
                Здесь появятся твои рисунки
              </p>
              <p className="text-sm text-[#78716C] mt-1">
                Нарисуй красивый фейс-арт и нажми «Сохранить»
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {artworks.map((art) => (
                <div
                  key={art.id}
                  className="bg-white rounded-2xl border border-[#E5DFD2] overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="aspect-[3/4] bg-white overflow-hidden">
                    <img
                      src={art.dataUrl}
                      alt={art.characterName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2 border-t border-[#F3F0E8]">
                    <span className="font-display font-bold text-xs text-[#24211D] truncate">
                      {art.characterName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onDownloadItem(art)}
                        title="Сохранить в галерею устройства"
                        aria-label={`Скачать ${art.characterName}`}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#10B981] text-white hover:bg-[#059669] cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(art.id)}
                        title="Удалить"
                        aria-label={`Удалить ${art.characterName}`}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
