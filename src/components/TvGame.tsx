import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import tvVideos from '../data/tvVideos.json';

/**
 * «Телевизор»: мультфильмы про Зубу и Слоню. Без текста: выбираешь картинку-превью,
 * большой экран, нажатие на видео — пауза, полоска времени и кнопки.
 */

interface TvVideo {
  id: string;
  title: string;
  src: string;
  poster: string;
  portrait: boolean;
  seconds: number;
}

const VIDEOS = tvVideos as TvVideo[];

interface TvGameProps {
  soundEnabled: boolean;
}

export const TvGame: React.FC<TvGameProps> = ({ soundEnabled }) => {
  const [current, setCurrent] = useState<TvVideo | null>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setProgress(0);
    setPlaying(true);
  }, [current?.id]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  };

  if (current) {
    const idx = VIDEOS.findIndex((v) => v.id === current.id);
    return (
      <div className="relative w-full h-full flex flex-col items-center gap-2 p-2 sm:p-4 toy-panel overflow-hidden select-none">
        <div className="w-full flex items-center justify-between shrink-0">
          <button
            type="button"
            aria-label="К мультикам"
            onClick={() => setCurrent(null)}
            className="w-14 h-14 sm:w-16 sm:h-16 cursor-pointer outline-none active:scale-90 transition-transform drop-shadow-[0_5px_5px_rgba(0,0,0,0.25)]"
          >
            <img src="/assets/design/ui/btn_back.webp" alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
          </button>
          <button
            type="button"
            aria-label="Следующий мультик"
            onClick={() => setCurrent(VIDEOS[(idx + 1) % VIDEOS.length])}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF7A1A] border-[3px] border-white text-white shadow-[0_4px_0_#C2410C] flex items-center justify-center cursor-pointer active:translate-y-0.5"
          >
            <span className="text-2xl leading-none">⏭</span>
          </button>
        </div>

        <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="relative max-w-full max-h-full aspect-auto rounded-[1.6rem] border-[6px] border-white bg-black shadow-[0_10px_0_#7a4a1a,0_18px_26px_rgba(0,0,0,0.35)] overflow-hidden">
            <video
              key={current.id}
              ref={videoRef}
              src={current.src}
              poster={current.poster}
              autoPlay
              playsInline
              muted={!soundEnabled}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setProgress(v.duration ? v.currentTime / v.duration : 0);
              }}
              onEnded={() => setCurrent(VIDEOS[(idx + 1) % VIDEOS.length])}
              onClick={toggle}
              className="block max-w-full max-h-[62vh] cursor-pointer"
            />
            {!playing && (
              <button
                type="button"
                aria-label="Играть"
                onClick={toggle}
                className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-white/90 flex items-center justify-center cursor-pointer shadow-xl"
              >
                <Play className="w-12 h-12 text-[#FF7A1A] fill-[#FF7A1A]" />
              </button>
            )}
          </div>
        </div>

        {/* Помощники сидят перед экраном (вид со спины) и тоже смотрят мультик */}
        <div className="flex items-end justify-center gap-6 shrink-0 -mt-1 pointer-events-none">
          <img src="/assets/tvhelpers/zuba.webp" alt="" draggable={false} className={`object-contain drop-shadow-lg ${playing ? 'animate-[bob_2.4s_ease-in-out_infinite]' : ''}`} style={{ height: 'clamp(70px, 14vh, 140px)' }} />
          <img src="/assets/tvhelpers/slonya.webp" alt="" draggable={false} className={`object-contain drop-shadow-lg ${playing ? 'animate-[bob_2.8s_ease-in-out_infinite]' : ''}`} style={{ height: 'clamp(70px, 14vh, 140px)' }} />
        </div>

        <div className="w-full flex items-center gap-3 shrink-0 px-2 pb-1">
          <button
            type="button"
            aria-label={playing ? 'Пауза' : 'Играть'}
            onClick={toggle}
            className="w-14 h-14 rounded-full bg-[#FFB800] border-[3px] border-white text-white shadow-[0_4px_0_#D97706] flex items-center justify-center cursor-pointer active:translate-y-0.5"
          >
            {playing ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white" />}
          </button>
          <div
            className="flex-1 h-5 rounded-full bg-white/70 border-2 border-white overflow-hidden cursor-pointer"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const v = videoRef.current;
              if (v?.duration) v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
            }}
          >
            <div className="h-full bg-gradient-to-r from-[#FF7A1A] to-[#FFB800] rounded-full" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col gap-3 p-3 sm:p-5 toy-panel overflow-hidden select-none">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {VIDEOS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-label={v.title}
              onClick={() => setCurrent(v)}
              className="relative aspect-video rounded-[1.4rem] overflow-hidden border-[5px] border-white shadow-[0_6px_0_#E8B77D,0_10px_14px_rgba(0,0,0,0.2)] cursor-pointer outline-none active:scale-95 transition-transform bg-black"
            >
              <img src={v.poster} alt="" draggable={false} className={`w-full h-full pointer-events-none ${v.portrait ? 'object-contain bg-[#2b2b2b]' : 'object-cover'}`} />
              <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-[#FF7A1A] fill-[#FF7A1A]" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
