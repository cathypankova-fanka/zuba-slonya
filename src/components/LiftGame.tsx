import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import { CookScreen, GestureHint, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, HeroFace, say, shuffle } from './PlayKit';

/**
 * Лифт в замке: башня на 9 этажей, кабинка в шахте и пульт с кнопками 1–9.
 * «Отвези»: пассажир в кабинке просит «мне на этаж N» — жмём кнопку N, лифт едет, этажи считаются вслух.
 * «Забери»: кто-то машет на этаже N — едем туда, пассажир входит, теперь вниз — кнопка 1.
 */

const FLOORS = 9;
type Task = { kind: 'deliver'; hero: CharacterItem; to: number } | { kind: 'pickup'; hero: CharacterItem; from: number };
const ROOM_BG = ['#FDE68A', '#FBCFE8', '#BFDBFE', '#BBF7D0', '#DDD6FE', '#FED7AA', '#A5F3FC', '#FECACA', '#E9D5FF'];
const ROOM_DECOR = ['🛋️', '🧸', '📚', '🪴', '🎨', '🛏️', '🎹', '🍰', '👑'];
const SEC_PER_FLOOR = 0.75;

const makeTasks = (exceptId: string): Task[] => {
  const heroes = shuffle(CHARACTERS.filter((c) => c.id !== exceptId)).slice(0, 5);
  const floors = shuffle([2, 3, 4, 5, 6, 7, 8, 9]);
  return [
    { kind: 'deliver', hero: heroes[0], to: floors[0] },
    { kind: 'pickup', hero: heroes[1], from: floors[1] },
    { kind: 'deliver', hero: heroes[2], to: floors[2] },
    { kind: 'pickup', hero: heroes[3], from: floors[3] },
    { kind: 'deliver', hero: heroes[4], to: floors[4] },
  ];
};

export const LiftGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const tasks = useMemo(() => makeTasks(character.id), [runKey, character.id]);
  const [ti, setTi] = useState(0);
  const [floor, setFloor] = useState(1); // где кабинка (по окончании поездки)
  const [target, setTarget] = useState(1); // куда едет (для анимации)
  const [moving, setMoving] = useState(false);
  const [doors, setDoors] = useState(true); // двери открыты
  const [inCabin, setInCabin] = useState<CharacterItem | null>(null);
  const [rooms, setRooms] = useState<Record<number, CharacterItem[]>>({});
  const [pickedUp, setPickedUp] = useState(false); // для «забери»: пассажир уже в кабинке
  const [pressed, setPressed] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const [travelSecs, setTravelSecs] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const towerRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const task = tasks[ti];
  const done = ti >= tasks.length;
  const portrait = window.innerHeight > window.innerWidth * 1.15;

  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)); };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // куда сейчас нужно ехать
  const goal = !task ? 1 : task.kind === 'deliver' ? task.to : pickedUp ? 1 : task.from;

  const announce = (t: Task, picked: boolean) => {
    if (t.kind === 'deliver') { say('li_want', soundEnabled); playVoice(`d_${t.to}`, soundEnabled); }
    else if (!picked) { say('li_wait', soundEnabled); playVoice(`d_${t.from}`, soundEnabled); }
    else say('li_down', soundEnabled);
  };

  // начало задания
  useEffect(() => {
    if (done) return;
    setPickedUp(false);
    if (task.kind === 'deliver') { setInCabin(task.hero); }
    if (ti === 0) say('li_start', soundEnabled);
    announce(task, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ti, runKey]);

  const press = (n: number) => {
    if (done || busy.current || moving) return;
    setPressed(n);
    soundEngine.playGamePop(soundEnabled, 3 + n);
    if (n !== goal) {
      setShake((s) => s + 1);
      later(350, () => setPressed(null));
      if (n === floor) return;
      say('li_wrong', soundEnabled); playVoice(`d_${goal}`, soundEnabled);
      return;
    }
    if (n === floor) { arrive(n); return; }
    // поехали: двери закрываются, кабинка едет, этажи считаются вслух
    busy.current = true;
    setDoors(false);
    const dist = Math.abs(n - floor);
    const dir = n > floor ? 1 : -1;
    later(500, () => {
      setMoving(true); setTravelSecs(dist * SEC_PER_FLOOR); setTarget(n);
      for (let k = 1; k <= dist; k++) {
        const f = floor + dir * k;
        later(k * SEC_PER_FLOOR * 1000, () => { playVoice(`d_${f}`, soundEnabled, undefined, 'replace'); soundEngine.playGamePop(soundEnabled, 2); });
      }
      later(dist * SEC_PER_FLOOR * 1000 + 150, () => { setMoving(false); setFloor(n); arrive(n); });
    });
  };

  const arrive = (n: number) => {
    busy.current = true;
    setDoors(true); setPressed(null);
    soundEngine.playGameReward(soundEnabled);
    const r = towerRef.current?.getBoundingClientRect();
    if (r) sparkleBurst(r.left + r.width * 0.2, r.top + r.height * (1 - (n - 0.5) / FLOORS), 12);
    if (task.kind === 'deliver' || pickedUp) {
      // пассажир выходит в комнату
      later(700, () => {
        const hero = task.hero;
        setInCabin(null);
        setRooms((rm) => ({ ...rm, [n]: [...(rm[n] ?? []), hero] }));
        say('li_here', soundEnabled);
      });
      later(2400, () => { busy.current = false; setTi((i) => i + 1); });
    } else {
      // «забери»: пассажир входит в кабинку, теперь вниз
      later(700, () => { setInCabin(task.hero); setPickedUp(true); announce(task, true); busy.current = false; });
    }
  };

  const restart = () => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
    busy.current = false; setTi(0); setFloor(1); setTarget(1); setRooms({}); setInCabin(null); setDoors(true); setMoving(false); setRunKey((k) => k + 1);
  };

  const hintOn = useStepHint(`${ti}-${pickedUp}-${floor}`, 3500, 9000, !done && !moving);

  if (done) {
    return (
      <CookScreen stepKey="done" stepIdx={tasks.length} total={tasks.length} done={false} bg="linear-gradient(#E0E7FF, #C7D2FE)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="flex gap-[1vmin]">{tasks.map((t) => <HeroFace key={t.hero.id} hero={t.hero} emotion="joy" size="min(11vmin, 80px)" />)}</div>
        </Celebrate>
      </CookScreen>
    );
  }

  const TOWER_H = portrait ? 'min(74vh, 150vw)' : 'min(80vh, 120vmin)';
  const TOWER_W = portrait ? 'min(46vw, 380px)' : `calc(${TOWER_H} * 0.62)`;
  const cabFloor = moving ? target : floor;
  const waiting = task.kind === 'pickup' && !pickedUp ? task : null;

  return (
    <CookScreen stepKey={`t${ti}`} stepIdx={ti} total={tasks.length} done={false}
      bg="linear-gradient(#BAE6FD 0%, #E0F2FE 70%, #86EFAC 70%, #4ADE80 100%)">
      <div className="flex items-center justify-center gap-[3vmin] w-full h-full">
        {/* башня */}
        <div ref={towerRef} className="relative shrink-0" style={{ width: TOWER_W, height: TOWER_H }}>
          {/* крыша с флажком */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[7%] w-[110%] h-[8%]" style={{ background: '#7C3AED', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
          <span className="absolute left-1/2 -translate-x-1/2 -top-[12%] text-[min(6vmin,40px)]">🚩</span>
          <div className="absolute inset-0 rounded-b-xl overflow-hidden shadow-2xl" style={{ background: '#E7D7B8', border: '5px solid #A8926A' }}>
            {Array.from({ length: FLOORS }).map((_, i) => {
              const n = i + 1;
              const who = rooms[n] ?? [];
              return (
                <div key={n} className="absolute left-0 right-0 flex" style={{ bottom: `${(i / FLOORS) * 100}%`, height: `${100 / FLOORS}%`, borderTop: '3px solid #A8926A' }}>
                  {/* номер этажа у шахты */}
                  <div className="w-[13%] flex items-center justify-center font-black text-[#78350F]" style={{ fontSize: 'min(3.6vmin, 26px)', background: n === goal ? '#FDE047' : 'transparent', transition: 'background .3s' }}>{n}</div>
                  {/* шахта */}
                  <div className="w-[27%] h-full" style={{ background: 'repeating-linear-gradient(90deg, #64748B 0 3px, #94A3B8 3px 14px)' }} />
                  {/* комната */}
                  <div className="flex-1 h-full flex items-end justify-around px-[3%] relative" style={{ background: ROOM_BG[i] }}>
                    <span className="absolute left-[6%] top-[12%] text-[min(3.4vmin,24px)] opacity-80">{ROOM_DECOR[i]}</span>
                    <span className="absolute right-[6%] top-[14%] w-[16%] h-[42%] rounded-t-full" style={{ background: '#93C5FD', border: '3px solid #fff' }} />
                    <div className="flex items-end gap-[3%] h-[86%]">
                      {who.map((h) => <div key={h.id} className="animate-pop-in"><HeroFace hero={h} emotion="joy" size={`calc(${TOWER_H} / ${FLOORS} * 0.78)`} /></div>)}
                      {waiting && waiting.from === n && (
                        <div className="relative animate-[bob_1s_ease-in-out_infinite]">
                          <HeroFace hero={waiting.hero} emotion="curious" size={`calc(${TOWER_H} / ${FLOORS} * 0.8)`} />
                          <span className="absolute -top-[30%] -right-[30%] text-[min(4vmin,28px)]">🙋</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* кабинка */}
            <div className="absolute left-[13%] w-[27%] p-[1%]" style={{
              height: `${100 / FLOORS}%`, bottom: `${((cabFloor - 1) / FLOORS) * 100}%`,
              transition: `bottom ${moving ? travelSecs : 0.3}s ease-in-out`,
            }}>
              <div className="relative w-full h-full rounded-md overflow-hidden" style={{ background: 'linear-gradient(#FDE68A, #F59E0B)', border: '3px solid #B45309', boxShadow: '0 0 12px rgba(250,204,21,.8)' }}>
                {inCabin && <div className="absolute inset-0 flex items-center justify-center"><HeroFace hero={inCabin} emotion="curious" size="86%" /></div>}
                {/* двери */}
                <div className="absolute inset-y-0 left-0 bg-[#CBD5E1] border-r border-[#64748B] transition-all duration-500" style={{ width: doors ? '0%' : '50%' }} />
                <div className="absolute inset-y-0 right-0 bg-[#CBD5E1] border-l border-[#64748B] transition-all duration-500" style={{ width: doors ? '0%' : '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* пассажир и пульт */}
        <div className="flex flex-col items-center gap-[2.5vmin]">
          <div className="flex items-center gap-[1.5vmin]">
            {(inCabin ?? waiting?.hero) && <HeroFace hero={(inCabin ?? waiting!.hero)} emotion="curious" size="min(13vmin, 96px)" />}
            <div className="rounded-[1.5rem] bg-white shadow-lg px-[2vmin] py-[1vmin] flex items-center gap-[1vmin]">
              <span className="text-[min(6vmin,40px)]">{goal === 1 && pickedUp ? '⬇️' : task.kind === 'pickup' && !pickedUp ? '🙋' : '⬆️'}</span>
              <span className="font-black text-[#7C3AED] leading-none" style={{ fontSize: 'min(12vmin, 88px)' }}>{goal}</span>
            </div>
          </div>
          <div ref={panelRef} key={shake} className={`grid grid-cols-3 gap-[1.6vmin] rounded-[1.6rem] p-[2vmin] shadow-2xl ${shake ? 'animate-[shakeX_.35s]' : ''}`}
            style={{ background: 'linear-gradient(#94A3B8, #475569)', border: '4px solid #CBD5E1' }}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => (
              <button key={n} type="button" aria-label={String(n)} onClick={() => press(n)}
                className="rounded-full font-black flex items-center justify-center active:scale-90 transition-all"
                style={{
                  width: portrait ? 'min(12vw, 70px)' : 'min(11vmin, 84px)', height: portrait ? 'min(12vw, 70px)' : 'min(11vmin, 84px)',
                  fontSize: portrait ? 'min(7vw, 40px)' : 'min(6.5vmin, 48px)',
                  background: pressed === n || (moving && target === n) ? 'radial-gradient(circle, #FEF9C3, #FACC15)' : 'radial-gradient(circle at 40% 35%, #F8FAFC, #CBD5E1)',
                  color: '#1E293B', boxShadow: pressed === n || (moving && target === n) ? '0 0 16px #FDE047' : 'inset 0 -4px 0 rgba(0,0,0,.25), 0 3px 6px rgba(0,0,0,.3)',
                }}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <GestureHint show={hintOn} kind="tap" target={panelRef} />
    </CookScreen>
  );
};
