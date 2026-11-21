import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { hasReactionAnim, reactionAnimUrl } from '../data/reactionAssets';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom } from '../utils/voice';
import { CookScreen, GestureHint, useStepHint } from './CookKit';
import { HeroFace, say, shuffle } from './PlayKit';

/**
 * Музыка: ксилофон (8 цветных пластинок, можно вести пальцем — глиссандо) и барабаны.
 * Пока ребёнок играет — герои на сцене танцуют; перестал — замирают и ждут. ⭐ — «сыграй песенку» по подсветке.
 */

const BARS = [
  { f: 261.6, c: '#EF4444' }, { f: 293.7, c: '#F97316' }, { f: 329.6, c: '#FACC15' }, { f: 349.2, c: '#22C55E' },
  { f: 392.0, c: '#06B6D4' }, { f: 440.0, c: '#3B82F6' }, { f: 493.9, c: '#8B5CF6' }, { f: 523.3, c: '#EC4899' },
];
// «Маленькая звёздочка» (народная мелодия)
const SONG = [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0];
const DRUMS = [
  { id: 'kick', size: 26, c1: '#3B82F6', c2: '#1D4ED8', x: 50, y: 56 },
  { id: 'snare', size: 21, c1: '#F43F5E', c2: '#BE123C', x: 25, y: 52 },
  { id: 'tom', size: 19, c1: '#22C55E', c2: '#15803D', x: 75, y: 52 },
  { id: 'hat', size: 17, c1: '#FDE047', c2: '#CA8A04', x: 12, y: 24, cymbal: true },
  { id: 'cymbal', size: 19, c1: '#FCD34D', c2: '#B45309', x: 88, y: 22, cymbal: true },
  { id: 'tambourine', size: 16, c1: '#F5D0FE', c2: '#A21CAF', x: 50, y: 18 },
] as const;

interface Fx { id: number; x: number; y: number; c: string }

export const MusicGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const band = useMemo(() => [shuffle(CHARACTERS.filter((c) => c.id !== character.id))[0], character, shuffle(CHARACTERS.filter((c) => c.id !== character.id))[1]], [character]);
  const [inst, setInst] = useState<'xylo' | 'drums'>('xylo');
  const [lastHit, setLastHit] = useState(0);
  const [now, setNow] = useState(0);
  const [hopper, setHopper] = useState<{ i: number; k: number }>({ i: -1, k: 0 });
  const [pressed, setPressed] = useState<string | null>(null);
  const [fx, setFx] = useState<Fx[]>([]);
  const [song, setSong] = useState<number | null>(null); // позиция в песенке
  const [hits, setHits] = useState(0);
  const fxId = useRef(0);
  const lastBar = useRef(-1);
  const stageRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { say('mu_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { const t = window.setInterval(() => setNow(performance.now()), 250); return () => window.clearInterval(t); }, []);
  const dancing = now - lastHit < 1400;

  const hit = (x: number, y: number, c: string) => {
    const t = performance.now();
    setLastHit(t); setNow(t);
    setHits((h) => h + 1);
    setHopper((h) => ({ i: Math.floor(Math.random() * 3), k: h.k + 1 }));
    const id = fxId.current++;
    setFx((f) => [...f.slice(-14), { id, x, y, c }]);
    window.setTimeout(() => setFx((f) => f.filter((q) => q.id !== id)), 1200);
  };

  const playBar = (i: number, e: { clientX: number; clientY: number }) => {
    soundEngine.playXylo(soundEnabled, BARS[i].f);
    setPressed(`b${i}`); window.setTimeout(() => setPressed((p) => (p === `b${i}` ? null : p)), 140);
    hit(e.clientX, e.clientY, BARS[i].c);
    if (song !== null && SONG[song] === i) {
      const n = song + 1;
      if (n >= SONG.length) {
        setSong(null);
        soundEngine.playGameReward(soundEnabled);
        window.setTimeout(() => say('mu_song_done', soundEnabled), 400);
        window.setTimeout(() => sayRandom('win', 6, soundEnabled), 2600);
        setLastHit(performance.now() + 2500);
      } else setSong(n);
    }
  };
  const playDrum = (d: (typeof DRUMS)[number], e: { clientX: number; clientY: number }) => {
    soundEngine.playDrum(soundEnabled, d.id);
    setPressed(d.id); window.setTimeout(() => setPressed((p) => (p === d.id ? null : p)), 120);
    hit(e.clientX, e.clientY, d.c1);
  };

  // глиссандо: ведём пальцем по ксилофону
  const xyloMove = (e: React.PointerEvent) => {
    if (!e.buttons && e.pointerType !== 'touch') return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const i = Number(el?.closest('[data-bar]')?.getAttribute('data-bar') ?? -1);
    if (i >= 0 && i !== lastBar.current) { lastBar.current = i; playBar(i, e); }
  };

  const hintOn = useStepHint(`${inst}-${song ?? 'free'}-${hits > 3}`, 2500, 9000, hits < 3 || song !== null);
  const H = 'min(30vh, 250px)';
  return (
    <CookScreen stepKey="music" stepIdx={0} total={0} bg="radial-gradient(circle at 50% 0%, #FDE68A 0%, #FBCFE8 35%, #C4B5FD 70%, #818CF8 100%)">
      <div className="relative w-full h-full flex flex-col items-center justify-between pt-[1vmin] pb-[2vmin]">
        {/* сцена с танцующими героями */}
        <div ref={stageRef} className="relative flex items-end justify-center gap-[4vmin]" style={{ height: H }}>
          <div className="absolute -bottom-[1.5vmin] left-[-6vmin] right-[-6vmin] h-[4vmin] rounded-[50%] bg-[#7C3AED]/40 blur-[2px]" />
          {band.map((h, i) => {
            const anim = dancing && hasReactionAnim(h.id, 'dance') ? reactionAnimUrl(h.id, 'dance') : null;
            const size = i === 1 ? `calc(${H} * 0.95)` : `calc(${H} * 0.75)`;
            return (
              <div key={`${h.id}-${i === hopper.i ? hopper.k : 0}`} className={i === hopper.i ? 'r-hop' : ''}>
                <div className={dancing && !anim ? 'r-dance' : ''} style={{ animationDuration: '0.9s', animationIterationCount: 'infinite' }}>
                  {anim
                    ? <div className="rounded-full overflow-hidden border-[6px] border-white shadow-2xl" style={{ width: size, height: size, background: h.accentBg }}>
                        <img src={anim} alt="" draggable={false} className="w-full h-full object-cover" />
                      </div>
                    : <HeroFace hero={h} emotion={dancing ? 'joy' : 'curious'} size={size} />}
                </div>
              </div>
            );
          })}
          {dancing && ['🎵', '🎶', '✨'].map((e, k) => <span key={k} className="absolute text-[5vmin] animate-bounce pointer-events-none" style={{ left: `${10 + k * 40}%`, top: '-8%', animationDelay: `${k * 0.25}s` }}>{e}</span>)}
        </div>

        {/* инструмент */}
        <div className="flex items-end gap-[3vmin]">
          {inst === 'xylo' ? (
            <div className="relative" onPointerMove={xyloMove} onPointerUp={() => { lastBar.current = -1; }} style={{ touchAction: 'none' }}>
              <div className="absolute left-[2%] right-[2%] top-[22%] h-[6%] rounded-full bg-[#92400E]" />
              <div className="absolute left-[2%] right-[2%] bottom-[22%] h-[6%] rounded-full bg-[#92400E]" />
              <div className="relative flex items-center gap-[1vmin] px-[1vmin]">
                {BARS.map((b, i) => {
                  const next = song !== null && SONG[song] === i;
                  return (
                    <div key={i} ref={i === (song !== null ? SONG[song] : 0) ? firstRef : undefined} data-bar={i}
                      onPointerDown={(e) => { (e.target as Element).releasePointerCapture?.(e.pointerId); lastBar.current = i; playBar(i, e); }}
                      className={`relative rounded-[1.2rem] flex flex-col justify-between items-center py-[1.4vmin] cursor-pointer transition-transform ${pressed === `b${i}` ? 'scale-95 brightness-110' : ''} ${next ? 'animate-pulse' : ''}`}
                      style={{ width: 'min(10.5vmin, 90px)', height: `calc(min(40vmin, 330px) * ${1 - i * 0.065})`, background: `linear-gradient(90deg, ${b.c}, ${b.c}cc)`,
                        boxShadow: next ? `0 0 0 6px #fff, 0 0 30px 10px ${b.c}` : '0 6px 0 rgba(0,0,0,.25), inset 0 4px 0 rgba(255,255,255,.4)' }}>
                      <span className="w-[1.6vmin] h-[1.6vmin] rounded-full bg-white/80" />
                      <span className="w-[1.6vmin] h-[1.6vmin] rounded-full bg-white/80" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative" style={{ width: 'min(84vmin, 720px)', height: 'min(46vmin, 390px)' }}>
              {DRUMS.map((d) => (
                <div key={d.id} role="button" aria-label="барабан" onPointerDown={(e) => playDrum(d, e)}
                  className={`absolute rounded-full cursor-pointer transition-transform ${pressed === d.id ? 'scale-90' : ''}`}
                  style={{ left: `${d.x}%`, top: `${d.y}%`, width: `min(${d.size}vmin, ${d.size * 8.5}px)`, aspectRatio: '1', transform: `translate(-50%,-50%) ${pressed === d.id ? 'scale(0.9)' : ''}`,
                    background: 'cymbal' in d ? `radial-gradient(circle, #FEF9C3 0 12%, ${d.c1} 13% 70%, ${d.c2} 100%)` : `radial-gradient(circle at 50% 40%, #FFFFFF 0 55%, #E5E7EB 56% 62%, ${d.c1} 63% 85%, ${d.c2} 86%)`,
                    boxShadow: '0 10px 0 rgba(0,0,0,.25), 0 16px 20px rgba(0,0,0,.25)' }}>
                  {d.id === 'tambourine' && [0, 1, 2, 3, 4, 5].map((k) => <span key={k} className="absolute w-[18%] h-[18%] rounded-full bg-[#FDE047] border-2 border-[#CA8A04]" style={{ left: `${41 + 46 * Math.cos(k * 1.05)}%`, top: `${41 + 46 * Math.sin(k * 1.05)}%` }} />)}
                </div>
              ))}
            </div>
          )}

          {/* выбор инструмента и песенка */}
          <div className="flex flex-col gap-[2vmin]">
            {(['xylo', 'drums'] as const).map((k) => (
              <button key={k} type="button" aria-label={k === 'xylo' ? 'Ксилофон' : 'Барабаны'}
                onClick={() => { setInst(k); setSong(null); soundEngine.playGamePop(soundEnabled, 6); if (k === 'drums') playVoice('mu_drums', soundEnabled, undefined, 'replace'); }}
                className={`rounded-[1.6rem] bg-white flex items-center justify-center transition-transform active:scale-90 ${inst === k ? 'ring-[6px] ring-[#F59E0B] scale-105' : ''}`}
                style={{ width: 'min(13vmin, 108px)', height: 'min(13vmin, 108px)', fontSize: 'min(7.5vmin, 62px)', boxShadow: '0 6px 0 rgba(0,0,0,.18)' }}>
                {k === 'xylo' ? '🎹' : '🥁'}
              </button>
            ))}
            {inst === 'xylo' && (
              <button ref={starRef} type="button" aria-label="Песенка" onClick={() => { setSong(0); soundEngine.playGamePop(soundEnabled, 8); playVoice('mu_song', soundEnabled, undefined, 'replace'); }}
                className={`rounded-full bg-[#FDE047] flex items-center justify-center transition-transform active:scale-90 ${song !== null ? 'ring-[6px] ring-white' : 'animate-pulse'}`}
                style={{ width: 'min(13vmin, 108px)', height: 'min(13vmin, 108px)', fontSize: 'min(7.5vmin, 62px)', boxShadow: '0 6px 0 #CA8A04' }}>⭐</button>
            )}
          </div>
        </div>

        {/* летящие нотки */}
        {fx.map((f) => (
          <span key={f.id} className="fixed pointer-events-none text-[6vmin] r-fx" style={{ left: f.x - 20, top: f.y - 40, color: f.c, textShadow: '0 2px 0 #fff', ['--dx' as string]: `${(f.id % 3 - 1) * 30}px` } as React.CSSProperties}>
            {f.id % 2 ? '♪' : '♫'}
          </span>
        ))}
      </div>
      <GestureHint show={hintOn} kind="tap" target={song !== null ? firstRef : firstRef} />
    </CookScreen>
  );
};
