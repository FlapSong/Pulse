// Web Audio API Premium Sound Synthesizer for Pulse HQ
// Generates beautiful, retro-futuristic sound effects dynamically in-browser.
// Automatically respects the user's "Do Not Disturb" (dnd) status.

class SoundService {
  private ctx: AudioContext | null = null;
  private ringInterval: any = null;
  private userStatus: string = 'online';
  private customStatus: string = '';

  public setUserStatus(status: string, customStatus?: string) {
    this.userStatus = status;
    if (customStatus !== undefined) {
      this.customStatus = customStatus;
    }
  }

  public resumeAudio() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private shouldPlay(): boolean {
    if (this.userStatus === 'dnd') return false;
    if (this.customStatus && (
      this.customStatus.toLowerCase().includes('не беспокоить') ||
      this.customStatus.toLowerCase().includes('dnd')
    )) {
      return false;
    }
    return true;
  }

  /**
   * Play a premium high-quality sci-fi message notification ping
   */
  public playMessage() {
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Warm retro sine-wave chime sweep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(880.00, t + 0.12); // A5

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Play an ascending futuristic chime when joining a channel
   */
  public playJoinChannel() {
    if (!this.shouldPlay()) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    // Ascending melody: C5 (523.25) -> E5 (659.25) -> G5 (783.99)
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.setValueAtTime(659.25, t + 0.08);
    osc.frequency.setValueAtTime(783.99, t + 0.16);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Play a descending futuristic chime when leaving a channel
   */
  public playLeaveChannel() {
    if (!this.shouldPlay()) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    // Descending melody: G5 (783.99) -> E5 (659.25) -> C5 (523.25)
    osc.frequency.setValueAtTime(783.99, t);
    osc.frequency.setValueAtTime(659.25, t + 0.08);
    osc.frequency.setValueAtTime(523.25, t + 0.16);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Loops a premium soft futuristic dual-tone telephone ring
   */
  public startIncomingCallRing() {
    if (!this.shouldPlay()) return;
    this.stopCallRing();
    this.initCtx();
    if (!this.ctx) return;

    const playPulse = () => {
      if (!this.ctx || !this.shouldPlay()) return;
      const t = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Futuristic dual chord: E5 (659.25) + G#5 (830.61)
      osc1.frequency.setValueAtTime(659.25, t);
      osc2.frequency.setValueAtTime(830.61, t);

      // Subtle frequency vibrato for high-tech pulse effect
      osc1.frequency.linearRampToValueAtTime(665.00, t + 0.15);
      osc1.frequency.linearRampToValueAtTime(659.25, t + 0.3);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.7);
      osc2.stop(t + 0.7);
    };

    playPulse();
    this.ringInterval = setInterval(() => {
      playPulse();
    }, 1500);
  }

  /**
   * Stops any currently active ringtones
   */
  public stopCallRing() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const soundService = new SoundService();
