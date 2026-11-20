import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="min-h-[46px] flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E5DFD2] text-[#24211D] font-display font-bold text-sm shadow-[0_3px_0_#E5DFD2] hover:bg-[#FFFDF9] active:translate-y-0.5 cursor-pointer whitespace-nowrap"
      >
        <Smartphone className="w-4 h-4 text-[#2563EB]" />
        <span>Установить</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[46px] flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E5DFD2] text-[#24211D] font-display font-bold text-sm shadow-[0_3px_0_#E5DFD2] hover:bg-[#FFFDF9] active:translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <Smartphone className="w-4 h-4 text-[#2563EB]" />
          <span>На экран домой</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Установка на iPhone и iPad"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-[#FAF8F4] border-2 border-[#E5DFD2] p-6 shadow-2xl animate-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-lg text-[#24211D]">
                  Установить на iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Закрыть"
                  className="w-9 h-9 rounded-xl bg-white border border-[#E5DFD2] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#4A443D] leading-relaxed list-decimal list-inside">
                <li>
                  Нажмите кнопку <strong>«Поделиться»</strong> на нижней панели Safari.
                </li>
                <li>
                  Выберите пункт <strong>«На экран „Домой“»</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-2xl bg-[#FF6B4A] text-white font-display font-bold text-sm hover:bg-[#E85838] cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
