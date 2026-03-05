/**
 * Incoming Call Notification - Browser Notification API + Custom Ringtone
 * Shows desktop notification with caller info and plays ringtone.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IncomingCallInfo {
  callerNumber: string;
  callerName?: string;
  callControlId: string;
  direction: 'inbound';
}

export interface NotificationConfig {
  enabled: boolean;
  /** Play ringtone audio */
  playRingtone: boolean;
  /** Ringtone ID (from ringtone-manager) */
  ringtoneId: string;
  /** Notification duration in ms (0 = until answered) */
  duration: number;
  /** Show browser notification */
  showBrowserNotification: boolean;
}

// ─── Default Config ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  playRingtone: true,
  ringtoneId: 'default',
  duration: 0,
  showBrowserNotification: true,
};

// ─── Built-in Ringtone (Web Audio API synthesized) ──────────────────────────

function createDefaultRingtone(ctx: AudioContext): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 440; // A4

  // Ring pattern: 400ms on, 200ms off, 400ms on, 2s off
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);

  // Create ring pattern
  for (let i = 0; i < 10; i++) {
    const ringStart = now + i * 3;
    gain.gain.setValueAtTime(0.3, ringStart);
    gain.gain.setValueAtTime(0, ringStart + 0.4);
    gain.gain.setValueAtTime(0.3, ringStart + 0.6);
    gain.gain.setValueAtTime(0, ringStart + 1.0);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  return osc;
}

// ─── Incoming Notification Manager ──────────────────────────────────────────

export class IncomingNotificationManager {
  private config: NotificationConfig;
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private browserNotification: Notification | null = null;
  private onAnswer?: (callControlId: string) => void;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Request browser notification permission.
   * Should be called on user interaction (e.g., settings page).
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.requestPermission();
  }

  /**
   * Check if notifications are supported and permitted.
   */
  static isPermitted(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Show incoming call notification and start ringtone.
   */
  async notify(call: IncomingCallInfo): Promise<void> {
    if (!this.config.enabled) return;

    // Start ringtone
    if (this.config.playRingtone) {
      this.startRingtone();
    }

    // Show browser notification
    if (this.config.showBrowserNotification && IncomingNotificationManager.isPermitted()) {
      this.showNotification(call);
    }

    // Auto-dismiss after duration (if set)
    if (this.config.duration > 0) {
      setTimeout(() => this.dismiss(), this.config.duration);
    }
  }

  /**
   * Dismiss notification and stop ringtone.
   */
  dismiss(): void {
    this.stopRingtone();

    if (this.browserNotification) {
      this.browserNotification.close();
      this.browserNotification = null;
    }
  }

  /**
   * Set custom ringtone audio URL.
   */
  setRingtone(audioUrl: string): void {
    this.config.ringtoneId = 'custom';
    // Preload audio
    this.audioElement = new Audio(audioUrl);
    this.audioElement.loop = true;
    this.audioElement.volume = 0.5;
  }

  /**
   * Register answer callback.
   */
  onAnswerCall(callback: (callControlId: string) => void): void {
    this.onAnswer = callback;
  }

  /**
   * Update notification config.
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ─── Private ────────────────────────────────────────────────────

  private startRingtone(): void {
    try {
      if (this.audioElement) {
        // Use custom audio file
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(() => {
          // Autoplay blocked, fall back to Web Audio
          this.startWebAudioRingtone();
        });
      } else {
        // Use synthesized ringtone
        this.startWebAudioRingtone();
      }
    } catch {
      // Fallback: no audio
    }
  }

  private startWebAudioRingtone(): void {
    try {
      this.audioContext = new AudioContext();
      this.oscillator = createDefaultRingtone(this.audioContext);
      this.oscillator.start();
    } catch {
      // Web Audio not available
    }
  }

  private stopRingtone(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (this.oscillator) {
      try { this.oscillator.stop(); } catch { /* already stopped */ }
      this.oscillator = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private showNotification(call: IncomingCallInfo): void {
    const title = call.callerName
      ? `Incoming call from ${call.callerName}`
      : `Incoming call: ${call.callerNumber}`;

    this.browserNotification = new Notification(title, {
      body: call.callerNumber,
      icon: '/icons/phone-incoming.png',
      tag: `incoming-call-${call.callControlId}`,
      requireInteraction: true,
      silent: true, // We handle audio ourselves
    });

    this.browserNotification.onclick = () => {
      // Focus the window and answer
      window.focus();
      this.onAnswer?.(call.callControlId);
      this.dismiss();
    };

    this.browserNotification.onclose = () => {
      this.stopRingtone();
    };
  }
}
