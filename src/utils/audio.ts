/**
 * Sistema de sonido acústico y sintetizado de alta fidelidad con Web Audio API puro.
 * Genera sonidos físicos de cartas (fricción de papel, impacto en mesa, barajeo real),
 * campanas armónicas y fanfarrias vibrantes, sin depender de archivos MP3 externos.
 */

const AUDIO_ENABLED_KEY = 'algebra_uno_sound_enabled';

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem(AUDIO_ENABLED_KEY);
      this.isEnabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.isEnabled = true;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
        } catch {
          return null;
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (this.noiseBuffer) return this.noiseBuffer;
    try {
      const bufferSize = ctx.sampleRate * 1.5; // 1.5 segundos de ruido blanco reutilizable
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleSound(): boolean {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem(AUDIO_ENABLED_KEY, String(this.isEnabled));
    } catch {
      // Ignorar restricciones locales
    }
    return this.isEnabled;
  }

  /**
   * Sonido al jugar una carta:
   * Capa 1: Fricción / Swoosh de aire rápido de la carta volando.
   * Capa 2: Snap / Slap seco de impacto en el fieltro de la mesa.
   */
  public playCard() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Air Swoosh (Ruido filtrado con caída rápida)
      const noise = this.getNoiseBuffer(ctx);
      if (noise) {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        filter.Q.setValueAtTime(1.8, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.22, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + 0.09);
      }

      // 2. Card Snap / Table Slap (Impacto percusivo con caída tonal)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.07);

      oscGain.gain.setValueAtTime(0.45, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      // 3. Sub-thump sutil para sensación de peso táctil
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.06);
    } catch {
      // Ignorar bloqueos de audio
    }
  }

  /**
   * Sonido al robar cartas del mazo:
   * Fricción suave de deslizar una carta física de la baraja + pop sutil.
   */
  public drawCard() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Fricción de papel
      const noise = this.getNoiseBuffer(ctx);
      if (noise) {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 0.11);
        filter.Q.setValueAtTime(2.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + 0.13);
      }

      // Tono sutil ascendente
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido cálido de notificación cuando empieza tu turno:
   * Acorde brillante de campana / marimba de cristal con reverberación natural.
   */
  public yourTurn() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [
        { f: 659.25, time: 0, dur: 0.28 },     // E5
        { f: 880.0, time: 0.07, dur: 0.35 },   // A5
        { f: 1318.5, time: 0.14, dur: 0.45 },  // E6 armónico brillante
      ];

      notes.forEach(({ f, time, dur }) => {
        const start = ctx.currentTime + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido festivo al cantar ¡UNO!:
   * Fanfarria de trompetas y campanitas alegres con gran brillo armónico.
   */
  public unoCall() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const chord = [523.25, 659.25, 783.99, 1046.5]; // Acorde mayor C5, E5, G5, C6
      const baseTime = ctx.currentTime;

      // Golpe de acorde triunfal
      chord.forEach((freq, idx) => {
        const start = baseTime + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.26, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });

      // Brillo centelleante agudo
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(1567.98, baseTime + 0.12); // G6
      sparkleGain.gain.setValueAtTime(0.18, baseTime + 0.12);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, baseTime + 0.45);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkleOsc.start(baseTime + 0.12);
      sparkleOsc.stop(baseTime + 0.46);
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido dramático de ataque (+2 o +4 acumulado):
   * Impacto cinematográfico con sub-bajo y whoosh de energía.
   */
  public attack() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Sub-impacto masivo
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.36);

      // 2. Distorsión / siseo agresivo
      const noise = this.getNoiseBuffer(ctx);
      if (noise) {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.3);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + 0.31);
      }
    } catch {
      // Ignorar
    }
  }

  /**
   * Fanfarria triunfal al ganar la partida:
   * Arpegio festivo completo con campanas y final resonante.
   */
  public victory() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.12 }, // Do
        { f: 659.25, d: 0.12 }, // Mi
        { f: 783.99, d: 0.14 }, // Sol
        { f: 1046.5, d: 0.22 }, // Do agudo
        { f: 1318.5, d: 0.55 }, // Mi agudo final triunfal
      ];

      let t = ctx.currentTime;
      melody.forEach(({ f, d }, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === melody.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + d);
        t += d * 0.85;
      });
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido de barajeo rápido de cartas (Riffle Shuffle):
   * Ráfaga de fricciones de cartas entrelazándose rápidamente.
   */
  public shuffle() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const base = ctx.currentTime;
      const count = 12;

      for (let i = 0; i < count; i++) {
        const start = base + i * 0.045 + Math.random() * 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 280, start);
        osc.frequency.exponentialRampToValueAtTime(80, start + 0.035);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.04);
      }
    } catch {
      // Ignorar
    }
  }

  /**
   * Micro-tick táctil al interactuar o tocar una carta en móvil
   */
  public cardTouch() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido mágico/luminoso de cambio de color
   */
  public colorChange() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.26);
      });
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido giratorio de cambio de sentido (Reversa)
   */
  public reverse() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.28);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido percusivo de bloqueo de turno (Skip)
   */
  public block() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Ignorar
    }
  }

  /**
   * Sonido amortiguado de error / carta no válida
   */
  public invalidCard() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignorar
    }
  }
}

export const soundEffects = new SoundEffectsManager();
