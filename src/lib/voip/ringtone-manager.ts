/**
 * Ringtone Manager - Preset ringtones + custom upload
 * Manages ringtone selection, preview, and storage.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Ringtone {
  id: string;
  name: string;
  /** URL to audio file, or 'synthesized' for Web Audio */
  url: string;
  /** Whether this is a built-in preset */
  isPreset: boolean;
  /** Duration in seconds */
  duration?: number;
}

export interface RingtoneConfig {
  /** Selected ringtone ID */
  selectedId: string;
  /** Volume (0-1) */
  volume: number;
  /** Whether ringtone is enabled */
  enabled: boolean;
}

// ─── Preset Ringtones ───────────────────────────────────────────────────────

export const PRESET_RINGTONES: Ringtone[] = [
  { id: 'classic', name: 'Classic Ring', url: 'synthesized', isPreset: true },
  { id: 'digital', name: 'Digital', url: 'synthesized', isPreset: true },
  { id: 'gentle', name: 'Gentle', url: 'synthesized', isPreset: true },
  { id: 'urgent', name: 'Urgent', url: 'synthesized', isPreset: true },
  { id: 'melody', name: 'Melody', url: 'synthesized', isPreset: true },
];

// Synthesized ringtone frequency patterns
const RINGTONE_PATTERNS: Record<string, { freq: number[]; pattern: number[]; type: OscillatorType }> = {
  classic: { freq: [440, 480], pattern: [400, 200, 400, 2000], type: 'sine' },
  digital: { freq: [1200, 1400], pattern: [100, 100, 100, 100, 100, 2000], type: 'square' },
  gentle: { freq: [330, 392, 440], pattern: [300, 100, 300, 100, 300, 2000], type: 'sine' },
  urgent: { freq: [880, 700], pattern: [200, 100, 200, 100, 200, 500], type: 'sawtooth' },
  melody: { freq: [523, 659, 784, 659], pattern: [200, 50, 200, 50, 200, 50, 200, 1500], type: 'sine' },
};

// ─── Ringtone Manager ───────────────────────────────────────────────────────

export class RingtoneManager {
  private config: RingtoneConfig = {
    selectedId: 'classic',
    volume: 0.5,
    enabled: true,
  };
  private customRingtones: Ringtone[] = [];
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private playTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config?: Partial<RingtoneConfig>) {
    if (config) this.config = { ...this.config, ...config };
    this.loadCustomRingtones();
  }

  /**
   * Get all available ringtones (presets + custom).
   */
  getAllRingtones(): Ringtone[] {
    return [...PRESET_RINGTONES, ...this.customRingtones];
  }

  /**
   * Get the currently selected ringtone.
   */
  getSelected(): Ringtone {
    const all = this.getAllRingtones();
    return all.find(r => r.id === this.config.selectedId) ?? PRESET_RINGTONES[0];
  }

  /**
   * Select a ringtone by ID.
   */
  select(id: string): void {
    this.config.selectedId = id;
    this.saveConfig();
  }

  /**
   * Play the selected ringtone.
   */
  play(): void {
    if (this.isPlaying || !this.config.enabled) return;
    this.isPlaying = true;

    const ringtone = this.getSelected();

    if (ringtone.url === 'synthesized') {
      this.playSynthesized(ringtone.id);
    } else {
      this.playAudioFile(ringtone.url);
    }
  }

  /**
   * Preview a specific ringtone (plays for 3 seconds).
   */
  preview(id: string): void {
    this.stop();

    const ringtone = this.getAllRingtones().find(r => r.id === id);
    if (!ringtone) return;

    this.isPlaying = true;

    if (ringtone.url === 'synthesized') {
      this.playSynthesized(id);
    } else {
      this.playAudioFile(ringtone.url);
    }

    // Auto-stop after 3 seconds for preview
    this.playTimeout = setTimeout(() => this.stop(), 3000);
  }

  /**
   * Stop playing the ringtone.
   */
  stop(): void {
    this.isPlaying = false;

    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }

    // Stop Web Audio oscillators
    for (const osc of this.oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.oscillators = [];

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Stop HTML Audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  /**
   * Set volume (0-1).
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.config.volume;
    }
    this.saveConfig();
  }

  /**
   * Toggle ringtone on/off.
   */
  toggle(): boolean {
    this.config.enabled = !this.config.enabled;
    if (!this.config.enabled) this.stop();
    this.saveConfig();
    return this.config.enabled;
  }

  /**
   * Add a custom ringtone from a file.
   */
  async addCustom(file: File): Promise<Ringtone> {
    // Create object URL for the audio file
    const url = URL.createObjectURL(file);
    const id = `custom-${Date.now()}`;
    const name = file.name.replace(/\.[^.]+$/, '');

    // Get duration
    const duration = await this.getAudioDuration(url);

    const ringtone: Ringtone = {
      id,
      name,
      url,
      isPreset: false,
      duration,
    };

    this.customRingtones.push(ringtone);
    this.saveCustomRingtones();
    return ringtone;
  }

  /**
   * Remove a custom ringtone.
   */
  removeCustom(id: string): void {
    const ringtone = this.customRingtones.find(r => r.id === id);
    if (ringtone) {
      URL.revokeObjectURL(ringtone.url);
      this.customRingtones = this.customRingtones.filter(r => r.id !== id);
      this.saveCustomRingtones();

      // Reset selection if the removed one was selected
      if (this.config.selectedId === id) {
        this.config.selectedId = 'classic';
        this.saveConfig();
      }
    }
  }

  /**
   * Get current config.
   */
  getConfig(): RingtoneConfig {
    return { ...this.config };
  }

  // ─── Private ────────────────────────────────────────────────────

  private playSynthesized(patternId: string): void {
    const pattern = RINGTONE_PATTERNS[patternId] ?? RINGTONE_PATTERNS.classic;

    try {
      this.audioContext = new AudioContext();
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.config.volume * 0.3; // Attenuate synthesized tones
      gainNode.connect(this.audioContext.destination);

      // Create oscillators for each frequency
      for (const freq of pattern.freq) {
        const osc = this.audioContext.createOscillator();
        osc.type = pattern.type;
        osc.frequency.value = freq;
        osc.connect(gainNode);

        // Apply on/off pattern
        const now = this.audioContext.currentTime;
        let time = 0;
        for (let cycle = 0; cycle < 5; cycle++) {
          for (let i = 0; i < pattern.pattern.length; i++) {
            const dur = pattern.pattern[i] / 1000;
            if (i % 2 === 0) {
              // On
              gainNode.gain.setValueAtTime(this.config.volume * 0.3, now + time);
            } else {
              // Off
              gainNode.gain.setValueAtTime(0, now + time);
            }
            time += dur;
          }
        }

        osc.start();
        this.oscillators.push(osc);
      }
    } catch {
      // Web Audio not available
    }
  }

  private playAudioFile(url: string): void {
    this.audioElement = new Audio(url);
    this.audioElement.loop = true;
    this.audioElement.volume = this.config.volume;
    this.audioElement.play().catch(() => {
      // Autoplay blocked
    });
  }

  private async getAudioDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
      });
      audio.addEventListener('error', () => resolve(0));
    });
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('ringtone-config', JSON.stringify(this.config));
    } catch { /* no localStorage */ }
  }

  private loadCustomRingtones(): void {
    // Custom ringtones use object URLs which don't persist across sessions.
    // In production, these would be stored in IndexedDB or uploaded to server.
    this.customRingtones = [];
  }

  private saveCustomRingtones(): void {
    // Placeholder: In production, save to IndexedDB or server
  }
}
