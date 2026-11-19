/**
 * Hệ thống phản hồi Âm thanh & Rung (Web Audio API & navigator.vibrate)
 * Hoạt động độc lập, không phụ thuộc vào file tài nguyên ngoài (.mp3/.wav).
 */

const STORAGE_KEY_SOUND = 'boardgame_sound_enabled';
const STORAGE_KEY_VIBRATE = 'boardgame_vibrate_enabled';

export type FeedbackSoundKey =
  | 'yourTurn'
  | 'cardPlay'
  | 'cardDraw'
  | 'heal'
  | 'harmAlert'
  | 'tradeInvite'
  | 'tick'
  | 'victory'
  | 'defeat'
  | 'error';

function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

class FeedbackService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private vibrateEnabled: boolean = true;
  private unlockBound: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedSound = localStorage.getItem(STORAGE_KEY_SOUND);
        if (storedSound !== null) {
          this.soundEnabled = storedSound === 'true';
        }
        const storedVibrate = localStorage.getItem(STORAGE_KEY_VIBRATE);
        if (storedVibrate !== null) {
          this.vibrateEnabled = storedVibrate === 'true';
        }
      } catch {
        // Ignored in restricted environments
      }
      this.setupFirstInteractionUnlock();
    }
  }

  /** Mở khoá Web Audio trên iOS Safari ngay lần chạm/nhấn phím đầu tiên */
  private setupFirstInteractionUnlock(): void {
    if (this.unlockBound || typeof window === 'undefined') return;
    this.unlockBound = true;

    const unlock = () => {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // --- Setting Getters / Setters ---
  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
    } catch {}
  }

  public toggleSound(): boolean {
    this.setSoundEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  public isVibrationEnabled(): boolean {
    return this.vibrateEnabled;
  }

  public setVibrationEnabled(enabled: boolean): void {
    this.vibrateEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY_VIBRATE, String(enabled));
    } catch {}
  }

  public toggleVibration(): boolean {
    this.setVibrationEnabled(!this.vibrateEnabled);
    return this.vibrateEnabled;
  }

  // --- Vibration Engine ---
  public vibrate(pattern: number | number[]): void {
    if (!this.vibrateEnabled) return;
    if (isReducedMotionPreferred()) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  public vibrateNope(): void {
    this.vibrate([60, 40, 90]);
  }

  public vibrateWarning(): void {
    this.vibrate([100, 60, 100, 60, 200]);
  }

  public vibrateExplosion(): void {
    this.vibrate([400, 100, 600]);
  }

  public vibrateYourTurn(): void {
    this.vibrate([90]);
  }

  public vibrateDefuse(): void {
    this.vibrate([80, 50, 120]);
  }

  public vibrateCard(): void {
    this.vibrate(30);
  }

  // --- Web Audio Synth Engine ---

  /** Âm báo tới lượt người chơi (Hai nốt chuông trong trẻo E5 -> B5) */
  public playYourTurn(): void {
    this.vibrateYourTurn();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Note 2: B5 (987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  }

  /** Tiếng Nope "Bụp!" đanh thép dập tắt hành động */
  public playNope(): void {
    this.vibrateNope();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
    
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /** Tiếng đếm ngược tích tắc 5s */
  public playTick(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Tiếng gỡ bom thành công thở phào (Chime ngân vang C5 - E5 - G5 - C6) */
  public playDefuse(): void {
    this.vibrateDefuse();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.09;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  }

  /** Tiếng còi cảnh báo rút phải bom / nguy cấp */
  public playWarningSiren(): void {
    this.vibrateWarning();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Sirene lượn sóng 500 -> 900 -> 500
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.25);
    osc.frequency.linearRampToValueAtTime(450, now + 0.5);
    osc.frequency.linearRampToValueAtTime(880, now + 0.75);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  /** Tiếng bom nổ ầm vang (Noise + Low-frequency thump) */
  public playExplosion(): void {
    this.vibrateExplosion();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub bass drop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.75);

    // Noise buffer for blast
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.8);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.85);
  }

  /** Tiếng lách cách rút bài / gõ bài nhẹ */
  public playCardDraw(): void {
    this.vibrateCard();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Tiếng đánh lá bài xuống sòng */
  public playCardPlay(): void {
    this.vibrateCard();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /** Khúc nhạc thắng trận ngân vang */
  public playVictory(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fanfare = [
      { freq: 523.25, time: 0.00, dur: 0.15 }, // C5
      { freq: 659.25, time: 0.15, dur: 0.15 }, // E5
      { freq: 783.99, time: 0.30, dur: 0.18 }, // G5
      { freq: 1046.5, time: 0.48, dur: 0.50 }, // C6
    ];

    fanfare.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + n.time;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + n.dur + 0.05);
    });
  }

  /** Âm chữa bệnh / dùng Liệu Pháp thành công (C5 -> G5 ấm áp) */
  public playHeal(): void {
    this.vibrate(35);
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, offset: 0, dur: 0.16 },
      { freq: 783.99, offset: 0.1, dur: 0.28 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.offset);
      gain.gain.setValueAtTime(0.22, now + n.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.offset + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.offset);
      osc.stop(now + n.offset + n.dur + 0.02);
    }
  }

  /** Âm cảnh báo khi mình bị đánh Triệu Chứng / bị đưa Bệnh Lý / bị lấy bài */
  public playHarmAlert(): void {
    if (!this.soundEnabled) {
      this.vibrate([80, 45, 110]);
      return;
    }
    const ctx = this.getAudioContext();
    this.vibrate([80, 45, 110]);
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 440, offset: 0, dur: 0.14 },
      { freq: 311.13, offset: 0.12, dur: 0.26 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, now + n.offset);
      gain.gain.setValueAtTime(0.2, now + n.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.offset + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.offset);
      osc.stop(now + n.offset + n.dur + 0.02);
    }
  }

  /** Âm báo có lời mời đổi bài gửi tới mình */
  public playTradeInvite(): void {
    if (!this.soundEnabled) {
      this.vibrate([45, 35, 45]);
      return;
    }
    const ctx = this.getAudioContext();
    this.vibrate([45, 35, 45]);
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 783.99, offset: 0, dur: 0.14 },
      { freq: 1174.66, offset: 0.11, dur: 0.24 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.offset);
      gain.gain.setValueAtTime(0.18, now + n.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.offset + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.offset);
      osc.stop(now + n.offset + n.dur + 0.02);
    }
  }

  /** Âm kết thúc ván khi người khác thắng */
  public playDefeat(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 392.0, offset: 0, dur: 0.16 },
      { freq: 329.63, offset: 0.15, dur: 0.18 },
      { freq: 261.63, offset: 0.31, dur: 0.36 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.offset);
      gain.gain.setValueAtTime(0.22, now + n.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.offset + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.offset);
      osc.stop(now + n.offset + n.dur + 0.03);
    }
  }

  /** Âm báo lỗi thao tác / action bị từ chối */
  public playError(): void {
    if (!this.soundEnabled) {
      this.vibrate(45);
      return;
    }
    const ctx = this.getAudioContext();
    this.vibrate(45);
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.14);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** Phát âm thanh theo khoá sự kiện chuẩn hoá */
  public playByKey(key: FeedbackSoundKey): void {
    switch (key) {
      case 'yourTurn':
        this.playYourTurn();
        break;
      case 'cardPlay':
        this.playCardPlay();
        break;
      case 'cardDraw':
        this.playCardDraw();
        break;
      case 'heal':
        this.playHeal();
        break;
      case 'harmAlert':
        this.playHarmAlert();
        break;
      case 'tradeInvite':
        this.playTradeInvite();
        break;
      case 'tick':
        this.playTick();
        break;
      case 'victory':
        this.playVictory();
        break;
      case 'defeat':
        this.playDefeat();
        break;
      case 'error':
        this.playError();
        break;
    }
  }
}

export const feedback = new FeedbackService();
