import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { RoundReplayOverlay } from './MiniGameShell';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { hasReactionAnim, reactionAnimUrl } from '../data/reactionAssets';

/** Какие видео-реакции похожи на лицо-эмоцию — после верного ответа герой «оживает» */
const EMOTION_ANIMS: Record<string, string[]> = {
  joy: ['dance', 'partypop', 'heli', 'singer', 'wave', 'headbang', 'superhero'],
  laugh: ['raspberry', 'heli', 'jumpspin', 'dizzy', 'headbang', 'dance'],
  sad: [],
  surprised: ['mindblown', 'bigeyes', 'sneeze', 'hiccup', 'shrink', 'magic', 'burp'],
  scared: ['iceblock', 'cold', 'hiccup', 'shrink', 'mindblown'],
  angry: ['stomp', 'hot', 'raspberry', 'blow'],
  sleepy: ['snorebubble', 'sleepy', 'fullbelly'],
  curious: ['bigeyes', 'magic', 'dizzy', 'blow'],
  proud: ['flex', 'superhero', 'partypop', 'dance'],
  shy: ['kiss', 'peekaboo', 'hiccup'],
};
const pickAnimFor = (hero: string, emotion: string): string | null => {
  const pref = (EMOTION_ANIMS[emotion] ?? []).filter((a) => hasReactionAnim(hero, a));
  return pref.length ? pref[Math.floor(Math.random() * pref.length)] : null;
};

/**
 * «Какое у героя лицо?»: показываем героя с эмоцией, ребёнок выбирает такой же
 * смайлик из трёх. Без слов.
 */

import { EMOTION_HEROES, HERO_EMOTIONS } from '../data/emotionAssets';

const EMOTIONS: Array<{ id: string; emoji: string; bg: string }> = [
  { id: 'joy', emoji: '😊', bg: '#FFE27A' },
  { id: 'laugh', emoji: '😂', bg: '#FFD0A3' },
  { id: 'sad', emoji: '😢', bg: '#BFDBFE' },
  { id: 'surprised', emoji: '😮', bg: '#E9D5FF' },
  { id: 'scared', emoji: '😨', bg: '#C7D2FE' },
  { id: 'angry', emoji: '😠', bg: '#FCA5A5' },
  { id: 'sleepy', emoji: '😴', bg: '#CBD5E1' },
  { id: 'curious', emoji: '🤔', bg: '#BBF7D0' },
  { id: 'proud', emoji: '😎', bg: '#FDE68A' },
  { id: 'shy', emoji: '😳', bg: '#FBCFE8' },
];

const ROUNDS = 6;

interface Round {
  hero: string;
  emotion: string;
  options: string[];
}

const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function buildRounds(): Round[] {
  const allIds = EMOTIONS.map((e) => e.id);
  // Случайные пары «герой/эмоция» из всех ~190 лиц
  const pairs = EMOTION_HEROES.flatMap((h) => HERO_EMOTIONS[h].map((e) => `${h}/${e}`));
  const usedHeroes: string[] = [];
  const usedEmotions: string[] = [];
  return Array.from({ length: ROUNDS }, () => {
    // в одной игре стараемся не повторять ни героя, ни эмоцию
    const avoid = pairs.filter((p) => {
      const [h, e] = p.split('/');
      return usedHeroes.includes(h) || usedEmotions.includes(e);
    });
    const ok = pairs.filter((p) => !avoid.includes(p));
    const pair = pickRandom(ok.length ? ok : pairs);
    const [hero, emotion] = pair.split('/');
    usedHeroes.push(hero);
    usedEmotions.push(emotion);
    const others = allIds
      .filter((id) => id !== emotion)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return { hero, emotion, options: [emotion, ...others].sort(() => Math.random() - 0.5) };
  });
}

interface EmotionsGameProps {
  soundEnabled: boolean;
}

export const EmotionsGame: React.FC<EmotionsGameProps> = ({ soundEnabled }) => {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds());
  const [idx, setIdx] = useState(0);
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mimic, setMimic] = useState(false);
  const [wonAnim, setWonAnim] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const restart = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setRounds(buildRounds());
    setIdx(0);
    setWon(false); setWonAnim(null);
    setWrong(null);
    setDone(false);
  }, []);

  const round = rounds[idx];

  // новый раунд: помощник спрашивает, какое у героя лицо
  useEffect(() => {
    if (!round || done) return;
    const asks = ['emotion_1', 'em_ask_2', 'em_ask_3'];
    const t = window.setTimeout(() => playVoice(asks[Math.floor(Math.random() * asks.length)], soundEnabled), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  if (!round) return null;

  const choose = (id: string) => {
    if (won || done) return;
    if (id === round.emotion) {
      setWon(true);
      setWonAnim(pickAnimFor(round.hero, round.emotion));
      soundEngine.playGameOk(soundEnabled, idx);
      const goNext = () => {
        if (idx + 1 >= ROUNDS) setDone(true);
        else { setIdx(idx + 1); setWon(false); setMimic(false); setWonAnim(null); }
      };
      // смешная реплика про эмоцию, иногда — «А ты так можешь? Покажи такую же!»
      playVoice(`em_${round.emotion}`, soundEnabled, undefined, 'replace');
      if (Math.random() < 0.5) {
        playVoice(`em_try_${1 + Math.floor(Math.random() * 4)}`, soundEnabled);
        whenVoiceIdle(() => {
          setMimic(true);
          later(() => {
            playVoice(`em_great_${1 + Math.floor(Math.random() * 3)}`, soundEnabled);
            whenVoiceIdle(() => later(goNext, 400));
          }, 3200);
        });
      } else {
        whenVoiceIdle(() => later(goNext, 500));
      }
    } else {
      setWrong(id);
      soundEngine.playGamePop(soundEnabled, 0);
      later(() => setWrong(null), 500);
    }
  };

  const emo = EMOTIONS.find((e) => e.id === round.emotion)!;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 toy-panel overflow-hidden select-none touch-none">
      <div className="w-full flex items-center justify-between gap-2 shrink-0">
        <div className="toy-pill flex items-center gap-1.5 px-3 py-2">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <span
              key={i}
              className="block w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[3px] border-white"
              style={{ background: i < idx || done ? '#FF8A3D' : i === idx ? '#FFD84D' : '#F3EEE6' }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 3);
            restart();
          }}
          aria-label="Начать заново"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7A1A] hover:bg-[#F97316] border-2 border-white text-white shadow-[0_4px_0_#C2410C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Герой с эмоцией */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          key={`${idx}-${round.hero}`}
          className={`relative h-full max-h-[460px] aspect-square rounded-[2.4rem] border-[6px] border-white bg-white overflow-hidden shadow-[0_10px_0_#E8B77D,0_18px_26px_rgba(120,60,10,0.25)] animate-pop-in transition-transform duration-300 ${
            won ? 'scale-105' : ''
          }`}
          style={{ backgroundColor: won ? emo.bg : '#fff' }}
        >
          {mimic && (
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-2 z-10">
              <span className="text-7xl animate-bounce drop-shadow-lg">{emo.emoji}👀</span>
            </div>
          )}
          <img
            src={won && wonAnim ? `${reactionAnimUrl(round.hero, wonAnim)}?r=${idx}` : `/assets/emotions/${round.hero}/${round.emotion}.webp`}
            alt=""
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* Три смайлика на выбор */}
      <div className="w-full flex items-center justify-center gap-3 sm:gap-6 shrink-0 pb-1">
        {round.options.map((id) => {
          const e = EMOTIONS.find((x) => x.id === id)!;
          const isRight = won && id === round.emotion;
          return (
            <button
              key={id}
              type="button"
              onPointerDown={() => choose(id)}
              aria-label={id}
              style={{ background: `radial-gradient(circle at 30% 25%, #fff8, transparent 55%), ${e.bg}` }}
              className={`w-[28vw] h-[28vw] max-w-[150px] max-h-[150px] rounded-[2rem] border-[5px] border-white shadow-[0_7px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-[4.6rem] sm:text-[5.6rem] leading-none cursor-pointer outline-none transition-transform active:scale-90 ${
                isRight ? 'scale-110 ring-8 ring-[#10C97A]' : ''
              } ${wrong === id ? 'animate-gentle-shake' : ''}`}
            >
              {e.emoji}
            </button>
          );
        })}
      </div>

      <RoundReplayOverlay open={done} soundEnabled={soundEnabled} onReplay={restart} />
    </div>
  );
};
