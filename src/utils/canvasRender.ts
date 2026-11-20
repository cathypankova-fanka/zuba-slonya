import { PatternStampId, STICKERS, stickerToDataUrl } from '../data/artTools';
import { FACE_ART_MASKS, faceArtMaskToDataUrl } from '../data/faceArtMasks';
import { getFaceMaskAssetUrl, getStickerAssetUrl } from './itemAssets';
import { CharacterWashState, renderFullWashLayers } from './washRender';

export interface NormalizedPoint {
  x: number; // 0..1
  y: number; // 0..1
}

export type PaintOperation =
  | {
      kind: 'stroke';
      id: string;
      color: string;
      radiusRatio: number;
      points: NormalizedPoint[];
    }
  | {
      kind: 'erase';
      id: string;
      radiusRatio: number;
      points: NormalizedPoint[];
    }
  | {
      kind: 'stamp';
      id: string;
      stampId: PatternStampId;
      color: string;
      x: number;
      y: number;
      sizeRatio: number;
      rotation: number;
    };

export interface PlacedSticker {
  uid: string;
  stickerId: string;
  x: number; // 0..1 center
  y: number; // 0..1 center
  scale: number;
  rotation: number; // radians
}

export interface PlacedFaceArtMask {
  maskId: string;
  x: number; // 0..1 center
  y: number; // 0..1 center
  scale: number;
  rotation: number; // radians
}

export function drawSoftDab(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
): void {
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.75, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  from: NormalizedPoint,
  to: NormalizedPoint,
  width: number,
  height: number,
  radiusRatio: number,
  color: string,
  isErase: boolean
): void {
  const radius = Math.max(6, radiusRatio * width);
  const x0 = from.x * width;
  const y0 = from.y * height;
  const x1 = to.x * width;
  const y1 = to.y * height;

  const dist = Math.hypot(x1 - x0, y1 - y0);
  const step = Math.max(2, radius * 0.28);
  const steps = Math.max(1, Math.ceil(dist / step));

  ctx.save();
  if (isErase) {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (isErase) {
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
    } else {
      drawSoftDab(ctx, x, y, radius, color);
    }
  }
  ctx.restore();
}

export function drawPatternStamp(
  ctx: CanvasRenderingContext2D,
  stampId: PatternStampId,
  cx: number,
  cy: number,
  size: number,
  color: string,
  rotation: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  if (stampId === 'blush') {
    const grad = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * 0.6);
    grad.addColorStop(0, color);
    grad.addColorStop(0.55, color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.62, size * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'star') {
    const spikes = 5;
    const outerR = size * 0.55;
    const innerR = size * 0.25;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'heart') {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.75);
    ctx.bezierCurveTo(-s * 1.15, s * 0.05, -s * 0.85, -s * 0.9, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.85, -s * 0.9, s * 1.15, s * 0.05, 0, s * 0.75);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'flower') {
    const petalDist = size * 0.26;
    const petalR = size * 0.21;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * petalDist, Math.sin(a) * petalDist, petalR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD13B';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.17, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'butterfly') {
    const s = size * 0.48;
    ctx.beginPath();
    ctx.ellipse(-s * 0.45, -s * 0.25, s * 0.46, s * 0.34, -0.45, 0, Math.PI * 2);
    ctx.ellipse(s * 0.45, -s * 0.25, s * 0.46, s * 0.34, 0.45, 0, Math.PI * 2);
    ctx.ellipse(-s * 0.38, s * 0.32, s * 0.34, s * 0.25, 0.45, 0, Math.PI * 2);
    ctx.ellipse(s * 0.38, s * 0.32, s * 0.34, s * 0.25, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.12, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'dots') {
    const offsets = [
      { dx: -0.26, dy: -0.14, r: 0.11 },
      { dx: 0.04, dy: -0.22, r: 0.13 },
      { dx: 0.28, dy: -0.05, r: 0.1 },
      { dx: -0.12, dy: 0.14, r: 0.12 },
      { dx: 0.18, dy: 0.2, r: 0.09 },
    ];
    offsets.forEach((o) => {
      ctx.beginPath();
      ctx.arc(o.dx * size, o.dy * size, o.r * size, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (stampId === 'sun') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * size * 0.34, Math.sin(a) * size * 0.34);
      ctx.lineTo(Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5);
      ctx.stroke();
    }
  } else if (stampId === 'moon') {
    const r = size * 0.44;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.35 * Math.PI, 1.65 * Math.PI, false);
    ctx.arc(r * 0.45, -r * 0.1, r * 0.78, 1.55 * Math.PI, 0.45 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'cloud') {
    ctx.beginPath();
    ctx.arc(-size * 0.2, size * 0.08, size * 0.22, 0, Math.PI * 2);
    ctx.arc(0, -size * 0.06, size * 0.27, 0, Math.PI * 2);
    ctx.arc(size * 0.24, size * 0.08, size * 0.21, 0, Math.PI * 2);
    ctx.fillRect(-size * 0.22, size * 0.04, size * 0.46, size * 0.26);
    ctx.fill();
  } else if (stampId === 'crown') {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, s * 0.65);
    ctx.lineTo(-s, -s * 0.35);
    ctx.lineTo(-s * 0.4, s * 0.1);
    ctx.lineTo(0, -s * 0.65);
    ctx.lineTo(s * 0.4, s * 0.1);
    ctx.lineTo(s, -s * 0.35);
    ctx.lineTo(s * 0.9, s * 0.65);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'paw') {
    ctx.beginPath();
    ctx.ellipse(0, size * 0.16, size * 0.26, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    const toes = [
      { x: -0.28, y: -0.14 },
      { x: -0.1, y: -0.28 },
      { x: 0.1, y: -0.28 },
      { x: 0.28, y: -0.14 },
    ];
    toes.forEach((t) => {
      ctx.beginPath();
      ctx.arc(t.x * size, t.y * size, size * 0.095, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (stampId === 'lightning') {
    const s = size * 0.52;
    ctx.beginPath();
    ctx.moveTo(s * 0.18, -s);
    ctx.lineTo(-s * 0.45, s * 0.05);
    ctx.lineTo(-s * 0.02, s * 0.05);
    ctx.lineTo(-s * 0.2, s);
    ctx.lineTo(s * 0.45, -s * 0.08);
    ctx.lineTo(s * 0.02, -s * 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'spiral') {
    ctx.lineWidth = Math.max(2.5, size * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const turns = 2.4;
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      const r = t * size * 0.45;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  } else if (stampId === 'leaf') {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, s * 0.7);
    ctx.quadraticCurveTo(-s * 0.8, -s * 0.6, s * 0.8, -s * 0.75);
    ctx.quadraticCurveTo(s * 0.6, s * 0.8, -s * 0.75, s * 0.7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, s * 0.5);
    ctx.lineTo(s * 0.45, -s * 0.42);
    ctx.stroke();
  } else if (stampId === 'sparkle') {
    const r = size * 0.54;
    const inner = size * 0.16;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(inner * 0.3, -inner * 0.3, r, 0);
    ctx.quadraticCurveTo(inner * 0.3, inner * 0.3, 0, r);
    ctx.quadraticCurveTo(-inner * 0.3, inner * 0.3, -r, 0);
    ctx.quadraticCurveTo(-inner * 0.3, -inner * 0.3, 0, -r);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'diamond') {
    const s = size * 0.52;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.65);
    ctx.lineTo(s * 0.5, -s * 0.65);
    ctx.lineTo(s * 0.95, -s * 0.12);
    ctx.lineTo(0, s * 0.85);
    ctx.lineTo(-s * 0.95, -s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, -s * 0.12);
    ctx.lineTo(s * 0.9, -s * 0.12);
    ctx.moveTo(-s * 0.4, -s * 0.12);
    ctx.lineTo(0, s * 0.82);
    ctx.lineTo(s * 0.4, -s * 0.12);
    ctx.stroke();
  } else if (stampId === 'music') {
    const s = size * 0.5;
    ctx.lineWidth = Math.max(2.5, size * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.45);
    ctx.lineTo(-s * 0.3, -s * 0.55);
    ctx.lineTo(s * 0.55, -s * 0.75);
    ctx.lineTo(s * 0.55, s * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-s * 0.48, s * 0.48, s * 0.26, s * 0.2, -0.3, 0, Math.PI * 2);
    ctx.ellipse(s * 0.37, s * 0.28, s * 0.26, s * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'snow') {
    const r = size * 0.5;
    ctx.lineWidth = Math.max(2.2, size * 0.09);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dx * r, dy * r);
      ctx.stroke();
      const bx = dx * r * 0.62;
      const by = dy * r * 0.62;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a + 0.7) * r * 0.28, by + Math.sin(a + 0.7) * r * 0.28);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a - 0.7) * r * 0.28, by + Math.sin(a - 0.7) * r * 0.28);
      ctx.stroke();
    }
  } else if (stampId === 'clover') {
    const d = size * 0.21;
    const r = size * 0.21;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = Math.max(2.5, size * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.15);
    ctx.quadraticCurveTo(size * 0.05, size * 0.42, -size * 0.08, size * 0.54);
    ctx.stroke();
  } else if (stampId === 'apple') {
    const s = size * 0.48;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.bezierCurveTo(-s * 0.7, -s * 0.75, -s * 1.05, s * 0.15, -s * 0.25, s * 0.75);
    ctx.quadraticCurveTo(0, s * 0.6, s * 0.25, s * 0.75);
    ctx.bezierCurveTo(s * 1.05, s * 0.15, s * 0.7, -s * 0.75, 0, -s * 0.42);
    ctx.fill();
    ctx.fillStyle = '#10C97A';
    ctx.beginPath();
    ctx.ellipse(s * 0.26, -s * 0.65, s * 0.25, s * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'smile') {
    const r = size * 0.46;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(-r * 0.34, -r * 0.18, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.34, -r * 0.18, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.45, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (stampId === 'wave') {
    const s = size * 0.5;
    ctx.lineWidth = Math.max(2.5, size * 0.12);
    ctx.lineCap = 'round';
    for (let row = -1; row <= 1; row += 2) {
      const oy = row * s * 0.28;
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, oy);
      ctx.quadraticCurveTo(-s * 0.45, oy - s * 0.35, 0, oy);
      ctx.quadraticCurveTo(s * 0.45, oy + s * 0.35, s * 0.9, oy);
      ctx.stroke();
    }
  } else if (stampId === 'shell') {
    const r = size * 0.48;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.65);
    ctx.arc(0, r * 0.12, r * 0.88, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.52);
      ctx.lineTo(i * r * 0.28, -r * 0.48);
      ctx.stroke();
    }
  } else if (stampId === 'rainbow_arc') {
    const bands = ['#FF3B5C', '#FFD13B', '#38BDF8'];
    const baseR = size * 0.46;
    ctx.lineWidth = Math.max(2.5, size * 0.13);
    ctx.lineCap = 'round';
    bands.forEach((bColor, idx) => {
      ctx.strokeStyle = idx === 0 ? color : bColor;
      ctx.beginPath();
      ctx.arc(0, size * 0.18, baseR - idx * size * 0.14, Math.PI, 0, false);
      ctx.stroke();
    });
  } else if (stampId === 'bow_stamp') {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-s * 0.92, -s * 0.56);
    ctx.quadraticCurveTo(-s * 1.05, 0, -s * 0.92, s * 0.56);
    ctx.closePath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.92, -s * 0.56);
    ctx.quadraticCurveTo(s * 1.05, 0, s * 0.92, s * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'swirl') {
    ctx.lineWidth = Math.max(2.2, size * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      const a = t * Math.PI * 3.5;
      const r = t * size * 0.44;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      const a = t * Math.PI * 3.5 + Math.PI;
      const r = t * size * 0.44;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  } else if (stampId === 'double_heart') {
    const drawMiniHeart = (hx: number, hy: number, hs: number) => {
      ctx.beginPath();
      ctx.moveTo(hx, hy + hs * 0.75);
      ctx.bezierCurveTo(hx - hs * 1.1, hy + hs * 0.05, hx - hs * 0.85, hy - hs * 0.85, hx, hy - hs * 0.28);
      ctx.bezierCurveTo(hx + hs * 0.85, hy - hs * 0.85, hx + hs * 1.1, hy + hs * 0.05, hx, hy + hs * 0.75);
      ctx.fill();
    };
    drawMiniHeart(-size * 0.2, -size * 0.08, size * 0.28);
    drawMiniHeart(size * 0.22, size * 0.12, size * 0.22);
  } else if (stampId === 'triple_star') {
    const pts = [
      { x: 0, y: -size * 0.22, r: size * 0.26 },
      { x: -size * 0.28, y: size * 0.22, r: size * 0.18 },
      { x: size * 0.28, y: size * 0.18, r: size * 0.16 },
    ];
    pts.forEach((p) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? p.r : p.r * 0.45;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad);
        else ctx.lineTo(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    });
  } else if (stampId === 'comet') {
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(size * 0.05, -size * 0.05);
    ctx.lineTo(-size * 0.48, size * 0.32);
    ctx.moveTo(size * 0.1, size * 0.06);
    ctx.lineTo(-size * 0.36, size * 0.46);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size * 0.3 : size * 0.14;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const sx = size * 0.2 + Math.cos(a) * r;
      const sy = -size * 0.16 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'planet_stamp') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(2.2, size * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.48, size * 0.13, -0.32, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stampId === 'rocket_stamp') {
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.48, -s * 0.35, s * 0.32, s * 0.45);
    ctx.lineTo(-s * 0.32, s * 0.45);
    ctx.quadraticCurveTo(-s * 0.48, -s * 0.35, 0, -s);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.18);
    ctx.lineTo(-s * 0.62, s * 0.55);
    ctx.lineTo(-s * 0.25, s * 0.45);
    ctx.moveTo(s * 0.3, s * 0.18);
    ctx.lineTo(s * 0.62, s * 0.55);
    ctx.lineTo(s * 0.25, s * 0.45);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -s * 0.12, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'tulip') {
    const s = size * 0.46;
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, -s * 0.65);
    ctx.lineTo(-s * 0.2, -s * 0.28);
    ctx.lineTo(0, -s * 0.72);
    ctx.lineTo(s * 0.2, -s * 0.28);
    ctx.lineTo(s * 0.55, -s * 0.65);
    ctx.quadraticCurveTo(s * 0.6, s * 0.3, 0, s * 0.32);
    ctx.quadraticCurveTo(-s * 0.6, s * 0.3, -s * 0.55, -s * 0.65);
    ctx.fill();
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = Math.max(2.5, size * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.28);
    ctx.lineTo(0, s * 0.95);
    ctx.stroke();
  } else if (stampId === 'daisy') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * size * 0.27, Math.sin(a) * size * 0.27, size * 0.16, size * 0.09, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD13B';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'rose') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const a = t * Math.PI * 3.5;
      const r = t * size * 0.28;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  } else if (stampId === 'cactus') {
    ctx.lineWidth = Math.max(4, size * 0.18);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.4);
    ctx.lineTo(0, size * 0.42);
    ctx.moveTo(-size * 0.28, -size * 0.08);
    ctx.lineTo(-size * 0.28, size * 0.08);
    ctx.lineTo(0, size * 0.08);
    ctx.moveTo(size * 0.28, -size * 0.16);
    ctx.lineTo(size * 0.28, size * 0.02);
    ctx.lineTo(0, size * 0.02);
    ctx.stroke();
  } else if (stampId === 'mushroom') {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-size * 0.12, 0, size * 0.24, size * 0.42);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, size * 0.06, size * 0.44, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-size * 0.16, -size * 0.14, size * 0.07, 0, Math.PI * 2);
    ctx.arc(size * 0.16, -size * 0.1, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'acorn') {
    ctx.beginPath();
    ctx.ellipse(0, size * 0.14, size * 0.26, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(0, -size * 0.04, size * 0.32, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.34);
    ctx.lineTo(size * 0.08, -size * 0.48);
    ctx.stroke();
  } else if (stampId === 'cherry_stamp') {
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * 0.22, size * 0.18);
    ctx.quadraticCurveTo(-size * 0.05, -size * 0.24, size * 0.06, -size * 0.4);
    ctx.quadraticCurveTo(size * 0.16, -size * 0.2, size * 0.22, size * 0.18);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-size * 0.22, size * 0.24, size * 0.18, 0, Math.PI * 2);
    ctx.arc(size * 0.22, size * 0.24, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'berry') {
    const s = size * 0.44;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.95);
    ctx.bezierCurveTo(-s * 0.95, s * 0.35, -s * 0.8, -s * 0.55, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.8, -s * 0.55, s * 0.95, s * 0.35, 0, s * 0.95);
    ctx.fill();
    ctx.fillStyle = '#10C97A';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.52, s * 0.45, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'lemon') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.46, size * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-size * 0.42, size * 0.14, size * 0.08, 0, Math.PI * 2);
    ctx.arc(size * 0.42, -size * 0.14, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'candy') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.24, 0);
    ctx.lineTo(-size * 0.48, -size * 0.22);
    ctx.lineTo(-size * 0.48, size * 0.22);
    ctx.closePath();
    ctx.moveTo(size * 0.24, 0);
    ctx.lineTo(size * 0.48, -size * 0.22);
    ctx.lineTo(size * 0.48, size * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'lollipop_stamp') {
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.08);
    ctx.lineTo(0, size * 0.48);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -size * 0.14, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(1.8, size * 0.06);
    ctx.beginPath();
    ctx.arc(0, -size * 0.14, size * 0.16, 0, Math.PI * 1.5);
    ctx.stroke();
  } else if (stampId === 'cupcake_stamp') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, size * 0.04);
    ctx.lineTo(size * 0.28, size * 0.04);
    ctx.lineTo(size * 0.2, size * 0.42);
    ctx.lineTo(-size * 0.2, size * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, size * 0.04, size * 0.32, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FF3B5C';
    ctx.beginPath();
    ctx.arc(0, -size * 0.32, size * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'donut_stamp') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'icecream_stamp') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-size * 0.24, 0);
    ctx.lineTo(size * 0.24, 0);
    ctx.lineTo(0, size * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -size * 0.14, size * 0.27, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'cat_face') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.34, -size * 0.06);
    ctx.lineTo(-size * 0.38, -size * 0.44);
    ctx.lineTo(-size * 0.08, -size * 0.28);
    ctx.moveTo(size * 0.34, -size * 0.06);
    ctx.lineTo(size * 0.38, -size * 0.44);
    ctx.lineTo(size * 0.08, -size * 0.28);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, size * 0.04, size * 0.38, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-size * 0.14, 0, size * 0.05, 0, Math.PI * 2);
    ctx.arc(size * 0.14, 0, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'bunny_face') {
    ctx.beginPath();
    ctx.ellipse(-size * 0.16, -size * 0.24, size * 0.1, size * 0.26, -0.15, 0, Math.PI * 2);
    ctx.ellipse(size * 0.16, -size * 0.24, size * 0.1, size * 0.26, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, size * 0.14, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-size * 0.11, size * 0.1, size * 0.045, 0, Math.PI * 2);
    ctx.arc(size * 0.11, size * 0.1, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'bear_face') {
    ctx.beginPath();
    ctx.arc(-size * 0.28, -size * 0.24, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.28, -size * 0.24, size * 0.15, 0, Math.PI * 2);
    ctx.arc(0, size * 0.06, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.16, size * 0.14, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'fish_stamp') {
    ctx.beginPath();
    ctx.moveTo(size * 0.22, 0);
    ctx.lineTo(size * 0.5, -size * 0.24);
    ctx.lineTo(size * 0.5, size * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-size * 0.08, 0, size * 0.36, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-size * 0.26, -size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'bird') {
    ctx.beginPath();
    ctx.ellipse(-size * 0.04, size * 0.06, size * 0.32, size * 0.24, 0, 0, Math.PI * 2);
    ctx.arc(size * 0.18, -size * 0.16, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF9F1C';
    ctx.beginPath();
    ctx.moveTo(size * 0.34, -size * 0.2);
    ctx.lineTo(size * 0.5, -size * 0.12);
    ctx.lineTo(size * 0.34, -size * 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'whale_stamp') {
    ctx.beginPath();
    ctx.ellipse(-size * 0.08, size * 0.08, size * 0.36, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.24, size * 0.08);
    ctx.lineTo(size * 0.48, -size * 0.14);
    ctx.lineTo(size * 0.46, size * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, -size * 0.18);
    ctx.quadraticCurveTo(-size * 0.18, -size * 0.4, -size * 0.28, -size * 0.3);
    ctx.moveTo(-size * 0.08, -size * 0.18);
    ctx.quadraticCurveTo(size * 0.04, -size * 0.4, size * 0.14, -size * 0.3);
    ctx.stroke();
  } else if (stampId === 'ladybug_stamp') {
    ctx.beginPath();
    ctx.arc(0, size * 0.06, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, -size * 0.28, size * 0.14, 0, Math.PI * 2);
    ctx.arc(-size * 0.14, size * 0.04, size * 0.06, 0, Math.PI * 2);
    ctx.arc(size * 0.14, size * 0.04, size * 0.06, 0, Math.PI * 2);
    ctx.arc(0, size * 0.2, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'bee_stamp') {
    ctx.fillStyle = 'rgba(186,230,253,0.9)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.14, -size * 0.22, size * 0.14, size * 0.2, -0.3, 0, Math.PI * 2);
    ctx.ellipse(size * 0.14, -size * 0.22, size * 0.14, size * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.08, size * 0.34, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, -size * 0.12);
    ctx.lineTo(-size * 0.08, size * 0.28);
    ctx.moveTo(size * 0.1, -size * 0.12);
    ctx.lineTo(size * 0.1, size * 0.28);
    ctx.stroke();
  } else if (stampId === 'snail') {
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * 0.36, size * 0.28);
    ctx.lineTo(size * 0.4, size * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-size * 0.06, -size * 0.02, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'feather') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.46, size * 0.18, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(-size * 0.34, size * 0.26);
    ctx.lineTo(size * 0.34, -size * 0.26);
    ctx.stroke();
  } else if (stampId === 'wing') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.42, size * 0.2);
    ctx.quadraticCurveTo(-size * 0.36, -size * 0.44, size * 0.46, -size * 0.34);
    ctx.quadraticCurveTo(size * 0.2, size * 0.34, -size * 0.42, size * 0.2);
    ctx.fill();
  } else if (stampId === 'angel_halo') {
    ctx.lineWidth = Math.max(2.5, size * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.44, size * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stampId === 'balloon_stamp') {
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.12, size * 0.28, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.8, size * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.22);
    ctx.quadraticCurveTo(size * 0.1, size * 0.35, -size * 0.06, size * 0.48);
    ctx.stroke();
  } else if (stampId === 'flag') {
    ctx.lineWidth = Math.max(2.2, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * 0.24, -size * 0.44);
    ctx.lineTo(-size * 0.24, size * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.22, -size * 0.42);
    ctx.lineTo(size * 0.4, -size * 0.2);
    ctx.lineTo(-size * 0.22, 0);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'anchor') {
    ctx.lineWidth = Math.max(2.4, size * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.36);
    ctx.lineTo(0, size * 0.36);
    ctx.moveTo(-size * 0.2, -size * 0.16);
    ctx.lineTo(size * 0.2, -size * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, size * 0.08, size * 0.34, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();
  } else if (stampId === 'boat') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.46);
    ctx.lineTo(size * 0.32, size * 0.08);
    ctx.lineTo(0, size * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 0.44, size * 0.14);
    ctx.lineTo(size * 0.44, size * 0.14);
    ctx.lineTo(size * 0.3, size * 0.42);
    ctx.lineTo(-size * 0.3, size * 0.42);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'car_stamp') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.44, size * 0.16);
    ctx.lineTo(-size * 0.36, -size * 0.04);
    ctx.lineTo(-size * 0.18, -size * 0.26);
    ctx.lineTo(size * 0.2, -size * 0.26);
    ctx.lineTo(size * 0.38, -size * 0.04);
    ctx.lineTo(size * 0.46, size * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(-size * 0.24, size * 0.22, size * 0.13, 0, Math.PI * 2);
    ctx.arc(size * 0.24, size * 0.22, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'airplane') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.48, 0);
    ctx.lineTo(-size * 0.1, -size * 0.08);
    ctx.lineTo(size * 0.08, -size * 0.46);
    ctx.lineTo(size * 0.22, -size * 0.46);
    ctx.lineTo(size * 0.14, -size * 0.08);
    ctx.lineTo(size * 0.48, 0);
    ctx.lineTo(size * 0.14, size * 0.08);
    ctx.lineTo(size * 0.22, size * 0.46);
    ctx.lineTo(size * 0.08, size * 0.46);
    ctx.lineTo(-size * 0.1, size * 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (stampId === 'train_stamp') {
    ctx.fillRect(-size * 0.42, -size * 0.22, size * 0.32, size * 0.44);
    ctx.fillRect(-size * 0.1, -size * 0.06, size * 0.5, size * 0.28);
    ctx.fillRect(size * 0.2, -size * 0.28, size * 0.14, size * 0.22);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(-size * 0.26, size * 0.28, size * 0.11, 0, Math.PI * 2);
    ctx.arc(size * 0.04, size * 0.28, size * 0.1, 0, Math.PI * 2);
    ctx.arc(size * 0.28, size * 0.28, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'umbrella') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.44, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, size * 0.36);
    ctx.arc(-size * 0.09, size * 0.36, size * 0.09, 0, Math.PI, false);
    ctx.stroke();
  } else if (stampId === 'raindrop') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.48);
    ctx.bezierCurveTo(size * 0.38, 0, size * 0.38, size * 0.46, 0, size * 0.46);
    ctx.bezierCurveTo(-size * 0.38, size * 0.46, -size * 0.38, 0, 0, -size * 0.48);
    ctx.fill();
  } else if (stampId === 'fire') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.bezierCurveTo(size * 0.42, -size * 0.12, size * 0.42, size * 0.46, 0, size * 0.46);
    ctx.bezierCurveTo(-size * 0.42, size * 0.46, -size * 0.42, -size * 0.12, 0, -size * 0.5);
    ctx.fill();
    ctx.fillStyle = '#FFD13B';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.18, size * 0.14, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'gem_oval') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.3, size * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.16, size * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stampId === 'key') {
    ctx.lineWidth = Math.max(2.4, size * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-size * 0.22, 0, size * 0.16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.06, 0);
    ctx.lineTo(size * 0.42, 0);
    ctx.lineTo(size * 0.42, size * 0.16);
    ctx.moveTo(size * 0.26, 0);
    ctx.lineTo(size * 0.26, size * 0.14);
    ctx.stroke();
  } else if (stampId === 'bell') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.36, size * 0.24);
    ctx.quadraticCurveTo(-size * 0.3, -size * 0.38, 0, -size * 0.38);
    ctx.quadraticCurveTo(size * 0.3, -size * 0.38, size * 0.36, size * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, size * 0.32, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (stampId === 'treble_clef') {
    ctx.lineWidth = Math.max(2.4, size * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(size * 0.04, size * 0.42);
    ctx.lineTo(size * 0.04, -size * 0.44);
    ctx.quadraticCurveTo(size * 0.28, -size * 0.32, 0, -size * 0.08);
    ctx.quadraticCurveTo(-size * 0.32, size * 0.16, 0, size * 0.28);
    ctx.quadraticCurveTo(size * 0.26, size * 0.26, size * 0.18, size * 0.04);
    ctx.stroke();
  } else if (stampId === 'paw_double') {
    const drawMiniPaw = (px: number, py: number, ps: number) => {
      ctx.beginPath();
      ctx.ellipse(px, py + ps * 0.14, ps * 0.24, ps * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      [-0.24, -0.08, 0.08, 0.24].forEach((tx, idx) => {
        ctx.beginPath();
        ctx.arc(px + tx * ps, py - (idx === 1 || idx === 2 ? 0.24 : 0.12) * ps, ps * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    drawMiniPaw(-size * 0.2, -size * 0.14, size * 0.56);
    drawMiniPaw(size * 0.2, size * 0.18, size * 0.52);
  } else if (stampId === 'kiss') {
    ctx.beginPath();
    ctx.moveTo(-size * 0.42, 0);
    ctx.quadraticCurveTo(-size * 0.18, -size * 0.28, 0, -size * 0.12);
    ctx.quadraticCurveTo(size * 0.18, -size * 0.28, size * 0.42, 0);
    ctx.quadraticCurveTo(0, size * 0.34, -size * 0.42, 0);
    ctx.fill();
  } else if (stampId === 'wink') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.fillStyle = '#1E293B';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-size * 0.14, -size * 0.08, size * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.06, -size * 0.08);
    ctx.quadraticCurveTo(size * 0.15, -size * 0.16, size * 0.24, -size * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, size * 0.04, size * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (stampId === 'confetti_stamp') {
    const pieces = [
      { x: -0.26, y: -0.24, r: 0.08, c: color },
      { x: 0.24, y: -0.2, r: 0.07, c: '#FFD13B' },
      { x: 0, y: 0, r: 0.09, c: '#38BDF8' },
      { x: -0.22, y: 0.24, r: 0.07, c: '#FF5CA8' },
      { x: 0.26, y: 0.22, r: 0.08, c: '#10C97A' },
    ];
    pieces.forEach((p) => {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x * size, p.y * size, p.r * size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

export function renderPaintOperations(
  ctx: CanvasRenderingContext2D,
  ops: PaintOperation[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  for (const op of ops) {
    if (op.kind === 'stroke' || op.kind === 'erase') {
      const isErase = op.kind === 'erase';
      if (op.points.length === 1) {
        drawStrokeSegment(
          ctx,
          op.points[0],
          op.points[0],
          width,
          height,
          op.radiusRatio,
          isErase ? '#000000' : op.color,
          isErase
        );
      } else {
        for (let i = 1; i < op.points.length; i++) {
          drawStrokeSegment(
            ctx,
            op.points[i - 1],
            op.points[i],
            width,
            height,
            op.radiusRatio,
            isErase ? '#000000' : op.color,
            isErase
          );
        }
      }
    } else if (op.kind === 'stamp') {
      drawPatternStamp(
        ctx,
        op.stampId,
        op.x * width,
        op.y * height,
        op.sizeRatio * width,
        op.color,
        op.rotation
      );
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function exportArtworkToPng(params: {
  characterImageSrc: string;
  faceArtMask?: PlacedFaceArtMask | null;
  paintOps: PaintOperation[];
  stickers: PlacedSticker[];
}): Promise<{ blob: Blob; dataUrl: string }> {
  const EXPORT_W = 1080;
  const EXPORT_H = 1440;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = EXPORT_W;
  outCanvas.height = EXPORT_H;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  // 1. Clean white portrait background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  // 2. Character portrait rendered with exact object-cover center crop
  const baseImg = await loadImage(params.characterImageSrc);
  const imgRatio = baseImg.naturalWidth / baseImg.naturalHeight;
  const targetRatio = EXPORT_W / EXPORT_H;

  let drawW = EXPORT_W;
  let drawH = EXPORT_H;
  let drawX = 0;
  let drawY = 0;

  if (imgRatio > targetRatio) {
    drawH = EXPORT_H;
    drawW = EXPORT_H * imgRatio;
    drawX = (EXPORT_W - drawW) / 2;
  } else {
    drawW = EXPORT_W;
    drawH = EXPORT_W / imgRatio;
    drawY = (EXPORT_H - drawH) / 2;
  }
  ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);

  // 2.5. Full Face-Art Mask (Аквагрим) overlay if applied
  if (params.faceArtMask) {
    const maskDef = FACE_ART_MASKS.find((m) => m.id === params.faceArtMask?.maskId);
    if (maskDef) {
      try {
        const maskImg = await loadImage(getFaceMaskAssetUrl(maskDef.id, maskDef.svg)).catch(() =>
          loadImage(faceArtMaskToDataUrl(maskDef.svg))
        );
        const mw = maskDef.baseWidthRatio * EXPORT_W * params.faceArtMask.scale;
        const aspect = maskImg.naturalHeight > 0 ? maskImg.naturalWidth / maskImg.naturalHeight : maskDef.aspectRatio;
        const mh = mw / aspect;
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.translate(params.faceArtMask.x * EXPORT_W, params.faceArtMask.y * EXPORT_H);
        ctx.rotate(params.faceArtMask.rotation);
        ctx.drawImage(maskImg, -mw / 2, -mh / 2, mw, mh);
        ctx.restore();
      } catch {
        // Skip failed mask image
      }
    }
  }

  // 3. Paint layer rendered onto temp canvas so destination-out erasers work properly
  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = EXPORT_W;
  paintCanvas.height = EXPORT_H;
  const paintCtx = paintCanvas.getContext('2d');
  if (paintCtx) {
    renderPaintOperations(paintCtx, params.paintOps, EXPORT_W, EXPORT_H);
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.drawImage(paintCanvas, 0, 0);
    ctx.restore();
  }

  // 4. Stickers rendered crisply on top
  for (const placed of params.stickers) {
    const def = STICKERS.find((s) => s.id === placed.stickerId);
    if (!def) continue;
    try {
      const stickerImg = await loadImage(getStickerAssetUrl(def.id, def.svg)).catch(() =>
        loadImage(stickerToDataUrl(def.svg))
      );
      const w = def.baseWidthRatio * EXPORT_W * placed.scale;
      const aspect = stickerImg.naturalHeight > 0 ? stickerImg.naturalWidth / stickerImg.naturalHeight : def.aspectRatio;
      const h = w / aspect;
      ctx.save();
      ctx.translate(placed.x * EXPORT_W, placed.y * EXPORT_H);
      ctx.rotate(placed.rotation);
      ctx.drawImage(stickerImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    } catch {
      // Skip failed sticker image
    }
  }

  const dataUrl = outCanvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to export PNG blob'));
    }, 'image/png');
  });

  return { blob, dataUrl };
}

export const TSHIRT_SVG_PATH =
  'M 182 184 Q 240 226 298 184 L 368 196 L 456 266 L 414 342 L 364 314 L 364 600 Q 240 610 116 600 L 116 314 L 66 342 L 24 266 L 112 196 Z';

export function buildTShirtPath2D(width: number, height: number): Path2D {
  const sx = width / 480;
  const sy = height / 640;
  const p = new Path2D();
  p.moveTo(182 * sx, 184 * sy);
  p.quadraticCurveTo(240 * sx, 226 * sy, 298 * sx, 184 * sy);
  p.lineTo(368 * sx, 196 * sy);
  p.lineTo(456 * sx, 266 * sy);
  p.lineTo(414 * sx, 342 * sy);
  p.lineTo(364 * sx, 314 * sy);
  p.lineTo(364 * sx, 600 * sy);
  p.quadraticCurveTo(240 * sx, 610 * sy, 116 * sx, 600 * sy);
  p.lineTo(116 * sx, 314 * sy);
  p.lineTo(66 * sx, 342 * sy);
  p.lineTo(24 * sx, 266 * sy);
  p.lineTo(112 * sx, 196 * sy);
  p.closePath();
  return p;
}

export async function exportTShirtArtworkToPng(params: {
  characterImageSrc: string;
  characterAccentBg: string;
  tshirtColor: string;
  paintOps: PaintOperation[];
  stickers: PlacedSticker[];
}): Promise<{ blob: Blob; dataUrl: string }> {
  const EXPORT_W = 1080;
  const EXPORT_H = 1440;
  const sx = EXPORT_W / 480;
  const sy = EXPORT_H / 640;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = EXPORT_W;
  outCanvas.height = EXPORT_H;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  // 1. Warm studio backdrop
  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  // 2. Character portrait circle at top above collar
  const cx = 240 * sx;
  const cy = 94 * sy;
  const r = 68 * sx;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = params.characterAccentBg;
  ctx.fill();
  ctx.clip();

  try {
    const baseImg = await loadImage(params.characterImageSrc);
    const boxSize = r * 2;
    const imgRatio = baseImg.naturalWidth / baseImg.naturalHeight;
    let drawW = boxSize;
    let drawH = boxSize;
    if (imgRatio > 1) {
      drawW = boxSize * imgRatio;
    } else {
      drawH = boxSize / imgRatio;
    }
    const drawX = cx - drawW / 2;
    const drawY = cy - drawH * 0.42;
    ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);
  } catch {
    // Keep accent background circle if image fails
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6 * sx;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.restore();

  // 3. T-shirt base fill + outline
  const shirtPath = buildTShirtPath2D(EXPORT_W, EXPORT_H);
  ctx.save();
  ctx.shadowColor = 'rgba(36, 33, 29, 0.12)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = params.tshirtColor;
  ctx.fill(shirtPath);
  ctx.restore();

  // 4. Clipped paint layer inside T-shirt
  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = EXPORT_W;
  paintCanvas.height = EXPORT_H;
  const paintCtx = paintCanvas.getContext('2d');
  if (paintCtx) {
    renderPaintOperations(paintCtx, params.paintOps, EXPORT_W, EXPORT_H);
    ctx.save();
    ctx.clip(shirtPath);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(paintCanvas, 0, 0);
    ctx.restore();
  }

  // 5. Subtle T-shirt collar & seam lines + outer outline
  ctx.save();
  ctx.lineWidth = 4 * sx;
  ctx.strokeStyle = 'rgba(36, 33, 29, 0.16)';
  ctx.stroke(shirtPath);

  ctx.beginPath();
  ctx.moveTo(174 * sx, 185 * sy);
  ctx.quadraticCurveTo(240 * sx, 240 * sy, 306 * sx, 185 * sy);
  ctx.lineWidth = 5 * sx;
  ctx.strokeStyle = 'rgba(36, 33, 29, 0.14)';
  ctx.stroke();
  ctx.restore();

  // 6. Clipped stickers/images on top of T-shirt
  ctx.save();
  ctx.clip(shirtPath);
  for (const placed of params.stickers) {
    const def = STICKERS.find((s) => s.id === placed.stickerId);
    if (!def) continue;
    try {
      const stickerImg = await loadImage(getStickerAssetUrl(def.id, def.svg)).catch(() =>
        loadImage(stickerToDataUrl(def.svg))
      );
      const w = def.baseWidthRatio * EXPORT_W * placed.scale;
      const aspect = stickerImg.naturalHeight > 0 ? stickerImg.naturalWidth / stickerImg.naturalHeight : def.aspectRatio;
      const h = w / aspect;
      ctx.save();
      ctx.translate(placed.x * EXPORT_W, placed.y * EXPORT_H);
      ctx.rotate(placed.rotation);
      ctx.drawImage(stickerImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    } catch {
      // Skip failed sticker image
    }
  }
  ctx.restore();

  const dataUrl = outCanvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to export PNG blob'));
    }, 'image/png');
  });

  return { blob, dataUrl };
}

export async function exportWashArtworkToPng(params: {
  characterId: string;
  characterImageSrc: string;
  washState: CharacterWashState;
}): Promise<{ blob: Blob; dataUrl: string }> {
  const EXPORT_W = 1080;
  const EXPORT_H = 1440;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = EXPORT_W;
  outCanvas.height = EXPORT_H;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  const baseImg = await loadImage(params.characterImageSrc);
  const imgRatio = baseImg.naturalWidth / baseImg.naturalHeight;
  const targetRatio = EXPORT_W / EXPORT_H;
  let drawW = EXPORT_W;
  let drawH = EXPORT_H;
  let drawX = 0;
  let drawY = 0;
  if (imgRatio > targetRatio) {
    drawH = EXPORT_H;
    drawW = EXPORT_H * imgRatio;
    drawX = (EXPORT_W - drawW) / 2;
  } else {
    drawW = EXPORT_W;
    drawH = EXPORT_W / imgRatio;
    drawY = (EXPORT_H - drawH) / 2;
  }
  ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);

  if (!params.washState.celebrated) {
    const dirtCanvas = document.createElement('canvas');
    dirtCanvas.width = EXPORT_W;
    dirtCanvas.height = EXPORT_H;
    const foamCanvas = document.createElement('canvas');
    foamCanvas.width = EXPORT_W;
    foamCanvas.height = EXPORT_H;
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = EXPORT_W;
    waterCanvas.height = EXPORT_H;
    const dCtx = dirtCanvas.getContext('2d');
    const fCtx = foamCanvas.getContext('2d');
    const wCtx = waterCanvas.getContext('2d');
    if (dCtx && fCtx && wCtx) {
      renderFullWashLayers(
        dCtx,
        fCtx,
        wCtx,
        EXPORT_W,
        EXPORT_H,
        params.characterId,
        params.washState
      );
      ctx.drawImage(dirtCanvas, 0, 0);
      ctx.drawImage(foamCanvas, 0, 0);
      ctx.drawImage(waterCanvas, 0, 0);
    }
  }

  const dataUrl = outCanvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to export PNG blob'));
    }, 'image/png');
  });

  return { blob, dataUrl };
}

export async function exportKitchenArtworkToPng(params: {
  characterImageSrc: string;
  characterAccentBg: string;
  svgElement: SVGSVGElement | null;
}): Promise<{ blob: Blob; dataUrl: string }> {
  const EXPORT_W = 1080;
  const EXPORT_H = 1440;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = EXPORT_W;
  outCanvas.height = EXPORT_H;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  ctx.fillStyle = '#FFFDF8';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  // Character portrait circle at top
  const cx = 540;
  const cy = 190;
  const r = 135;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = params.characterAccentBg;
  ctx.fill();
  ctx.clip();
  try {
    const baseImg = await loadImage(params.characterImageSrc);
    const boxSize = r * 2;
    const imgRatio = baseImg.naturalWidth / baseImg.naturalHeight;
    let drawW = boxSize;
    let drawH = boxSize;
    if (imgRatio > 1) drawW = boxSize * imgRatio;
    else drawH = boxSize / imgRatio;
    ctx.drawImage(baseImg, cx - drawW / 2, cy - drawH * 0.42, drawW, drawH);
  } catch {
    // Keep accent bg
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.restore();

  // Vector food/drink scene below character
  if (params.svgElement) {
    const serializer = new XMLSerializer();
    const rawSvg = serializer.serializeToString(params.svgElement);
    const svgWithNs = rawSvg.includes('xmlns=')
      ? rawSvg
      : rawSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithNs)}`;
    try {
      const foodImg = await loadImage(svgDataUrl);
      ctx.drawImage(foodImg, 30, 355, 1020, 978);
    } catch {
      // Fallback safely
    }
  }

  const dataUrl = outCanvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to export PNG blob'));
    }, 'image/png');
  });

  return { blob, dataUrl };
}

