import { playVoice, sayRandom } from './voice';
export interface PraisePhrase {
  id: string;
  text: string;
}

export const PRAISE_PHRASES: PraisePhrase[] = [
  { id: 'p01', text: "Ой, ты сам это придумал?" },
  { id: 'p02', text: "Нет, не может быть! Это чудесно!" },
  { id: 'p03', text: "Ух ты! Как красиво!" },
  { id: 'p04', text: "Вау! Настоящая магия!" },
  { id: 'p05', text: "Погоди, кто так здорово нарисовал?" },
  { id: 'p06', text: "Ой! Какая большая фантазия!" },
  { id: 'p07', text: "Такая милота! Обожаю!" },
  { id: 'p08', text: "Ты настоящий художник!" },
  { id: 'p09', text: "Ура! Какие яркие и весёлые цвета!" },
  { id: 'p10', text: "Ничего себе, какие цвета!" },
  { id: 'p11', text: "Ты сам выбрал? Здорово!" },
  { id: 'p12', text: "Ух ты! Просто супер!" },
  { id: 'p13', text: "Ой, мне очень нравится!" },
  { id: 'p14', text: "Как творчески! Молодец!" },
  { id: 'p15', text: "Смотри, как классно получилось!" },
  { id: 'p16', text: "Так держать, суперзвезда!" },
  { id: 'p17', text: "Как в сказке!" },
  { id: 'p18', text: "Ой, как аккуратно и красиво!" },
  { id: 'p19', text: "Ты маленький волшебник!" },
  { id: 'p20', text: "Какая весёлая идея!" },
  { id: 'p21', text: "Ура! Настоящий шедевр!" },
  { id: 'p22', text: "Ой, какие радостные цвета!" },
  { id: 'p23', text: "Как будто из мультика!" },
  { id: 'p24', text: "Ах, какая прелесть!" },
  { id: 'p25', text: "Да ты сегодня в ударе!" },
  { id: 'p26', text: "Браво! Хоть на выставку!" },
  { id: 'p27', text: "Смотри, какая счастливая улыбка! Супер!" },
  { id: 'p28', text: "Ничего себе, как стильно!" },
  { id: 'p29', text: "Ты всё сам украсил?" },
  { id: 'p30', text: "Фантастика! Как весело!" },
  { id: 'p31', text: "Ух ты, какой классный вид!" },
  { id: 'p32', text: "Чудесно! Не могу оторваться!" },
  { id: 'p33', text: "Ой, а что ты добавишь дальше?" },
  { id: 'p34', text: "Ха-ха, как игриво!" },
  { id: 'p35', text: "Круто! Они такие счастливые!" },
  { id: 'p36', text: "Блеск! Ты постарался на славу!" },
  { id: 'p37', text: "Ой, какой ты умный художник!" },
  { id: 'p38', text: "Вот это талант!" },
  { id: 'p39', text: "Так празднично и нарядно!" },
  { id: 'p40', text: "Супер-пупер красиво!" },
  { id: 'p41', text: "Ничего себе! Как оригинально!" },
  { id: 'p42', text: "Ты просто поднял мне настроение!" },
  { id: 'p43', text: "Ой, как смешно и мило!" },
  { id: 'p44', text: "Ты мастер красок!" },
  { id: 'p45', text: "Какие смелые и яркие цвета!" },
  { id: 'p46', text: "Ух ты! Целый праздник красок!" },
  { id: 'p47', text: "Невероятно мило!" },
  { id: 'p48', text: "Тебе тоже нравится? Это так круто!" },
  { id: 'p49', text: "Ура, ты сияешь, как звёздочка!" },
  { id: 'p50', text: "Потрясающе! Лучше всех!" },
];

export const SAVE_PRAISE: PraisePhrase = {
  id: 'save_1',
  text: "Ура! Картинка сохранена! Молодец!",
};

export const DONE_PRAISE: PraisePhrase = {
  id: 'done_1',
  text: "Ничего себе, это просто фантастика!",
};

export const FEED_PRAISE_PHRASES: PraisePhrase[] = [
  { id: 'feed_1', text: "Ням! Как вкусно!" },
  { id: 'feed_2', text: "Ммм, лучший повар на свете!" },
  { id: 'feed_3', text: "Вкуснятина! Можно ещё?" },
  { id: 'feed_4', text: "Ой, какое вкусное угощение!" },
  { id: 'feed_5', text: "Так вкусно! Спасибо, маленький повар!" },
  { id: 'feed_6', text: "Ням-ням-ням! Здорово!" },
];

export const WASH_CLEAN_PRAISE_PHRASES: PraisePhrase[] = [
  { id: 'wash_1', text: "Какой чистый и блестящий! Ура!" },
  { id: 'wash_2', text: "Весь чистенький! Отличная работа!" },
  { id: 'wash_3', text: "Ура! Свежий и чистый до скрипа!" },
];

class ToddlerSoundEngine {
  private audioCtx: AudioContext | null = null;
  private lastPraiseAt = 0;
  private shuffledQueue: PraisePhrase[] = [];
  private lastSpokenId: string | null = null;
  private pourGain: GainNode | null = null;
  private pourBP: BiquadFilterNode | null = null;
  private pourBodyGain: GainNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private ensurePourGraph(ctx: AudioContext): boolean {
    if (this.pourGain && this.pourBP && this.pourBodyGain) return true;
    try {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 0.8;

      const pGain = ctx.createGain();
      pGain.gain.value = 0;

      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 380;

      const bGain = ctx.createGain();
      bGain.gain.value = 0;

      src.connect(bp);
      bp.connect(pGain);
      pGain.connect(ctx.destination);

      src.connect(low);
      low.connect(bGain);
      bGain.connect(ctx.destination);

      src.start();
      this.pourBP = bp;
      this.pourGain = pGain;
      this.pourBodyGain = bGain;
      return true;
    } catch {
      return false;
    }
  }

  public getNextRandomPraise(): PraisePhrase {
    if (this.shuffledQueue.length === 0) {
      const pool = [...PRAISE_PHRASES];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      if (pool.length > 1 && pool[0].id === this.lastSpokenId) {
        [pool[0], pool[pool.length - 1]] = [pool[pool.length - 1], pool[0]];
      }
      this.shuffledQueue = pool;
    }
    const next = this.shuffledQueue.shift() ?? PRAISE_PHRASES[0];
    this.lastSpokenId = next.id;
    return next;
  }

  public playTapPop(enabled: boolean, pitchIndex = 0): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77];
    const freq = scale[Math.abs(pitchIndex) % scale.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.85, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playStickerChime(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.055;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.13, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  public playEraseSwoosh(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playCelebrationFanfare(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.42);
    });
  }

  public getRandomFeedPraise(): PraisePhrase {
    return FEED_PRAISE_PHRASES[Math.floor(Math.random() * FEED_PRAISE_PHRASES.length)];
  }

  public getRandomWashPraise(): PraisePhrase {
    return WASH_CLEAN_PRAISE_PHRASES[
      Math.floor(Math.random() * WASH_CLEAN_PRAISE_PHRASES.length)
    ];
  }

  public playBubblePop(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const base = 360 + Math.random() * 260;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.9, now + 0.075);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playScrub(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playWaterRinse(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.11);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playHairDryer(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(1.1, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playOvenDing(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [1318.5, 1975.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.16 : 0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  public playCrunchYum(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.075;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  private speakViaBrowserSpeech(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.98;
      utterance.pitch = 1.14;
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('ru') &&
            (v.name.toLowerCase().includes('milena') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('natural'))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith('ru'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors on restricted platforms
    }
  }

  public updatePourSound(enabled: boolean, flow: number, level: number): void {
    if (!enabled || flow <= 0.005) {
      this.stopPourSound();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.ensurePourGraph(ctx)) return;
    if (!this.pourGain || !this.pourBP || !this.pourBodyGain) return;
    const t = ctx.currentTime;
    this.pourGain.gain.setTargetAtTime(flow * 0.35, t, 0.07);
    this.pourBodyGain.gain.setTargetAtTime(flow * 0.24, t, 0.1);
    this.pourBP.frequency.setTargetAtTime(750 + level * 1700, t, 0.12);
  }

  public stopPourSound(): void {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state === 'closed') return;
    const t = ctx.currentTime;
    this.pourGain?.gain.setTargetAtTime(0, t, 0.04);
    this.pourBodyGain?.gain.setTargetAtTime(0, t, 0.04);
  }

  public playPourBloop(enabled: boolean, level: number): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const f = 260 + Math.random() * 420 + level * 520;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.088);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.11, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playPourCompleteChime(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + i * 0.1;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.54);
    });
  }

  public playCakeSquish(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 + Math.random() * 120, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.085);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCakePlace(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(420, now);
    o1.frequency.exponentialRampToValueAtTime(760, now + 0.065);
    g1.gain.setValueAtTime(0.001, now);
    g1.gain.exponentialRampToValueAtTime(0.15, now + 0.015);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    o1.connect(g1);
    g1.connect(ctx.destination);
    o1.start(now);
    o1.stop(now + 0.11);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(760, now + 0.07);
    g2.gain.setValueAtTime(0.001, now + 0.07);
    g2.gain.exponentialRampToValueAtTime(0.09, now + 0.085);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(now + 0.07);
    o2.stop(now + 0.19);
  }

  public playCakeWhoosh(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  public playCakeBirthdaySong(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const N: Record<string, number> = {
      G4: 392,
      A4: 440,
      B4: 493.9,
      C5: 523.3,
      D5: 587.3,
      E5: 659.3,
      F5: 698.5,
      G5: 784,
    };
    const SONG: Array<[string, number]> = [
      ['G4', 0.75],
      ['G4', 0.25],
      ['A4', 1],
      ['G4', 1],
      ['C5', 1],
      ['B4', 2],
      ['G4', 0.75],
      ['G4', 0.25],
      ['A4', 1],
      ['G4', 1],
      ['D5', 1],
      ['C5', 2],
      ['G4', 0.75],
      ['G4', 0.25],
      ['G5', 1],
      ['E5', 1],
      ['C5', 1],
      ['B4', 1],
      ['A4', 1],
      ['F5', 0.75],
      ['F5', 0.25],
      ['E5', 1],
      ['C5', 1],
      ['D5', 1],
      ['C5', 2],
    ];

    const playTone = (freq: number, t0: number, dur: number, type: OscillatorType, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };

    let t = ctx.currentTime + 0.12;
    const beat = 0.36;
    for (const [note, beats] of SONG) {
      const freq = N[note];
      playTone(freq, t, beats * beat * 0.95, 'triangle', 0.16);
      playTone(freq / 2, t, beats * beat * 0.9, 'sine', 0.06);
      t += beats * beat;
    }
  }

  /** Нота заданной высоты и тембра (для «Повтори за героями») */
  public playNote(
    enabled: boolean,
    freq: number,
    durationSec = 0.45,
    type: OscillatorType = 'triangle',
    volume = 0.18,
  ): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playGamePop(enabled: boolean, step = 0): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const base = pentatonic[Math.abs(step) % pentatonic.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * 0.85, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.075);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playGameOk(enabled: boolean, step = 0): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = pentatonic[Math.abs(step) % pentatonic.length];
    const now = ctx.currentTime;

    [freq, freq * 1.25].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = now + idx * 0.055;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.13, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    });
  }

  private lastRetryVoice = 0;
  public playGameFail(enabled: boolean): void {
    if (!enabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastRetryVoice > 9000) {
      this.lastRetryVoice = nowMs;
      window.setTimeout(() => sayRandom('retry', 4, true), 350);
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(215, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playGameReward(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.068;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.13, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  public playGameChomp(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.22, 0.44, 0.66].forEach((offset, i) => {
      const t0 = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const f = i % 2 === 0 ? 310 : 370;
      osc.frequency.setValueAtTime(f, t0);
      osc.frequency.exponentialRampToValueAtTime(160, t0 + 0.08);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.1, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.095);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.11);
    });
  }

  public playGameAnticipate(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playGameFlip(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.28;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(1.1, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  public speakPraise(phrase: PraisePhrase, enabled: boolean, force = false): boolean {
    if (!enabled) return false;
    const now = Date.now();
    if (!force && now - this.lastPraiseAt < 2800) {
      return false;
    }
    this.lastPraiseAt = now;
    playVoice(phrase.id, enabled, () => this.speakViaBrowserSpeech(phrase.text));
    return true;
  }

  /** Костяшка домино падает: короткий деревянный «тук» (высота растёт с номером). */
  public playClack(enabled: boolean, step = 0): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const f = 420 * Math.pow(2, (step % 14) / 14);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 1.6, now);
    o.frequency.exponentialRampToValueAtTime(f, now + 0.03);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.09);
  }

  /** Хлюп через трубочку: булькающий звук с вибрато. */
  public playSlurp(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180 + Math.random() * 60, now);
    o.frequency.exponentialRampToValueAtTime(110, now + 0.22);
    lfo.frequency.setValueAtTime(28, now);
    lg.gain.setValueAtTime(40, now);
    lfo.connect(lg); lg.connect(o.frequency);
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.setValueAtTime(900, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    o.connect(flt); flt.connect(g); g.connect(ctx.destination);
    o.start(now); lfo.start(now); o.stop(now + 0.26); lfo.stop(now + 0.26);
  }

  /** Пластинка ксилофона: звонкий удар (основной тон + обертон), быстро затухает. */
  public playXylo(enabled: boolean, freq: number): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(0.32, now + 0.005);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    out.connect(ctx.destination);
    [[1, 1], [3.98, 0.25], [9.2, 0.06]].forEach(([m, v]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq * m, now);
      g.gain.setValueAtTime(v, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (m === 1 ? 1.1 : 0.25));
      o.connect(g); g.connect(out);
      o.start(now); o.stop(now + 1.15);
    });
  }

  private noiseBuf: AudioBuffer | null = null;
  private noise(ctx: AudioContext): AudioBufferSourceNode {
    if (!this.noiseBuf) {
      this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    return src;
  }

  /** Барабаны: бочка, малый, тарелочка, том, бубен. */
  public playDrum(enabled: boolean, kind: 'kick' | 'snare' | 'hat' | 'tom' | 'tambourine' | 'cymbal'): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (kind === 'kick' || kind === 'tom') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f0 = kind === 'kick' ? 150 : 260;
      o.frequency.setValueAtTime(f0, now);
      o.frequency.exponentialRampToValueAtTime(kind === 'kick' ? 45 : 110, now + 0.25);
      g.gain.setValueAtTime(0.9, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'kick' ? 0.45 : 0.35));
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.5);
      return;
    }
    const n = this.noise(ctx);
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    const len = kind === 'snare' ? 0.22 : kind === 'hat' ? 0.06 : kind === 'tambourine' ? 0.18 : 0.9;
    f.type = kind === 'snare' ? 'bandpass' : 'highpass';
    f.frequency.setValueAtTime(kind === 'snare' ? 1800 : kind === 'cymbal' ? 5000 : 7000, now);
    g.gain.setValueAtTime(kind === 'cymbal' ? 0.35 : 0.5, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + len);
    n.connect(f); f.connect(g); g.connect(ctx.destination);
    n.start(now); n.stop(now + len + 0.05);
    if (kind === 'snare') {
      const o = ctx.createOscillator(); const g2 = ctx.createGain();
      o.frequency.setValueAtTime(220, now);
      g2.gain.setValueAtTime(0.4, now); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      o.connect(g2); g2.connect(ctx.destination); o.start(now); o.stop(now + 0.15);
    }
  }
}

export const soundEngine = new ToddlerSoundEngine();
