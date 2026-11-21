import { useEffect, useRef, useState } from 'react';
import { isVoicePlaying } from './voice';

/**
 * «Подуй в микрофон»: пока active — слушаем микрофон и зовём onBlow(сила 0..1) примерно 30 раз в секунду, когда ребёнок дует.
 * Дуновение = громкий шум на низких частотах дольше ~0.2 с. Пока говорит помощник — не слушаем (иначе примем его голос).
 * Без микрофона или без разрешения просто ничего не происходит — у каждой игры остаётся управление пальцем.
 */
export type BlowStatus = 'off' | 'asking' | 'on' | 'denied';

let sharedStream: MediaStream | null = null;
let sharedCtx: AudioContext | null = null;

export function useBlow(active: boolean, onBlow: (level: number) => void) {
  const [status, setStatus] = useState<BlowStatus>('off');
  const [level, setLevel] = useState(0);
  const cb = useRef(onBlow);
  cb.current = onBlow;

  useEffect(() => {
    if (!active) { setLevel(0); return; }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setStatus('denied'); return; }
    let raf = 0;
    let stopped = false;
    let src: MediaStreamAudioSourceNode | null = null;
    setStatus((s) => (s === 'on' ? s : 'asking'));
    (async () => {
      try {
        if (!sharedStream || sharedStream.getAudioTracks().every((t) => t.readyState === 'ended')) {
          sharedStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
        }
        if (stopped) return;
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        sharedCtx = sharedCtx ?? new AC();
        if (sharedCtx.state === 'suspended') await sharedCtx.resume().catch(() => undefined);
        src = sharedCtx.createMediaStreamSource(sharedStream);
        const an = sharedCtx.createAnalyser();
        an.fftSize = 512;
        an.smoothingTimeConstant = 0.3;
        src.connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        setStatus('on');
        let since = 0;
        let last = performance.now();
        let shown = 0;
        const tick = (now: number) => {
          const dt = now - last; last = now;
          an.getByteFrequencyData(buf);
          // низкие частоты (≈0–1.3 кГц): у дуновения там сплошной шум
          let low = 0;
          for (let i = 1; i < 15; i++) low += buf[i];
          let lv = Math.max(0, Math.min(1, (low / 14 / 255 - 0.32) / 0.45));
          if (isVoicePlaying()) lv = 0;
          since = lv > 0.12 ? since + dt : 0;
          const v = since > 180 ? lv : 0;
          if (v > 0) cb.current(v);
          if (Math.abs(v - shown) > 0.05) { shown = v; setLevel(v); }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!stopped) setStatus('denied');
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      try { src?.disconnect(); } catch { /* ignore */ }
      setLevel(0);
    };
  }, [active]);

  // когда игра закрыта — отпускаем микрофон
  useEffect(() => () => {
    if (sharedStream) { sharedStream.getTracks().forEach((t) => t.stop()); sharedStream = null; }
  }, []);

  return { status, level };
}
