import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { FACE_ART_MASKS, faceArtMaskToDataUrl } from '../data/faceArtMasks';
import { soundEngine } from '../utils/soundEngine';
import { getFaceMaskAssetUrl, getWashMessAssetUrl } from '../utils/itemAssets';
import { sayRandom } from '../utils/voice';
import { ArtPalette, ArtTool, DoneButton, RAINBOW, usePaint, usePhoto } from './ArtKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { say, shuffle, useReveal, useSteps } from './PlayKit';

/**
 * Аквагрим «Волшебное зеркало»: выбрать узор → умыть личико → раскрасить узор своими красками →
 * дорисовать кисточками и штампами → нарядиться (шляпы, очки, серёжки…) → фото в зеркале.
 */

const STEPS = ['pick', 'wash', 'paint', 'draw', 'dress', 'mirror'] as const;
const VOICES = { pick: 'fm_pick', wash: 'fm_wash', paint: 'fm_paint2', draw: 'fm_draw', dress: 'fm_dress', mirror: 'fm_mirror' };
const BG = 'radial-gradient(circle at 50% 35%, #FFF7FB 0%, #FCE7F3 50%, #E9D5FF 100%)';
const TOOLS: ArtTool[] = ['brush', 'heart', 'star', 'flower', 'butterfly', 'dots', 'blush', 'sun', 'moon'];

type Slot = 'hat' | 'eyes' | 'nose' | 'neck' | 'ears' | 'clip';
const ACC: { id: string; slot: Slot }[] = [
  ...['crown', 'tiara', 'flower_crown', 'party_hat', 'wizard_hat', 'pirate_hat', 'cowboy_hat', 'bunny_ears', 'unicorn_horn', 'bear_hat', 'frog_hat', 'chef_hat', 'hat_viking', 'hat_santa', 'sun_hat', 'beanie_pom', 'cap_baseball', 'beret', 'hat_crown_flower', 'headphones'].map((id) => ({ id, slot: 'hat' as Slot })),
  ...['glasses_heart', 'glasses_rainbow', 'glasses_sun', 'glasses_cat', 'glasses_round', 'glasses_pixel', 'mask_domino'].map((id) => ({ id, slot: 'eyes' as Slot })),
  ...['mustache', 'cat_whiskers'].map((id) => ({ id, slot: 'nose' as Slot })),
  ...['bowtie', 'necklace', 'scarf'].map((id) => ({ id, slot: 'neck' as Slot })),
  ...['earring_star', 'earring_heart', 'earring_gem', 'earring_flower', 'earring_cherry', 'earring_butterfly', 'earring_moon', 'earring_hoop'].map((id) => ({ id, slot: 'ears' as Slot })),
  ...['bow', 'hairclip_heart', 'hairclip_star'].map((id) => ({ id, slot: 'clip' as Slot })),
];
const accSrc = (id: string) => `/assets/items/accessories/${id}.webp`;

const maskSrc = (id: string) => {
  const def = FACE_ART_MASKS.find((m) => m.id === id)!;
  return getFaceMaskAssetUrl(def.id, def.svg);
};

interface Spot { x: number; y: number; r: number; o: number }

export const FaceMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [runKey, setRunKey] = useState(0);
  const choices = useMemo(() => shuffle(FACE_ART_MASKS).slice(0, 6), [runKey]);
  const [maskId, setMaskId] = useState(choices[0].id);
  const def = FACE_ART_MASKS.find((m) => m.id === maskId)!;
  const anchor = character.faceMaskAnchor;
  const makeSpots = (): Spot[] => Array.from({ length: 5 }, () => ({
    x: 0.25 + Math.random() * 0.5, y: anchor.y - 0.15 + Math.random() * 0.3, r: 0.1 + Math.random() * 0.04, o: 1,
  }));
  const [spots, setSpots] = useState<Spot[]>(makeSpots);
  const spotsRef = useRef(spots);
  const [color, setColor] = useState('#FF5CA8');
  const [tool, setTool] = useState<ArtTool>('brush');
  const [maskShot, setMaskShot] = useState('');
  const [drawShot, setDrawShot] = useState('');
  const [worn, setWorn] = useState<Partial<Record<Slot, string>>>({});
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const photoRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const at = (s: (typeof STEPS)[number]) => idx >= STEPS.indexOf(s);

  const rv = useReveal(maskSrc(def.id), step === 'paint', { fallback: faceArtMaskToDataUrl(def.svg), radius: 0.1 });
  const paint = usePaint({ color, tool, soundEnabled, active: step === 'draw', brush: 0.03 });
  const photo = usePhoto(soundEnabled);

  const restart = () => {
    const ns = makeSpots(); spotsRef.current = ns;
    setRunKey((k) => k + 1); setSpots(ns); setWorn({}); setMaskShot(''); setDrawShot(''); paint.clear(); photo.reset(); finished.current = false; restartSteps();
  };
  useEffect(() => { setMaskId(choices[0].id); }, [choices]);
  useEffect(() => { finished.current = false; if (step === 'draw') setTool('brush'); }, [step]);
  useEffect(() => {
    if (!photo.taken) return;
    const t = window.setTimeout(() => sayRandom('win', 6, soundEnabled), 1200);
    return () => window.clearTimeout(t);
  }, [photo.taken, soundEnabled]);

  const local = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const rubAt = (e: React.PointerEvent) => {
    if (doneFx) return;
    const p = local(e);
    setFinger(p);
    if (step === 'wash') {
      if (spotsRef.current.every((sp) => sp.o <= 0)) return;
      let changed = false;
      const ns = spotsRef.current.map((sp) => {
        if (sp.o <= 0 || Math.hypot(sp.x - p.x, (sp.y - p.y) * 1.33) > sp.r + 0.06) return sp;
        changed = true;
        return { ...sp, o: Math.max(0, sp.o - 0.09) };
      });
      if (changed) {
        spotsRef.current = ns; setSpots(ns);
        if (Math.random() < 0.3) soundEngine.playEraseSwoosh?.(soundEnabled);
        if (ns.every((sp) => sp.o <= 0)) next();
      }
    } else if (step === 'paint') {
      rv.reveal(rv.at(e), color === RAINBOW ? undefined : color);
      if (Math.random() < 0.12) soundEngine.playGamePop(soundEnabled, 3 + Math.floor(Math.random() * 5));
    }
  };

  const putOn = (a: { id: string; slot: Slot }) => {
    if (step !== 'dress') return;
    soundEngine.playGamePop(soundEnabled, 7);
    setWorn((w) => (w[a.slot] === a.id ? { ...w, [a.slot]: undefined } : { ...w, [a.slot]: a.id }));
  };

  // где сидит украшение (в долях портрета 3:4)
  const s = anchor.scale, ay = anchor.y;
  const accStyle = (slot: Slot): React.CSSProperties[] => {
    const one = (x: number, y: number, w: number, ty = -50): React.CSSProperties => ({ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, transform: `translate(-50%, ${ty}%)` });
    switch (slot) {
      case 'hat': return [one(0.5, ay - 0.2 * s, 0.7 * s, -100)];
      case 'eyes': return [one(0.5, ay - 0.03 * s, 0.6 * s)];
      case 'nose': return [one(0.5, ay + 0.1 * s, 0.42 * s)];
      case 'neck': return [one(0.5, ay + 0.36 * s, 0.4 * s)];
      case 'ears': return [one(0.5 - 0.36 * s, ay + 0.1 * s, 0.09 * s), one(0.5 + 0.36 * s, ay + 0.1 * s, 0.09 * s)];
      case 'clip': return [one(0.5 + 0.26 * s, ay - 0.24 * s, 0.17 * s)];
    }
  };

  const H = step === 'paint' || step === 'draw' ? 'min(50vh, 460px)' : 'min(58vh, 520px)';
  const mirror = step === 'mirror';
  const ready = step === 'paint' ? rv.pct > 0.55 : step === 'draw' ? paint.activity >= 5 : step === 'dress' ? Object.values(worn).some(Boolean) : false;
  const goNext = () => {
    if (finished.current || doneFx) return;
    finished.current = true;
    // экран шага пересоздаётся — сохраняем нарисованное картинкой
    if (step === 'paint') setMaskShot(rv.canvasRef.current?.toDataURL() ?? '');
    if (step === 'draw') setDrawShot(paint.snapshot());
    next();
  };

  const stage = (
    <div ref={stageRef} className="relative overflow-hidden select-none"
      style={{ height: H, aspectRatio: '3 / 4', borderRadius: mirror ? '50% / 46%' : '2rem', background: character.accentBg, touchAction: 'none',
        border: mirror ? '14px solid #F5C451' : '6px solid #fff', boxShadow: mirror ? '0 0 0 6px #B7791F, 0 20px 40px rgba(120,60,20,.35)' : '0 16px 30px rgba(0,0,0,.18)' }}
      onPointerDown={(e) => { if (step === 'draw') { paint.bind.onPointerDown(e); return; } try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ } rubAt(e); }}
      onPointerMove={(e) => { if (step === 'draw') { paint.bind.onPointerMove(e); return; } if (e.buttons || e.pointerType === 'touch') rubAt(e); }}
      onPointerUp={() => { paint.bind.onPointerUp(); setFinger(null); }} onPointerCancel={() => { paint.bind.onPointerCancel(); setFinger(null); }}>
      <img src={character.imageSrc} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      {step === 'wash' && spots.map((sp, i) => (
        <img key={i} src={getWashMessAssetUrl('mud') ?? ''} alt="" draggable={false} className="absolute pointer-events-none"
          style={{ left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, width: `${sp.r * 200}%`, transform: 'translate(-50%,-50%)', opacity: sp.o, transition: 'opacity .15s' }} />
      ))}
      {/* узор: раскрашенный холст живёт до конца игры */}
      <div ref={rv.boxRef} className="absolute pointer-events-none"
        style={{ left: '50%', top: `${ay * 100}%`, width: `${def.baseWidthRatio * s * 100}%`, aspectRatio: `${def.aspectRatio}`, transform: 'translate(-50%,-50%)' }}>
        {step === 'paint' && <img src={maskSrc(def.id)} alt="" draggable={false} className="absolute inset-0 w-full h-full" style={{ opacity: 0.22, filter: 'grayscale(1)' }} />}
        {step === 'paint' && <canvas ref={rv.canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.92 }} />}
        {at('draw') && maskShot && <img src={maskShot} alt="" draggable={false} className="absolute inset-0 w-full h-full" style={{ opacity: 0.92 }} />}
      </div>
      {/* свободный рисунок */}
      {step === 'draw' && <canvas ref={paint.canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.88 }} />}
      {at('dress') && drawShot && <img src={drawShot} alt="" draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.88 }} />}
      {/* украшения */}
      {(Object.entries(worn) as [Slot, string | undefined][]).map(([slot, id]) => id && accStyle(slot).map((st, k) => (
        <img key={`${slot}${k}${id}`} src={accSrc(id)} alt="" draggable={false} className="absolute pointer-events-none"
          style={{ ...st, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.25))' }} />
      )))}
      {finger && (step === 'wash' || step === 'paint') && (
        <span className="absolute pointer-events-none" style={{ left: `${finger.x * 100}%`, top: `${finger.y * 100}%`, transform: 'translate(-30%,-70%)', fontSize: `calc(${H} * 0.13)` }}>{step === 'wash' ? '🧽' : '🖌️'}</span>
      )}
      {mirror && [0, 1, 2, 3, 4, 5].map((k) => (
        <span key={k} className="absolute pointer-events-none animate-pulse" style={{ left: `${10 + (k * 37) % 80}%`, top: `${8 + (k * 23) % 80}%`, fontSize: `calc(${H} * 0.06)`, animationDelay: `${k * 0.2}s` }}>✨</span>
      ))}
    </div>
  );

  const hint = useStepHint(`${step}-${ready}-${photo.taken}`, 2400, 7000, step !== 'pick' && !doneFx && !photo.taken);
  let hintKind: HintKind = 'rub';
  let hintTarget: React.RefObject<Element | null> = stageRef;
  if (ready) { hintKind = 'tap'; hintTarget = doneRef; }
  else if (step === 'dress') { hintKind = 'tap'; hintTarget = stageRef; }
  if (mirror) { hintKind = 'tap'; hintTarget = photoRef; }

  const tray = step === 'paint'
    ? <ArtPalette color={color} onColor={setColor} soundEnabled={soundEnabled} />
    : step === 'draw'
      ? <ArtPalette color={color} onColor={setColor} tool={tool} onTool={setTool} tools={TOOLS} soundEnabled={soundEnabled} />
      : step === 'dress'
        ? <LoopScroller>{ACC.map((a) => <Plate key={a.id} src={accSrc(a.id)} label="" selected={worn[a.slot] === a.id} onPick={() => putOn(a)} target={stageRef} onDrop={() => putOn(a)} />)}</LoopScroller>
        : undefined;

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} bg={BG} trayLoop={step === 'dress'}
      recipe={step === 'paint' ? <img src={maskSrc(def.id)} alt="" className="w-[86%] object-contain" /> : undefined}
      tray={tray}>
      {step === 'pick' ? (
        <div className="grid grid-cols-3 gap-[3vmin]">
          {choices.map((m) => (
            <button key={m.id} type="button" aria-label={m.name}
              onClick={() => { setMaskId(m.id); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-[2rem] bg-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 'min(26vmin, 220px)', height: 'min(22vmin, 186px)', background: m.previewBg }}>
              <img src={maskSrc(m.id)} alt="" draggable={false} className="w-[86%] h-[86%] object-contain pointer-events-none" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-[3vmin]">
          <div className={`transition-transform duration-500 ${photo.taken ? 'rotate-[-4deg] p-[1.6vmin] pb-[6vmin] bg-white shadow-2xl rounded-lg' : ''}`}>{stage}</div>
          <div className="flex flex-col items-center gap-[3vmin]" style={{ width: 'min(14vmin, 112px)' }}>
            {(step === 'paint' || step === 'draw' || step === 'dress') && <DoneButton ref={doneRef} show={ready} onClick={goNext} />}
            {mirror && !photo.taken && (
              <button ref={photoRef} type="button" aria-label="Фото" onClick={() => { photo.shoot(); say('fm_photo', soundEnabled); }}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                style={{ width: 'min(14vmin, 112px)', height: 'min(14vmin, 112px)', fontSize: 'min(8vmin, 64px)' }}>📸</button>
            )}
            {mirror && photo.taken && <>
              <div className="text-[6vmin] animate-bounce">⭐</div>
              <button type="button" aria-label="Ещё раз" onClick={restart}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ width: 'min(13vmin, 110px)', height: 'min(13vmin, 110px)', fontSize: 'min(7vmin, 56px)' }}>🔄</button>
            </>}
          </div>
        </div>
      )}
      {photo.overlay}
      <GestureHint show={hint} kind={hintKind} target={hintTarget} />
    </CookScreen>
  );
};
