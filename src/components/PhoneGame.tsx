import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS, CharacterItem } from '../data/characters';
import { emotionUrl, hasEmotion } from '../data/emotionAssets';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { CookScreen, GestureHint, useStepHint } from './CookKit';
import { randomHero } from './PlayKit';

/**
 * Телефон: звонок — на экране только тень звонящего, телефон дрожит и звенит.
 * Нажми зелёную трубочку — появляется герой и здоровается. Цифры можно нажимать: каждая называется.
 */

type State = 'idle' | 'ringing' | 'talking' | 'calling';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];
const KEY_COLORS = ['#FF5C8A', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5', '#FF5C8A', '#FF9F43', '#FFD93D', '', '#6BCB77', ''];

export const PhoneGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [state, setState] = useState<State>('idle');
  const [caller, setCaller] = useState<CharacterItem>(() => randomHero(CHARACTERS, character.id));
  const [typed, setTyped] = useState('');
  const greenRef = useRef<HTMLButtonElement>(null);
  const redRef = useRef<HTMLButtonElement>(null);
  const ringTimer = useRef<number | null>(null);
  const callTimer = useRef<number | null>(null);
  const firstRing = useRef(true);

  const stopRing = () => { if (ringTimer.current) { window.clearInterval(ringTimer.current); ringTimer.current = null; } };
  const ring = () => {
    stopRing();
    let k = 0;
    ringTimer.current = window.setInterval(() => {
      // «дзынь-дзынь»: две короткие ноты, пауза
      const ph = k % 6;
      if (ph === 0 || ph === 1) soundEngine.playGamePop(soundEnabled, 8 + (ph % 2) * 2);
      k++;
    }, 160);
  };
  const incoming = () => {
    setCaller(randomHero(CHARACTERS, character.id));
    setTyped('');
    setState('ringing');
    ring();
    if (firstRing.current) { firstRing.current = false; window.setTimeout(() => playVoice('ph_ring', soundEnabled), 900); }
  };
  useEffect(() => {
    callTimer.current = window.setTimeout(incoming, 1800);
    return () => { stopRing(); if (callTimer.current) window.clearTimeout(callTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = () => {
    if (state === 'ringing') {
      stopRing();
      soundEngine.playGameOk(soundEnabled);
      setState('talking');
    } else if (state === 'idle') {
      // звоним сами: «ту-ту… ту-ту…», потом друг отвечает
      setCaller(randomHero(CHARACTERS, character.id));
      setState('calling');
      [0, 900, 1800].forEach((t) => window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 2), t));
      window.setTimeout(() => setState((s) => {
        if (s !== 'calling') return s;
        soundEngine.playGameOk(soundEnabled);
        return 'talking';
      }), 2600);
    }
  };
  useEffect(() => {
    if (state === 'talking') {
      const t = window.setTimeout(() => playVoice(`call_${caller.id}`, soundEnabled, undefined, 'replace'), 50);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === 'talking' ? caller.id : '']);
  const hangUp = () => {
    if (state === 'idle') { setTyped(''); return; }
    stopRing();
    soundEngine.playGamePop(soundEnabled, 1);
    setState('idle');
    setTyped('');
    if (callTimer.current) window.clearTimeout(callTimer.current);
    callTimer.current = window.setTimeout(() => whenVoiceIdle(incoming), 6000);
  };
  const press = (k: string) => {
    if (!k) return;
    soundEngine.playGamePop(soundEnabled, 3 + Number(k) % 7);
    playVoice(`d_${k}`, soundEnabled, undefined, 'replace');
    if (state === 'idle') setTyped((t) => (t + k).slice(-8));
  };

  const hint = useStepHint(state, 3500, 7000, state === 'ringing' || state === 'talking');
  const imgSrc = hasEmotion(caller.id, 'joy') ? emotionUrl(caller.id, 'joy') : caller.imageSrc;
  const W = 'min(50vmin, 400px)';

  return (
    <CookScreen stepKey="phone" stepIdx={0} total={0} bg="radial-gradient(circle at 50% 30%, #FFFDF5 0%, #FDE7C8 60%, #F9C98F 100%)">
      <div className={`relative rounded-[3.2rem] p-[2.4vmin] shadow-2xl ${state === 'ringing' ? 'animate-[wiggle_0.25s_infinite]' : ''}`}
        style={{ width: W, background: 'linear-gradient(160deg, #F472B6, #A855F7)', boxShadow: '0 20px 40px rgba(120,40,140,.35), inset 0 4px 0 rgba(255,255,255,.4)' }}>
        {/* динамик */}
        <div className="mx-auto mb-[1.6vmin] h-[1.2vmin] w-[28%] rounded-full bg-[#581C87]/60" />
        {/* экран */}
        <div className="relative rounded-[2rem] overflow-hidden flex items-center justify-center" style={{ height: `calc(${W} * 0.56)`, background: state === 'idle' ? 'linear-gradient(#0F172A,#1E293B)' : 'linear-gradient(#BAE6FD,#E0F2FE)' }}>
          {state === 'idle' && (
            <div className="text-white/90 font-bold tracking-[0.2em]" style={{ fontSize: 'min(9vmin, 72px)' }}>{typed || '📞'}</div>
          )}
          {(state === 'ringing' || state === 'calling') && (
            <div className="flex flex-col items-center">
              <div className="relative rounded-full overflow-hidden" style={{ width: `calc(${W} * 0.4)`, height: `calc(${W} * 0.4)` }}>
                <img src={caller.imageSrc} alt="" draggable={false} className="w-full h-full object-cover object-top"
                  style={{ filter: 'brightness(.18) saturate(0) blur(4px)', transform: 'scale(1.1)' }} />
                <span className="absolute inset-0 flex items-center justify-center font-black text-white/85 animate-pulse" style={{ fontSize: `calc(${W} * 0.2)` }}>?</span>
              </div>
              <div className="mt-[1vmin]" style={{ fontSize: 'min(7vmin, 56px)' }}>{state === 'ringing' ? '🔔' : '📞'}</div>
            </div>
          )}
          {state === 'talking' && (
            <div className="flex flex-col items-center animate-pop-in">
              <div className="rounded-full overflow-hidden border-[5px] border-white shadow-xl" style={{ width: `calc(${W} * 0.4)`, height: `calc(${W} * 0.4)`, background: caller.accentBg }}>
                <img src={imgSrc} alt="" draggable={false} className="w-full h-full object-cover object-top" style={{ animation: 'bob 1.2s ease-in-out infinite' }} />
              </div>
              <div className="mt-[1vmin]" style={{ fontSize: 'min(6vmin, 48px)' }}>👋</div>
            </div>
          )}
          {state === 'ringing' && [0, 1, 2].map((k) => (
            <span key={k} className="absolute inset-[10%] rounded-full border-4 border-white/60 animate-ping" style={{ animationDelay: `${k * 0.35}s` }} />
          ))}
        </div>
        {/* кнопки */}
        <div className="grid grid-cols-3 gap-[1.4vmin] mt-[2vmin]">
          {KEYS.map((k, i) => k ? (
            <button key={i} type="button" aria-label={`цифра ${k}`} onClick={() => press(k)}
              className="rounded-[1.4rem] font-black text-white active:scale-90 transition-transform"
              style={{ height: `calc(${W} * 0.15)`, fontSize: `calc(${W} * 0.09)`, background: KEY_COLORS[i], boxShadow: '0 5px 0 rgba(0,0,0,.18), inset 0 3px 0 rgba(255,255,255,.4)', textShadow: '0 2px 0 rgba(0,0,0,.15)' }}>{k}</button>
          ) : <span key={i} />)}
        </div>
        <div className="flex justify-between mt-[2vmin] px-[4%]">
          <button ref={greenRef} type="button" aria-label="Зелёная трубка" onClick={answer}
            className={`rounded-full bg-[#22C55E] flex items-center justify-center active:scale-90 transition-transform ${state === 'ringing' ? 'animate-bounce' : ''}`}
            style={{ width: `calc(${W} * 0.22)`, height: `calc(${W} * 0.22)`, boxShadow: '0 6px 0 #15803D' }}>
            <svg viewBox="0 0 24 24" className="w-[55%] h-[55%]" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" /></svg>
          </button>
          <button ref={redRef} type="button" aria-label="Красная трубка" onClick={hangUp}
            className="rounded-full bg-[#EF4444] flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: `calc(${W} * 0.22)`, height: `calc(${W} * 0.22)`, boxShadow: '0 6px 0 #B91C1C' }}>
            <svg viewBox="0 0 24 24" className="w-[55%] h-[55%] rotate-[135deg]" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" /></svg>
          </button>
        </div>
      </div>
      <GestureHint show={hint} kind="tap" target={state === 'ringing' ? greenRef : redRef} />
    </CookScreen>
  );
};
