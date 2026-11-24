import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import { getActiveHelper } from '../utils/activeHelper';
import { CookScreen, GestureHint, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, say } from './PlayKit';

/**
 * Кубик-ходилка: дорожка из 20 клеточек змейкой до замка. Бросаешь кубик (Зуба называет число точек),
 * потом сам прыгаешь фишкой — нажатие = шаг, каждый шаг считается вслух, точки на кубике гаснут.
 * Звёздочка — ещё два шага. Потом ходит помощник (сам). Кто первым до замка — тот молодец, в конце праздник.
 */

const CELLS = 20;
const STARS = new Set([4, 9, 13, 17]);
const CELL_BG = ['#FDE68A', '#FBCFE8', '#BFDBFE', '#BBF7D0', '#DDD6FE'];
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

/** дорожка: камушки по извилистой тропинке снизу слева к замку справа вверху (доли ширины/высоты поля) */
const PATH: [number, number][] = [
  [0.09, 0.88], [0.23, 0.92], [0.38, 0.9], [0.53, 0.86], [0.68, 0.88], [0.83, 0.83], [0.91, 0.7],
  [0.83, 0.58], [0.68, 0.56], [0.53, 0.6], [0.38, 0.58], [0.23, 0.53], [0.12, 0.42],
  [0.17, 0.29], [0.31, 0.23], [0.46, 0.27], [0.61, 0.3], [0.75, 0.25], [0.84, 0.15], [0.7, 0.07],
];
const BOARD_ASPECT = 1.05; // ширина / высота
const STONE = 0.11; // диаметр камушка в долях ширины
const DECOR: [number, number, string][] = [
  [0.06, 0.66, '🌳'], [0.94, 0.95, '🌷'], [0.5, 0.73, '🌼'], [0.95, 0.45, '🌳'], [0.3, 0.4, '🍄'],
  [0.05, 0.15, '🌲'], [0.55, 0.12, '🌸'], [0.93, 0.28, '🌻'], [0.68, 0.43, '🌷'], [0.3, 0.08, '🦋'],
];

const Die: React.FC<{ v: number; used: number; rolling: boolean; size: string }> = ({ v, used, rolling, size }) => (
  <div className={`relative rounded-[22%] bg-white ${rolling ? 'animate-[diceRoll_.25s_linear_infinite]' : ''}`}
    style={{ width: size, height: size, boxShadow: 'inset 0 -6px 0 #CBD5E1, 0 8px 18px rgba(0,0,0,.3)', border: '3px solid #E2E8F0' }}>
    {v > 0 && PIPS[v].map(([x, y], i) => (
      <span key={i} className="absolute rounded-full transition-colors" style={{
        left: `${x}%`, top: `${y}%`, width: '18%', height: '18%', transform: 'translate(-50%,-50%)',
        background: !rolling && i < used ? '#CBD5E1' : '#1E293B',
      }} />
    ))}
  </div>
);

export const DiceGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const helper = getActiveHelper();
  const [runKey, setRunKey] = useState(0);
  const [pos, setPos] = useState<[number, number]>([0, 0]); // [ребёнок, помощник]
  const [turn, setTurn] = useState<0 | 1>(0);
  const [die, setDie] = useState(0);
  const [used, setUsed] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [phase, setPhase] = useState<'roll' | 'hop' | 'wait' | 'done'>('roll');
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dieRef = useRef<HTMLButtonElement>(null);
  const pieceRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef<[number, number]>([0, 0]);
  const timers = useRef<number[]>([]);
  const portrait = window.innerHeight > window.innerWidth * 1.15;
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)); };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => { say('dk_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [runKey]);

  const setP = (who: 0 | 1, v: number) => {
    const n: [number, number] = [...posRef.current] as [number, number]; n[who] = v; posRef.current = n; setPos(n);
  };
  const cellCenter = (k: number) => {
    const r = boardRef.current?.getBoundingClientRect(); if (!r) return null;
    const [x, y] = PATH[k];
    return { x: r.left + x * r.width, y: r.top + y * r.height };
  };

  // бросок
  const roll = (who: 0 | 1) => {
    setRolling(true); setUsed(0);
    soundEngine.playGamePop(soundEnabled, 2);
    let t = 0;
    const spin = () => { setDie(1 + Math.floor(Math.random() * 6)); t++; if (t < 7) later(90, spin); };
    spin();
    later(750, () => {
      const v = 1 + Math.floor(Math.random() * 6);
      setDie(v); setRolling(false);
      playVoice(`d_${v}`, soundEnabled, undefined, 'replace');
      if (who === 0) { setPhase('hop'); later(900, () => say('dk_hop', soundEnabled)); }
      else autoHop(v, 0);
    });
  };

  // один шаг; после всех шагов — звёздочка/финиш/передача хода
  const hop = (who: 0 | 1, k: number, total: number): false | 'end' | 'finish' => {
    const next = Math.min(CELLS - 1, posRef.current[who] + 1);
    setP(who, next); setUsed(k);
    soundEngine.playGamePop(soundEnabled, 3 + (k % 5));
    playVoice(`d_${k}`, soundEnabled, undefined, 'replace');
    if (next >= CELLS - 1) { finish(who); return 'finish'; }
    if (k >= total) { landed(who); return 'end'; }
    return false;
  };
  const landed = (who: 0 | 1) => {
    const p = posRef.current[who];
    if (STARS.has(p)) {
      later(700, () => {
        say('dk_star', soundEnabled);
        const c = cellCenter(p); if (c) sparkleBurst(c.x, c.y, 14);
        later(1600, () => { setP(who, Math.min(CELLS - 1, p + 2)); soundEngine.playGameReward(soundEnabled); if (p + 2 >= CELLS - 1) { finish(who); return; } later(900, () => passTurn(who)); });
      });
    } else later(800, () => passTurn(who));
  };
  const passTurn = (who: 0 | 1) => {
    if (who === 0) { setTurn(1); setPhase('wait'); say('dk_my', soundEnabled); later(1800, () => roll(1)); }
    else { setTurn(0); setPhase('roll'); setDie(0); say('dk_roll', soundEnabled); }
  };
  const autoHop = (v: number, k: number) => {
    later(700, () => { const end = hop(1, k + 1, v); if (!end) autoHop(v, k + 1); });
  };
  const finish = (who: 0 | 1) => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
    setPhase('done'); setWinner(who);
    soundEngine.playGameReward(soundEnabled);
    const c = cellCenter(CELLS - 1); if (c) sparkleBurst(c.x, c.y, 24);
    later(600, () => say('dk_win', soundEnabled));
  };

  const tapPiece = () => {
    if (phase !== 'hop' || turn !== 0) return;
    const k = used + 1;
    if (k > die) return;
    const end = hop(0, k, die);
    if (end === 'end') setPhase('wait');
  };

  const restart = () => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
    posRef.current = [0, 0]; setPos([0, 0]); setTurn(0); setDie(0); setUsed(0); setPhase('roll'); setWinner(null); setRunKey((k) => k + 1);
  };

  const hintOn = useStepHint(`${phase}-${turn}-${used}`, 3000, 8000, (phase === 'roll' || phase === 'hop') && turn === 0);
  const [showWin, setShowWin] = useState(false);
  useEffect(() => { if (phase === 'done') { const t = window.setTimeout(() => setShowWin(true), 2600); return () => window.clearTimeout(t); } setShowWin(false); }, [phase]);

  if (showWin) {
    return (
      <CookScreen stepKey="done" stepIdx={1} total={1} done={false} bg="linear-gradient(#FEF3C7, #FDE68A)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="text-[min(9vmin,64px)]">{winner === 0 ? '🏆' : '🤝'}</div>
        </Celebrate>
      </CookScreen>
    );
  }

  const BW = portrait ? 'min(94vw, 520px)' : 'min(100vmin, 760px)';
  const piece = (who: 0 | 1) => {
    const [px, py] = PATH[pos[who]];
    const same = pos[0] === pos[1];
    const dx = same ? (who === 0 ? -0.035 : 0.035) : 0;
    const img = who === 0
      ? <HeroFace hero={character} emotion="joy" size="100%" />
      : <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-white shadow-xl bg-[#FEF3C7]"><img src={`/assets/princess/helpers/${helper}.webp`} alt="" className="w-full h-full object-contain" /></div>;
    return (
      <button key={who} ref={who === 0 ? pieceRef : undefined} type="button" aria-label={who === 0 ? 'Моя фишка' : 'Фишка помощника'} onClick={who === 0 ? tapPiece : undefined}
        className="absolute transition-all duration-300 ease-out" style={{
          left: `${(px + dx) * 100}%`, top: `${py * 100}%`, width: `${STONE * 1.05 * 100}%`, aspectRatio: '1',
          transform: 'translate(-50%,-78%)', zIndex: 5 + (turn === who ? 2 : 0),
          filter: turn === who && phase !== 'done' ? 'drop-shadow(0 0 10px #FDE047)' : 'none',
        }}>
        <div className={`w-full h-full ${who === 0 && phase === 'hop' ? 'animate-[bob_0.8s_ease-in-out_infinite]' : ''}`}>{img}</div>
      </button>
    );
  };

  return (
    <CookScreen stepKey="board" stepIdx={0} total={1} done={false} bg="linear-gradient(#BBF7D0, #86EFAC)">
      <div className={`flex ${portrait ? 'flex-col' : 'flex-row'} items-center justify-center gap-[3vmin] w-full h-full`}>
        {/* поле */}
        <div ref={boardRef} className="relative shrink-0 rounded-[2rem] overflow-visible" style={{ width: BW, aspectRatio: `${BOARD_ASPECT}`, background: 'radial-gradient(ellipse at 50% 50%, #BBF7D0, #86EFAC 70%, #4ADE80)', boxShadow: 'inset 0 0 30px rgba(22,101,52,.25)' }}>
          {/* тропинка */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 100 ${100 / BOARD_ASPECT}`} preserveAspectRatio="none">
            {[['#D6A66A', 9.5], ['#F5DEB3', 7.5]].map(([c, w]) => (
              <polyline key={c as string} points={PATH.map(([x, y]) => `${x * 100},${(y * 100) / BOARD_ASPECT}`).join(' ')} fill="none" stroke={c as string} strokeWidth={w as number} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
          {DECOR.map(([x, y, e], i) => <span key={i} className="absolute pointer-events-none" style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translate(-50%,-50%)', fontSize: 'min(6vmin, 40px)' }}>{e}</span>)}
          {PATH.map(([x, y], k) => {
            const last = k === CELLS - 1;
            const star = STARS.has(k);
            return (
              <div key={k} className="absolute flex items-center justify-center rounded-full" style={{
                left: `${x * 100}%`, top: `${y * 100}%`, width: `${(last ? STONE * 1.7 : STONE) * 100}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)',
                background: last ? 'transparent' : k === 0 ? 'radial-gradient(circle at 35% 30%, #FEF08A, #F59E0B)' : star ? 'radial-gradient(circle at 35% 30%, #FEF9C3, #FACC15)' : 'radial-gradient(circle at 35% 30%, #FFFFFF, ' + CELL_BG[k % CELL_BG.length] + ')',
                boxShadow: last ? 'none' : '0 4px 0 rgba(120,80,30,.35), 0 6px 8px rgba(0,0,0,.15)', border: last ? 'none' : '2px solid rgba(255,255,255,.9)',
              }}>
                {last ? <span className="leading-none" style={{ fontSize: 'min(13vmin, 92px)' }}>🏰</span>
                  : star ? <span className="leading-none" style={{ fontSize: 'min(5vmin, 34px)' }}>⭐</span>
                  : <span className="font-black text-[#475569] leading-none" style={{ fontSize: k === 0 ? 'min(2.6vmin, 18px)' : 'min(4vmin, 28px)' }}>{k === 0 ? 'СТАРТ' : k}</span>}
              </div>
            );
          })}
          {piece(1)}
          {piece(0)}
        </div>

        {/* кубик и чей ход */}
        <div className={`flex ${portrait ? 'flex-row' : 'flex-col'} items-center gap-[3vmin]`}>
          <div className="flex items-center gap-[1.5vmin] rounded-full bg-white/80 px-[2vmin] py-[1vmin] shadow">
            {turn === 0
              ? <HeroFace hero={character} emotion="curious" size="min(10vmin, 70px)" />
              : <img src={`/assets/princess/helpers/${helper}.webp`} alt="" className="w-[min(10vmin,70px)] h-[min(10vmin,70px)] object-contain" />}
            <span className="text-[min(7vmin,48px)]">{turn === 0 ? (phase === 'hop' ? '👆' : '🎲') : '⏳'}</span>
          </div>
          <button ref={dieRef} type="button" aria-label="Кубик" onClick={() => { if (phase === 'roll' && turn === 0 && !rolling) roll(0); }}
            className={`active:scale-90 transition-transform ${phase === 'roll' && turn === 0 ? 'animate-[bob_1s_ease-in-out_infinite]' : ''}`}>
            <Die v={die || 6} used={phase === 'hop' || turn === 1 ? used : 0} rolling={rolling} size={portrait ? 'min(24vw, 130px)' : 'min(20vmin, 150px)'} />
          </button>
        </div>
      </div>
      <GestureHint show={hintOn} kind="tap" target={phase === 'hop' ? pieceRef : dieRef} />
    </CookScreen>
  );
};
