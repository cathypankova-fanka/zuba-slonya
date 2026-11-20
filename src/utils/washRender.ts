import { MessType } from '../data/kitchenData';
import { NormalizedPoint } from './canvasRender';

export type WashOpKind = 'soap' | 'sponge' | 'shower' | 'dryer';

export interface WashOperation {
  id: string;
  kind: WashOpKind;
  points: NormalizedPoint[];
}

export interface CharacterWashState {
  messType: MessType;
  messSeed: number;
  ops: WashOperation[];
  celebrated: boolean;
}

export function createInitialWashState(messType: MessType = 'mix', seed = 1): CharacterWashState {
  return {
    messType,
    messSeed: seed,
    ops: [],
    celebrated: false,
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawMudBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  color: string,
  rng: () => number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  const lobes = 8;
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const wobble = 0.78 + rng() * 0.42;
    const x = Math.cos(a) * rx * wobble;
    const y = Math.sin(a) * ry * wobble;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Subtle highlight for texture
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.25, -ry * 0.25, rx * 0.3, ry * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawJamSplat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  rng: () => number
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Jam drip downward
  const dripLen = r * (0.9 + rng() * 0.9);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.26, cy);
  ctx.quadraticCurveTo(cx, cy + dripLen * 1.15, cx + r * 0.26, cy);
  ctx.fill();

  // Berry seeds
  ctx.fillStyle = 'rgba(255, 240, 180, 0.75)';
  for (let i = 0; i < 4; i++) {
    const sx = cx + (rng() - 0.5) * r * 1.1;
    const sy = cy + (rng() - 0.5) * r * 1.1;
    ctx.beginPath();
    ctx.ellipse(sx, sy, Math.max(1.5, r * 0.08), Math.max(1, r * 0.05), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glossy shine
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.3, r * 0.28, r * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPaintSplash(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  rng: () => number
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.fill();

  const rays = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + rng() * 0.4;
    const dist = r * (0.9 + rng() * 0.65);
    const dotR = r * (0.16 + rng() * 0.16);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawInitialMess(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  characterId: string,
  messType: MessType,
  messSeed: number
): void {
  ctx.clearRect(0, 0, width, height);
  const rng = createRng(hashSeed(`${characterId}:${messType}:${messSeed}`));

  // Focus messes on the central face region (x: 0.24..0.76, y: 0.24..0.74)
  const spots: Array<{ x: number; y: number; scale: number }> = [
    { x: 0.34, y: 0.48, scale: 1.05 }, // left cheek
    { x: 0.66, y: 0.49, scale: 1.0 },  // right cheek
    { x: 0.50, y: 0.33, scale: 0.95 }, // forehead
    { x: 0.49, y: 0.52, scale: 0.8 },  // nose bridge
    { x: 0.44, y: 0.65, scale: 0.9 },  // chin left
    { x: 0.58, y: 0.63, scale: 0.85 }, // chin right
    { x: 0.38, y: 0.37, scale: 0.78 }, // upper cheek
    { x: 0.63, y: 0.36, scale: 0.82 }, // upper cheek
    { x: 0.52, y: 0.42, scale: 0.72 },
  ];

  const mudColors = ['#78472A', '#8D5524', '#6B3E26', '#9C6644'];
  const jamColors = ['#E11D48', '#BE123C', '#7E22CE', '#F43F5E'];
  const paintColors = ['#FF3B5C', '#38BDF8', '#FACC15', '#10C97A', '#A855F7'];

  spots.forEach((spot, idx) => {
    const cx = (spot.x + (rng() - 0.5) * 0.07) * width;
    const cy = (spot.y + (rng() - 0.5) * 0.06) * height;
    const baseR = width * (0.068 + rng() * 0.032) * spot.scale;

    let kind: 'mud' | 'jam' | 'paint' = 'mud';
    if (messType === 'mud') kind = 'mud';
    else if (messType === 'jam') kind = 'jam';
    else if (messType === 'paint') kind = 'paint';
    else {
      const cycle: Array<'mud' | 'jam' | 'paint'> = ['mud', 'jam', 'paint'];
      kind = cycle[idx % 3];
    }

    if (kind === 'mud') {
      drawMudBlob(
        ctx,
        cx,
        cy,
        baseR * 1.15,
        baseR * 0.85,
        rng() * Math.PI,
        mudColors[idx % mudColors.length],
        rng
      );
    } else if (kind === 'jam') {
      drawJamSplat(ctx, cx, cy, baseR * 0.9, jamColors[idx % jamColors.length], rng);
    } else {
      drawPaintSplash(ctx, cx, cy, baseR * 0.95, paintColors[idx % paintColors.length], rng);
    }
  });

  // Extra playful small specks
  for (let i = 0; i < 14; i++) {
    const cx = (0.25 + rng() * 0.5) * width;
    const cy = (0.25 + rng() * 0.48) * height;
    const r = width * (0.012 + rng() * 0.018);
    ctx.save();
    if (messType === 'mud') {
      ctx.fillStyle = mudColors[i % mudColors.length];
    } else if (messType === 'jam') {
      ctx.fillStyle = jamColors[i % jamColors.length];
    } else if (messType === 'paint') {
      ctx.fillStyle = paintColors[i % paintColors.length];
    } else {
      const all = [...mudColors, ...jamColors, ...paintColors];
      ctx.fillStyle = all[i % all.length];
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSmoothSoapLayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
  grad.addColorStop(0, 'rgba(255, 182, 213, 0.78)');
  grad.addColorStop(0.55, 'rgba(244, 143, 195, 0.54)');
  grad.addColorStop(1, 'rgba(244, 143, 195, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpongeBubbles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  seedVal: number
) {
  const rng = createRng(seedVal);
  ctx.save();

  const count = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const dist = (0.15 + rng() * 0.85) * radius;
    const bx = x + Math.cos(a) * dist;
    const by = y + Math.sin(a) * dist;
    const br = Math.max(3, radius * (0.18 + rng() * 0.28));

    // Translucent iridescent bubble body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(165, 243, 252, 0.9)';
    ctx.lineWidth = Math.max(1.2, br * 0.14);
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crisp white specular highlight dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.arc(bx - br * 0.34, by - br * 0.34, Math.max(1.4, br * 0.24), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWaterDroplets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  seedVal: number
) {
  const rng = createRng(seedVal);
  ctx.save();

  const count = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const dist = (0.12 + rng() * 0.85) * radius;
    const dx = x + Math.cos(a) * dist;
    const dy = y + Math.sin(a) * dist;
    const dr = Math.max(3, radius * (0.1 + rng() * 0.16));

    // Teardrop / glossy round bead on skin
    ctx.save();
    ctx.translate(dx, dy);

    // Soft bottom shadow
    ctx.fillStyle = 'rgba(14, 116, 144, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0.8, dr * 0.25, dr * 0.96, dr * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Translucent water bead body
    const grad = ctx.createRadialGradient(-dr * 0.28, -dr * 0.3, dr * 0.1, 0, 0, dr * 1.15);
    grad.addColorStop(0, 'rgba(224, 247, 255, 0.9)');
    grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.56)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.72)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = Math.max(1, dr * 0.14);

    ctx.beginPath();
    ctx.moveTo(0, -dr * 1.15);
    ctx.bezierCurveTo(dr * 0.88, -dr * 0.22, dr * 0.95, dr * 0.92, 0, dr * 0.98);
    ctx.bezierCurveTo(-dr * 0.95, dr * 0.92, -dr * 0.88, -dr * 0.22, 0, -dr * 1.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crisp specular shine dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.ellipse(-dr * 0.26, -dr * 0.2, Math.max(1.2, dr * 0.24), Math.max(0.9, dr * 0.16), -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

export function applyWashSegment(
  dirtCtx: CanvasRenderingContext2D,
  foamCtx: CanvasRenderingContext2D,
  waterCtx: CanvasRenderingContext2D | null,
  kind: WashOpKind,
  from: NormalizedPoint,
  to: NormalizedPoint,
  width: number,
  height: number,
  seedHint = 1
): void {
  const x0 = from.x * width;
  const y0 = from.y * height;
  const x1 = to.x * width;
  const y1 = to.y * height;
  const dist = Math.hypot(x1 - x0, y1 - y0);

  const radius =
    kind === 'soap'
      ? width * 0.072
      : kind === 'sponge'
      ? width * 0.08
      : kind === 'shower'
      ? width * 0.095
      : width * 0.115;
  const step = Math.max(3, radius * 0.35);
  const steps = Math.max(1, Math.ceil(dist / step));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;

    if (kind === 'soap') {
      // Soap applies a smooth creamy pinkish coat without bubbles
      drawSmoothSoapLayer(foamCtx, x, y, radius);
    } else if (kind === 'sponge') {
      // Sponge scrubs dirt off smoothly and whips up lively bubbles
      dirtCtx.save();
      dirtCtx.globalCompositeOperation = 'destination-out';
      const eraseGrad = dirtCtx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
      eraseGrad.addColorStop(0, 'rgba(0,0,0,1)');
      eraseGrad.addColorStop(0.75, 'rgba(0,0,0,0.85)');
      eraseGrad.addColorStop(1, 'rgba(0,0,0,0)');
      dirtCtx.fillStyle = eraseGrad;
      dirtCtx.beginPath();
      dirtCtx.arc(x, y, radius, 0, Math.PI * 2);
      dirtCtx.fill();
      dirtCtx.restore();

      if (i % 2 === 0) {
        drawSpongeBubbles(foamCtx, x, y, radius * 0.85, seedHint + i * 17 + 7);
      }
    } else if (kind === 'shower') {
      // Shower rinses away foam & softened dirt cleanly AND leaves water droplets on face
      [foamCtx, dirtCtx].forEach((ctx) => {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const rinseGrad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 1.15);
        rinseGrad.addColorStop(0, 'rgba(0,0,0,1)');
        rinseGrad.addColorStop(0.8, 'rgba(0,0,0,0.9)');
        rinseGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rinseGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (waterCtx && i % 2 === 0) {
        drawWaterDroplets(waterCtx, x, y, radius * 0.9, seedHint + i * 23 + 11);
      }
    } else {
      // Hairdryer dries and removes water droplets cleanly
      if (waterCtx) {
        waterCtx.save();
        waterCtx.globalCompositeOperation = 'destination-out';
        const dryGrad = waterCtx.createRadialGradient(x, y, radius * 0.35, x, y, radius * 1.15);
        dryGrad.addColorStop(0, 'rgba(0,0,0,1)');
        dryGrad.addColorStop(0.82, 'rgba(0,0,0,0.94)');
        dryGrad.addColorStop(1, 'rgba(0,0,0,0)');
        waterCtx.fillStyle = dryGrad;
        waterCtx.beginPath();
        waterCtx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
        waterCtx.fill();
        waterCtx.restore();
      }
    }
  }
}

export function renderFullWashLayers(
  dirtCtx: CanvasRenderingContext2D,
  foamCtx: CanvasRenderingContext2D,
  waterCtx: CanvasRenderingContext2D | null,
  width: number,
  height: number,
  characterId: string,
  washState: CharacterWashState
): void {
  foamCtx.clearRect(0, 0, width, height);
  waterCtx?.clearRect(0, 0, width, height);
  drawInitialMess(
    dirtCtx,
    width,
    height,
    characterId,
    washState.messType,
    washState.messSeed
  );

  washState.ops.forEach((op, opIdx) => {
    if (op.points.length === 1) {
      applyWashSegment(
        dirtCtx,
        foamCtx,
        waterCtx,
        op.kind,
        op.points[0],
        op.points[0],
        width,
        height,
        opIdx * 101 + 1
      );
    } else {
      for (let i = 1; i < op.points.length; i++) {
        applyWashSegment(
          dirtCtx,
          foamCtx,
          waterCtx,
          op.kind,
          op.points[i - 1],
          op.points[i],
          width,
          height,
          opIdx * 101 + i * 13
        );
      }
    }
  });
}

export function measureCanvasOpaqueCount(sourceCanvas: HTMLCanvasElement): number {
  const sampleW = 24;
  const sampleH = 32;
  const tmp = document.createElement('canvas');
  tmp.width = sampleW;
  tmp.height = sampleH;
  const ctx = tmp.getContext('2d');
  if (!ctx) return 0;
  ctx.drawImage(sourceCanvas, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 28) count++;
  }
  return count;
}
