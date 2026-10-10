/**
 * Romantic Ambient Synthesizer using Web Audio API
 * Generates soft, ethereal, dreamy chime and harp chords.
 * Zero external audio dependencies = 100% reliable in any browser.
 */

class RomanticSoundService {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private masterGain: GainNode | null = null;

  private chords = [
    // Frequencies for dreamy romantic chords (Cmaj7, Am7, Fmaj7, G)
    [261.63, 329.63, 392.00, 493.88], // C, E, G, B (Cmaj7)
    [220.00, 261.63, 329.63, 392.00], // A, C, E, G (Am7)
    [174.61, 261.63, 329.63, 349.23], // F, C, E, F (Fmaj7)
    [196.00, 246.94, 293.66, 392.00]  // G, B, D, G (Gmaj)
  ];

  private currentChordIndex = 0;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play a soft chime tone
  private playNote(freq: number, delaySec: number = 0, duration: number = 2.4) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime + delaySec;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // Soft sine / triangle mix for a music box / harp feel
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Envelope: soft attack, gentle decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  // Play a soft click/sparkle sound for button clicks
  public playSparkle() {
    try {
      this.initContext();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        this.playNote(freq, i * 0.06, 0.4);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playCelebrationChime() {
    try {
      this.initContext();
      if (!this.audioCtx) return;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        this.playNote(freq, i * 0.1, 1.8);
      });
    } catch {
      // Silent fail
    }
  }

  public toggleMusic(): boolean {
    if (this.isPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public startMusic() {
    this.initContext();
    this.isPlaying = true;

    const playCurrentChord = () => {
      if (!this.isPlaying) return;
      const notes = this.chords[this.currentChordIndex];
      // Arpeggiate chord notes smoothly
      notes.forEach((freq, idx) => {
        this.playNote(freq, idx * 0.35, 3.2);
        // Add subtle harmonic octave higher
        this.playNote(freq * 2, (idx * 0.35) + 0.1, 2.0);
      });
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
    };

    playCurrentChord();
    this.intervalId = setInterval(playCurrentChord, 3200);
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundService = new RomanticSoundService();
