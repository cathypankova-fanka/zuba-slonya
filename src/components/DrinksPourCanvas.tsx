import React, { useEffect, useRef, useState } from 'react';
import { DRINK_FLAVORS, DrinkState } from '../data/kitchenData';
import { getDrinkExtraAssetUrl } from '../utils/itemAssets';
import { soundEngine } from '../utils/soundEngine';

interface DrinksPourCanvasProps {
  drink: DrinkState;
  soundEnabled: boolean;
  isCarryingDish: boolean;
  isCrumbsPhase: boolean;
  onSetPourLevel: (level: number) => void;
  onStirDrink: () => void;
  onStartDishDrag?: (e: React.PointerEvent<HTMLElement>) => void;
}

type VesselKind = 'cup' | 'cupmug' | 'glass';

interface VesselSpec {
  kind: VesselKind;
  img: string;
  maskSrc: string;
  w: number;
  h: number;
  sc: number;
  cx: number;
  innerTopPx: number;
  innerBotPx: number;
  innerHalfW: number;
}

const STAGE_W = 680;
const STAGE_H = 660;
const GROUND = 568;

const TEAPOT_META = {
  w: 836,
  h: 632,
  spout: { x: 27, y: 182 },
  bottom: 604,
};
const SPLASH_META = { w: 801, h: 444 };

const TW = 336;
const ts = TW / TEAPOT_META.w;
const THETA_MAX = 34;
const POUR_START = 16;
const FILL_SECONDS = 4.0;
const TEAPOT_LEFT = 334;

const PIVOT = {
  x: TW * 0.5,
  y: TEAPOT_META.bottom * ts,
};
const SPOUT_LOCAL = {
  x: TEAPOT_META.spout.x * ts,
  y: TEAPOT_META.spout.y * ts,
};

function rotCCW(p: { x: number; y: number }, deg: number) {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - PIVOT.x;
  const dy = p.y - PIVOT.y;
  return {
    x: PIVOT.x + dx * Math.cos(r) + dy * Math.sin(r),
    y: PIVOT.y - dx * Math.sin(r) + dy * Math.cos(r),
  };
}

const TIP_MAX_0 = rotCCW(SPOUT_LOCAL, THETA_MAX);

function makeVessel(
  kind: VesselKind,
  img: string,
  maskSrc: string,
  nw: number,
  nh: number,
  it: number,
  ib: number,
  cxNat: number,
  w: number,
  innerHalfWRatio: number
): VesselSpec {
  const sc = w / nw;
  return {
    kind,
    img,
    maskSrc,
    w,
    h: nh * sc,
    sc,
    cx: cxNat * sc,
    innerTopPx: it * sc,
    innerBotPx: ib * sc,
    innerHalfW: w * innerHalfWRatio,
  };
}

const VESSELS: Record<VesselKind, VesselSpec> = {
  cup: makeVessel(
    'cup',
    '/assets/pour/cup.webp',
    '/assets/pour/cup_inner.webp',
    1111,
    808,
    34,
    671,
    453.2,
    272,
    0.31
  ),
  cupmug: makeVessel(
    'cupmug',
    '/assets/pour/cupmug.webp',
    '/assets/pour/cupmug_inner.webp',
    1107,
    1165,
    35,
    981,
    474.6,
    214,
    0.3
  ),
  glass: makeVessel(
    'glass',
    '/assets/pour/glass.webp',
    '/assets/pour/glass_inner.webp',
    479,
    618,
    32,
    513,
    479 / 2,
    220,
    0.36
  ),
};

function hex2rgb(hex: string): [number, number, number] {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const n = parseInt(clean, 16);
  if (Number.isNaN(n)) return [251, 146, 60];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const smoothstep = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

const CONF_COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#facc15'];

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
  r: number;
  rot: number;
}

export const DrinksPourCanvas: React.FC<DrinksPourCanvasProps> = ({
  drink,
  soundEnabled,
  isCarryingDish,
  isCrumbsPhase,
  onSetPourLevel,
  onStirDrink,
  onStartDishDrag,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(0.6);

  const teapotRef = useRef<HTMLImageElement | null>(null);
  const liquidCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamBodyRef = useRef<SVGPathElement | null>(null);
  const streamShineRef = useRef<SVGPathElement | null>(null);
  const splashImgRef = useRef<HTMLImageElement | null>(null);
  const steam1Ref = useRef<HTMLImageElement | null>(null);
  const steam2Ref = useRef<HTMLImageElement | null>(null);
  const barFillRef = useRef<HTMLDivElement | null>(null);

  const floatGroupRef = useRef<HTMLDivElement | null>(null);
  const spoonAnimRef = useRef<HTMLDivElement | null>(null);

  const [isHoldingUi, setIsHoldingUi] = useState(false);
  const [showHint, setShowHint] = useState(drink.pourLevel <= 0.01);
  const [isFullDone, setIsFullDone] = useState(drink.pourLevel >= 0.99);

  const maskImgsRef = useRef<Partial<Record<VesselKind, HTMLImageElement>>>({});
  useEffect(() => {
    (Object.keys(VESSELS) as VesselKind[]).forEach((k) => {
      const img = new Image();
      img.src = VESSELS[k].maskSrc;
      maskImgsRef.current[k] = img;
    });
  }, []);

  const drinkFlavor =
    DRINK_FLAVORS.find((d) => d.id === drink.flavorId) ??
    DRINK_FLAVORS.find((d) => d.category === drink.category) ??
    DRINK_FLAVORS[0];

  const vesselKind: VesselKind =
    drink.category === 'tea' ? 'cup' : drink.category === 'coffee' ? 'cupmug' : 'glass';
  const V = VESSELS[vesselKind];
  const vesselTop = GROUND - V.h;
  const teapotTop = vesselTop - 20 - TIP_MAX_0.y;
  const landX = TEAPOT_LEFT + TIP_MAX_0.x - 40;
  const vesselLeft = landX - V.cx;
  const centerX = vesselLeft + V.cx;
  const rimY = vesselTop + V.innerTopPx;
  const botY = vesselTop + V.innerBotPx;
  const isHotDrink = drink.category === 'tea' || drink.category === 'coffee';

  const latestPropsRef = useRef({
    drink,
    drinkFlavor,
    V,
    vesselTop,
    teapotTop,
    landX,
    vesselLeft,
    centerX,
    rimY,
    botY,
    isHotDrink,
    soundEnabled,
    onSetPourLevel,
  });
  latestPropsRef.current = {
    drink,
    drinkFlavor,
    V,
    vesselTop,
    teapotTop,
    landX,
    vesselLeft,
    centerX,
    rimY,
    botY,
    isHotDrink,
    soundEnabled,
    onSetPourLevel,
  };

  const simRef = useRef({
    level: drink.pourLevel,
    tilt: 0,
    target: 0,
    flow: 0,
    holding: false,
    done: drink.pourLevel >= 0.99,
    everHeld: drink.pourLevel > 0.01,
    stirEnergy: 0,
    stirPhase: 0,
    lastPropLevel: drink.pourLevel,
    lastSyncedAt: 0,
    lastReportedLevel: drink.pourLevel,
    parts: [] as SplashParticle[],
    conf: [] as ConfettiParticle[],
  });

  const prevStirAngleRef = useRef(drink.stirAngle);
  useEffect(() => {
    if (drink.stirAngle !== prevStirAngleRef.current) {
      prevStirAngleRef.current = drink.stirAngle;
      simRef.current.stirEnergy = 1;
    }
  }, [drink.stirAngle]);

  // Sync external reset / flavor switch (when pourLevel returns to 0)
  useEffect(() => {
    const sim = simRef.current;
    if (drink.pourLevel <= 0.001 && sim.lastPropLevel > 0.01 && !sim.holding) {
      sim.level = 0;
      sim.done = false;
      sim.target = 0;
      sim.parts = [];
      setIsFullDone(false);
    } else if (!sim.holding && Math.abs(drink.pourLevel - sim.lastReportedLevel) > 0.05) {
      sim.level = drink.pourLevel;
      sim.done = drink.pourLevel >= 0.99;
      setIsFullDone(sim.done);
    }
    sim.lastPropLevel = drink.pourLevel;
  }, [drink.pourLevel]);

  // Responsive ResizeObserver to fit 680x660 stage inside wrapper cleanly
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        const k = Math.min(rect.width / STAGE_W, rect.height / STAGE_H) * 0.98;
        setStageScale(Math.max(0.28, k));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setHold = (on: boolean) => {
    const sim = simRef.current;
    if (on && !sim.done) {
      sim.everHeld = true;
      setShowHint(false);
    }
    const active = on && !sim.done;
    sim.holding = active;
    sim.target = active ? THETA_MAX : 0;
    setIsHoldingUi(active);
    if (!on) {
      const committed = Number(sim.level.toFixed(3));
      if (Math.abs(committed - sim.lastReportedLevel) > 0.005) {
        sim.lastReportedLevel = committed;
        latestPropsRef.current.onSetPourLevel(committed);
      }
    }
  };

  const handleResetPour = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const sim = simRef.current;
    sim.level = 0;
    sim.done = false;
    sim.holding = false;
    sim.target = 0;
    sim.parts = [];
    sim.lastReportedLevel = 0;
    setIsHoldingUi(false);
    setIsFullDone(false);
    if (!sim.everHeld) setShowHint(true);
    soundEngine.playEraseSwoosh(latestPropsRef.current.soundEnabled);
    latestPropsRef.current.onSetPourLevel(0);
  };

  // Global release & spacebar support
  useEffect(() => {
    const onUp = () => {
      if (simRef.current.holding) setHold(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setHold(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setHold(false);
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      soundEngine.stopPourSound();
    };
  }, []);

  // Silence pouring sound immediately if app sound toggle turns off
  useEffect(() => {
    if (!soundEnabled) {
      soundEngine.stopPourSound();
    }
  }, [soundEnabled]);

  // Main 60fps Canvas & Pour Animation Loop
  useEffect(() => {
    let rafId = 0;
    const t0 = performance.now();
    let last = t0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - t0) / 1000;

      const props = latestPropsRef.current;
      const sim = simRef.current;
      const { V: curV, drinkFlavor: curFlavor, soundEnabled: sndOn } = props;

      // Teapot spring tilt
      sim.tilt += (sim.target - sim.tilt) * Math.min(1, dt * 7);
      sim.flow =
        smoothstep((sim.tilt - POUR_START) / (THETA_MAX - POUR_START)) *
        (sim.level < 1 ? 1 : 0);

      if (sim.flow > 0) {
        sim.level = Math.min(1, sim.level + (sim.flow * dt) / FILL_SECONDS);
        if (now - sim.lastSyncedAt > 180) {
          sim.lastSyncedAt = now;
          const rounded = Number(sim.level.toFixed(3));
          if (Math.abs(rounded - sim.lastReportedLevel) > 0.01) {
            sim.lastReportedLevel = rounded;
            props.onSetPourLevel(rounded);
          }
        }
      }

      if (sim.level >= 1 && !sim.done) {
        sim.done = true;
        sim.holding = false;
        sim.target = 0;
        sim.lastReportedLevel = 1;
        setIsHoldingUi(false);
        setIsFullDone(true);
        props.onSetPourLevel(1);
        for (let i = 0; i < 42; i++) {
          sim.conf.push({
            x: props.landX + (Math.random() * 40 - 20),
            y: props.vesselTop - 8,
            vx: (Math.random() - 0.5) * 400,
            vy: -(170 + Math.random() * 310),
            life: 1.5 + Math.random() * 0.6,
            c: CONF_COLORS[i % CONF_COLORS.length],
            r: 3 + Math.random() * 4,
            rot: Math.random() * 6,
          });
        }
        soundEngine.playPourCompleteChime(sndOn);
      }

      // Stir energy decay
      if (sim.stirEnergy > 0) {
        sim.stirEnergy = Math.max(0, sim.stirEnergy - dt * 0.9);
        sim.stirPhase += dt * 9;
      }

      // Progress bar width
      if (barFillRef.current) {
        barFillRef.current.style.width = `${sim.level * 100}%`;
      }

      // Audio synthesis
      soundEngine.updatePourSound(sndOn, sim.flow, sim.level);
      if (sim.flow > 0.3 && Math.random() < sim.flow * dt * 7) {
        soundEngine.playPourBloop(sndOn, sim.level);
      }

      // Teapot transform
      if (teapotRef.current) {
        teapotRef.current.style.transform = `rotate(${-sim.tilt}deg)`;
      }

      // Dynamic spout world coordinates
      const tipLocal = rotCCW(SPOUT_LOCAL, sim.tilt);
      const tipX = TEAPOT_LEFT + tipLocal.x;
      const tipY = props.teapotTop + tipLocal.y;
      const surf = props.botY - sim.level * (curV.innerBotPx - curV.innerTopPx);

      // Liquid stream SVG
      const bodyEl = streamBodyRef.current;
      const shineEl = streamShineRef.current;
      if (bodyEl && shineEl) {
        if (sim.flow > 0.02) {
          const endX = props.landX;
          const endY = surf + 2;
          const cx = tipX - 24;
          const cy = tipY + (endY - tipY) * 0.18;
          const d = `M ${tipX - 3} ${tipY + 2} Q ${cx} ${cy} ${endX} ${endY}`;
          bodyEl.setAttribute('d', d);
          shineEl.setAttribute('d', d);
          bodyEl.setAttribute('stroke-width', String(15 * sim.flow));
          shineEl.setAttribute('stroke-width', String(4.2 * sim.flow));
          shineEl.setAttribute('stroke-dashoffset', String(-t * 160));
        } else {
          bodyEl.setAttribute('stroke-width', '0');
          shineEl.setAttribute('stroke-width', '0');
        }
      }

      // Floating decorations Y tracking smoothly with liquid surface
      if (floatGroupRef.current) {
        const floatY = Math.min(props.botY - 16, surf);
        floatGroupRef.current.style.top = `${floatY}px`;
      }

      // Spoon animation while stirring
      if (spoonAnimRef.current) {
        if (sim.stirEnergy > 0.04) {
          const sx = props.centerX + Math.cos(sim.stirPhase) * 32;
          const sy = Math.min(props.botY - 38, Math.max(props.rimY - 14, surf - 10));
          spoonAnimRef.current.style.display = '';
          spoonAnimRef.current.style.left = `${sx}px`;
          spoonAnimRef.current.style.top = `${sy}px`;
          spoonAnimRef.current.style.opacity = String(Math.min(1, sim.stirEnergy * 2.5));
          spoonAnimRef.current.style.transform = `translate(-50%, -82%) rotate(${
            Math.sin(sim.stirPhase) * 16
          }deg)`;
        } else {
          spoonAnimRef.current.style.display = 'none';
        }
      }

      // Liquid Canvas (2x crispness)
      const lc = liquidCanvasRef.current;
      if (lc) {
        const k = 2;
        const targetW = Math.round(curV.w * k);
        const targetH = Math.round(curV.h * k);
        if (lc.width !== targetW || lc.height !== targetH) {
          lc.width = targetW;
          lc.height = targetH;
        }
        const lctx = lc.getContext('2d');
        if (lctx) {
          lctx.globalCompositeOperation = 'source-over';
          lctx.clearRect(0, 0, targetW, targetH);

          const hasIce = props.drink.addons.includes('ice');
          const sy = (curV.innerBotPx - sim.level * (curV.innerBotPx - curV.innerTopPx)) * k;

          if (sim.level > 0.002) {
            const agitate = Math.max(sim.flow, sim.stirEnergy * 0.85);
            const amp = (1.1 + agitate * 3.4) * k;
            const g = lctx.createLinearGradient(0, sy, 0, curV.innerBotPx * k);
            g.addColorStop(0, curFlavor.liquidTop);
            g.addColorStop(1, curFlavor.liquidBottom);
            lctx.fillStyle = g;
            lctx.beginPath();
            lctx.moveTo(0, targetH);
            for (let x = 0; x <= targetW; x += 6) {
              lctx.lineTo(
                x,
                sy +
                  Math.sin(x * 0.03 + t * 5.2) * amp +
                  Math.sin(x * 0.07 - t * 3.1) * amp * 0.5
              );
            }
            lctx.lineTo(targetW, targetH);
            lctx.closePath();
            lctx.fill();

            // Creamy foam layer for coffee/cocktails
            if (curFlavor.foamColor && sim.level > 0.08) {
              const foamH = (6 + 8 * smoothstep(sim.level / 0.5)) * k;
              lctx.fillStyle = curFlavor.foamColor;
              lctx.globalAlpha = 0.88;
              lctx.beginPath();
              lctx.moveTo(0, sy + foamH);
              for (let x = 0; x <= targetW; x += 6) {
                lctx.lineTo(
                  x,
                  sy +
                    Math.sin(x * 0.03 + t * 5.2) * amp +
                    Math.sin(x * 0.07 - t * 3.1) * amp * 0.5
                );
              }
              lctx.lineTo(targetW, sy + foamH);
              lctx.closePath();
              lctx.fill();
              lctx.globalAlpha = 1;
            }

            // White liquid surface gleam
            lctx.globalAlpha = 0.36;
            lctx.fillStyle = '#ffffff';
            lctx.fillRect(0, sy - 1 * k, targetW, 3 * k);
            lctx.globalAlpha = 1;

            // Swirl highlights when stirring
            if (sim.stirEnergy > 0.05) {
              lctx.save();
              lctx.strokeStyle = `rgba(255,255,255,${0.55 * sim.stirEnergy})`;
              lctx.lineWidth = 3 * k;
              lctx.lineCap = 'round';
              const swirlCx = curV.cx * k;
              const swirlCy = Math.min(curV.innerBotPx * k - 16 * k, sy + 24 * k);
              lctx.beginPath();
              lctx.ellipse(
                swirlCx,
                swirlCy,
                34 * k,
                10 * k,
                0,
                sim.stirPhase,
                sim.stirPhase + Math.PI * 1.15
              );
              lctx.stroke();
              lctx.restore();
            }
          }

          // Translucent ice cubes clipped inside the glass mask (visible even before pouring!)
          if (hasIce) {
            const iceTop = Math.min(
              (curV.innerBotPx - 36) * k,
              Math.max((curV.innerTopPx + 4) * k, sy + 4 * k)
            );
            const cubes = [
              { ox: -28 * k, oy: 12 * k, s: 28 * k, rot: -0.24 + Math.sin(t * 2.2) * 0.05 },
              { ox: 18 * k, oy: 6 * k, s: 30 * k, rot: 0.28 + Math.cos(t * 2.0) * 0.05 },
              { ox: -4 * k, oy: 36 * k, s: 26 * k, rot: 0.1 },
            ];
            cubes.forEach((c) => {
              lctx.save();
              lctx.translate(curV.cx * k + c.ox, iceTop + c.oy);
              lctx.rotate(c.rot);
              lctx.fillStyle = 'rgba(255,255,255,0.52)';
              lctx.strokeStyle = 'rgba(224,242,254,0.88)';
              lctx.lineWidth = 2 * k;
              const half = c.s / 2;
              lctx.beginPath();
              lctx.roundRect(-half, -half, c.s, c.s, 6 * k);
              lctx.fill();
              lctx.stroke();
              lctx.restore();
            });
          }

          // Composite cleanly with glass inner mask
          const maskImg = maskImgsRef.current[curV.kind];
          if (maskImg && maskImg.complete && maskImg.naturalWidth > 0) {
            lctx.globalCompositeOperation = 'destination-in';
            lctx.drawImage(maskImg, 0, 0, targetW, targetH);
            lctx.globalCompositeOperation = 'source-over';
          }
        }
      }

      // Splash sprite
      const splashEl = splashImgRef.current;
      if (splashEl) {
        if (sim.flow > 0.35) {
          const w = 78 + Math.sin(t * 18) * 6;
          const sc = w / SPLASH_META.w;
          splashEl.style.display = '';
          splashEl.style.width = `${w}px`;
          splashEl.style.left = `${props.landX - w / 2}px`;
          splashEl.style.top = `${surf - SPLASH_META.h * sc + 6}px`;
          splashEl.style.opacity = String(0.85 * sim.flow);

          if (Math.random() < sim.flow * dt * 36) {
            sim.parts.push({
              x: props.landX + (Math.random() * 20 - 10),
              y: surf,
              vx: (Math.random() - 0.5) * 160,
              vy: -(80 + Math.random() * 150),
              life: 0.55,
              r: 1.5 + Math.random() * 2.5,
            });
          }
        } else {
          splashEl.style.display = 'none';
        }
      }

      // FX Canvas (droplets + confetti)
      const fc = fxCanvasRef.current;
      if (fc) {
        const fctx = fc.getContext('2d');
        if (fctx) {
          fctx.setTransform(2, 0, 0, 2, 0, 0);
          fctx.clearRect(0, 0, STAGE_W, STAGE_H);
          const rgb = hex2rgb(curFlavor.liquidTop);

          for (let i = sim.parts.length - 1; i >= 0; i--) {
            const p = sim.parts[i];
            p.life -= dt;
            if (p.life <= 0 || p.y > surf + 6) {
              sim.parts.splice(i, 1);
              continue;
            }
            p.vy += 620 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            fctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(1, p.life * 3)})`;
            fctx.beginPath();
            fctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            fctx.fill();
          }

          for (let i = sim.conf.length - 1; i >= 0; i--) {
            const p = sim.conf[i];
            p.life -= dt;
            if (p.life <= 0) {
              sim.conf.splice(i, 1);
              continue;
            }
            p.vy += 520 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.99;
            p.rot += dt * 8;
            fctx.save();
            fctx.translate(p.x, p.y);
            fctx.rotate(p.rot);
            fctx.fillStyle = p.c;
            fctx.globalAlpha = Math.min(1, p.life * 2);
            fctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
            fctx.restore();
          }
        }
      }

      // Steam for hot drinks (above spout while pouring/poured & above cup)
      [
        { ref: steam1Ref, phase: 0, ox: 0 },
        { ref: steam2Ref, phase: 0.5, ox: 64 },
      ].forEach(({ ref, phase, ox }) => {
        const s = ref.current;
        if (!s) return;
        if (!props.isHotDrink || sim.level < 0.04) {
          s.style.display = 'none';
          return;
        }
        s.style.display = '';
        const u = (t * 0.22 + phase) % 1;
        const steamBaseX = sim.flow > 0.05 ? tipX + ox - 10 : props.centerX + (phase === 0 ? -24 : 18);
        const steamBaseY = sim.flow > 0.05 ? tipY - 70 : Math.min(props.rimY, surf) - 52;
        s.style.width = '64px';
        s.style.left = `${steamBaseX + Math.sin(t * 2 + phase * 6) * 6}px`;
        s.style.top = `${steamBaseY - u * 64}px`;
        s.style.opacity = String(Math.sin(u * Math.PI) * 0.62 * (sim.done ? 0.45 : 1));
      });

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const hasAddon = (id: DrinkState['addons'][number]) => drink.addons.includes(id);

  return (
    <div
      ref={wrapperRef}
      onPointerDown={onStartDishDrag}
      onClick={() => {
        if (drink.pourLevel > 0.08) onStirDrink();
      }}
      style={{ touchAction: drink.pourLevel > 0.08 ? 'none' : 'manipulation' }}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none transition-opacity duration-150 ${
        isCarryingDish ? 'opacity-35 cursor-grabbing' : 'cursor-pointer'
      }`}
    >
      {/* Top liquid level bar */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-[190px] sm:w-[230px] h-4 rounded-full bg-white/80 overflow-hidden pointer-events-none"
        style={{ boxShadow: '0 0 0 3px #fff inset, 0 3px 0 rgba(0,0,0,0.08)' }}
      >
        <div
          ref={barFillRef}
          className="h-full rounded-full transition-[background] duration-200"
          style={{
            width: `${drink.pourLevel * 100}%`,
            background: `linear-gradient(90deg, ${drinkFlavor.liquidTop}, ${drinkFlavor.liquidBottom})`,
          }}
        />
      </div>

      {/* Scaled 680x660 pouring stage */}
      <div
        style={{
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
          transform: `scale(${stageScale})`,
          transformOrigin: 'center center',
        }}
        className="relative shrink-0"
      >
        {/* Warm wooden/golden table */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${STAGE_H - GROUND + 18}px`,
            background: 'linear-gradient(180deg, #FDE68A, #FBBF24)',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -6px 0 rgba(255,255,255,0.5) inset',
          }}
        />

        {/* Vessel shadow */}
        <div
          style={{
            position: 'absolute',
            left: `${vesselLeft - 12}px`,
            top: `${GROUND - 12}px`,
            width: `${V.w + 24}px`,
            height: '24px',
            background: 'radial-gradient(closest-side, rgba(100,60,20,0.28), transparent)',
            borderRadius: '50%',
          }}
        />

        {/* Straw & Umbrella placed cleanly behind glass front wall */}
        {!isCrumbsPhase && hasAddon('straw') && (
          <img
            src={getDrinkExtraAssetUrl('straw')}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: `${centerX - 18}px`,
              top: `${rimY - 124}px`,
              width: '132px',
              height: '180px',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        )}
        {!isCrumbsPhase && hasAddon('umbrella') && (
          <img
            src={getDrinkExtraAssetUrl('umbrella')}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: `${centerX - 118}px`,
              top: `${rimY - 118}px`,
              width: '138px',
              height: '158px',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Masked Liquid Canvas */}
        {!isCrumbsPhase && (
          <canvas
            ref={liquidCanvasRef}
            style={{
              position: 'absolute',
              left: `${vesselLeft}px`,
              top: `${vesselTop}px`,
              width: `${V.w}px`,
              height: `${V.h}px`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Parabolic liquid stream */}
        <svg
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="pourStreamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={drinkFlavor.liquidTop} />
              <stop offset="1" stopColor={drinkFlavor.liquidBottom} />
            </linearGradient>
          </defs>
          <path
            ref={streamBodyRef}
            d=""
            fill="none"
            stroke="url(#pourStreamGrad)"
            strokeLinecap="round"
            strokeWidth="0"
          />
          <path
            ref={streamShineRef}
            d=""
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeLinecap="round"
            strokeWidth="0"
            strokeDasharray="18 14"
          />
        </svg>

        {/* Glass / Cup / Mug Front Layer */}
        <img
          src={V.img}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: `${vesselLeft}px`,
            top: `${vesselTop}px`,
            width: `${V.w}px`,
            height: `${V.h}px`,
            pointerEvents: 'none',
          }}
        />

        {/* Crumbs / Leftover Drops after character finishes drinking */}
        {isCrumbsPhase && (
          <div
            style={{
              position: 'absolute',
              left: `${centerX - 42}px`,
              top: `${botY - 18}px`,
              width: '84px',
              height: '22px',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '4px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: drinkFlavor.liquidTop,
                opacity: 0.65,
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '44px',
                top: '0px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: drinkFlavor.liquidBottom,
                opacity: 0.6,
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '64px',
                top: '8px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: drinkFlavor.liquidTop,
                opacity: 0.55,
              }}
            />
          </div>
        )}

        {/* Lemon slice hooked neatly on right rim */}
        {!isCrumbsPhase && hasAddon('lemon') && (
          <img
            src={getDrinkExtraAssetUrl('lemon')}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: `${centerX + V.innerHalfW * 0.56 - 24}px`,
              top: `${rimY - 46}px`,
              width: '92px',
              height: '92px',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Floating surface addons tracking liquid level */}
        {!isCrumbsPhase && (
          <div
            ref={floatGroupRef}
            style={{
              position: 'absolute',
              left: 0,
              top: `${Math.min(botY - 16, botY - drink.pourLevel * (V.innerBotPx - V.innerTopPx))}px`,
              width: `${STAGE_W}px`,
              height: '1px',
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            {hasAddon('berries') && (
              <img
                src={getDrinkExtraAssetUrl('berries')}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${centerX - 48}px`,
                  top: '-42px',
                  width: '96px',
                  height: '76px',
                  maxWidth: 'none',
                  objectFit: 'contain',
                }}
              />
            )}
            {hasAddon('mint') && (
              <img
                src={getDrinkExtraAssetUrl('mint')}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${centerX + 8}px`,
                  top: '-48px',
                  width: '74px',
                  height: '74px',
                  maxWidth: 'none',
                  objectFit: 'contain',
                }}
              />
            )}
            {hasAddon('cream') && (
              <img
                src={getDrinkExtraAssetUrl('cream')}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${centerX - 76}px`,
                  top: '-74px',
                  width: '152px',
                  height: '108px',
                  maxWidth: 'none',
                  objectFit: 'contain',
                }}
              />
            )}
            {hasAddon('marshmallow') && (
              <img
                src={getDrinkExtraAssetUrl('marshmallow')}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${centerX - 46}px`,
                  top: hasAddon('cream') ? '-54px' : '-40px',
                  width: '92px',
                  height: '68px',
                  maxWidth: 'none',
                  objectFit: 'contain',
                }}
              />
            )}
            {hasAddon('choco_chips') && (
              <img
                src={getDrinkExtraAssetUrl('choco_chips')}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${centerX - 38}px`,
                  top: hasAddon('cream') ? '-56px' : '-32px',
                  width: '76px',
                  height: '58px',
                  maxWidth: 'none',
                  objectFit: 'contain',
                }}
              />
            )}
            {hasAddon('latte_heart') && (
              <img
                src={getDrinkExtraAssetUrl('latte_heart')}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${centerX - 32}px`,
                  top: hasAddon('cream') ? '-64px' : '-28px',
                  width: '64px',
                  height: '60px',
                  maxWidth: 'none',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>
        )}

        {/* Animated stir spoon */}
        <div
          ref={spoonAnimRef}
          style={{
            display: 'none',
            position: 'absolute',
            width: '54px',
            height: '112px',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 54 112" className="w-full h-full drop-shadow-md" aria-hidden="true">
            {/* Spoon handle */}
            <rect
              x="22"
              y="6"
              width="10"
              height="74"
              rx="5"
              fill="#F59E0B"
              stroke="#92400E"
              strokeWidth="2.5"
            />
            <line
              x1="25.5"
              y1="14"
              x2="25.5"
              y2="68"
              stroke="#FEF3C7"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.7"
            />
            {/* Spoon bowl dipped into drink */}
            <ellipse
              cx="27"
              cy="88"
              rx="15"
              ry="18"
              fill="#D97706"
              stroke="#92400E"
              strokeWidth="2.5"
            />
            <ellipse cx="27" cy="86" rx="10" ry="12" fill="#FBBF24" opacity="0.6" />
          </svg>
        </div>

        {/* Steam particles for tea & coffee */}
        <img
          ref={steam1Ref}
          src="/assets/pour/steam.webp"
          alt=""
          draggable={false}
          style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
        />
        <img
          ref={steam2Ref}
          src="/assets/pour/steam.webp"
          alt=""
          draggable={false}
          style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
        />

        {/* Interactive Teapot (hold to tilt and pour!) */}
        <img
          ref={teapotRef}
          src="/assets/pour/teapot.webp"
          alt="Чайник"
          draggable={false}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setHold(true);
          }}
          style={{
            position: 'absolute',
            left: `${TEAPOT_LEFT}px`,
            top: `${teapotTop}px`,
            width: `${TW}px`,
            transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
            cursor: 'grab',
            willChange: 'transform',
            touchAction: 'none',
          }}
        />

        {/* Splash sprite */}
        <img
          ref={splashImgRef}
          src="/assets/pour/splash.webp"
          alt=""
          draggable={false}
          style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
        />

        {/* Droplets & Confetti FX canvas */}
        <canvas
          ref={fxCanvasRef}
          width={STAGE_W * 2}
          height={STAGE_H * 2}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${STAGE_W}px`,
            height: `${STAGE_H}px`,
            pointerEvents: 'none',
          }}
        />

        {/* Bouncing finger hint before first pour */}
        {showHint && !isCrumbsPhase && (
          <div
            style={{
              position: 'absolute',
              left: `${TEAPOT_LEFT + 110}px`,
              top: `${Math.max(16, teapotTop - 36)}px`,
              fontSize: '72px',
              lineHeight: 1,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
            }}
            className="animate-bounce"
          >
            👇
          </div>
        )}
      </div>

      {/* Round orange Repeat / Empty button (bottom-left) */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleResetPour}
        aria-label="Вылить и налить ещё раз"
        title="Ещё раз"
        className={`absolute left-3 bottom-3 z-15 w-12 h-12 sm:w-14 sm:h-14 rounded-full grid place-items-center bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_4px_0_#B45309] active:translate-y-0.5 cursor-pointer transition-transform ${
          isFullDone ? 'animate-pulse ring-4 ring-[#FDE68A]' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <path d="M20 3.5v5h-5" />
        </svg>
      </button>

      {/* Round green Pour Hold button (bottom-right) */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setHold(true);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Держать, чтобы налить"
        title="Налить"
        style={{ touchAction: 'none' }}
        className={`absolute right-3 bottom-3 z-15 w-14 h-14 sm:w-16 sm:h-16 rounded-full grid place-items-center text-white cursor-pointer transition-transform ${
          isFullDone
            ? 'bg-[#22C55E]/45 shadow-[0_3px_0_#15803D] opacity-60'
            : isHoldingUi
            ? 'bg-[#16A34A] translate-y-1 shadow-[0_2px_0_#15803D]'
            : 'bg-[#22C55E] hover:bg-[#16A34A] shadow-[0_5px_0_#15803D] animate-pulse'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor">
          <path d="M12 2.5c3.2 4.2 6 7.4 6 11a6 6 0 0 1-12 0c0-3.6 2.8-6.8 6-11z" />
        </svg>
      </button>
    </div>
  );
};
