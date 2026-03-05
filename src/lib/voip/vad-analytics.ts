/**
 * Voice Activity Detection (VAD) Analytics
 * Detects speech vs silence in audio streams for:
 * - Talk-time ratio analysis
 * - Silence detection alerts
 * - Agent/caller speaking time breakdown
 * - Cross-talk detection
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VadConfig {
  /** RMS threshold for voice detection (0-1) */
  threshold: number;
  /** Minimum duration of speech to count (ms) */
  minSpeechDuration: number;
  /** Minimum silence duration to count (ms) */
  minSilenceDuration: number;
  /** Analysis window size in samples */
  windowSize: number;
  /** Smoothing factor for RMS (0-1) */
  smoothing: number;
}

export interface VadState {
  /** Whether voice is currently active */
  isVoiceActive: boolean;
  /** Current RMS level (0-1) */
  currentLevel: number;
  /** Smoothed RMS level */
  smoothedLevel: number;
  /** Duration of current state (speech or silence) in ms */
  currentStateDuration: number;
}

export interface TalkTimeAnalytics {
  /** Total call duration in seconds */
  totalDuration: number;
  /** Total speaking time in seconds */
  totalSpeechTime: number;
  /** Total silence time in seconds */
  totalSilenceTime: number;
  /** Talk-time ratio (0-1) */
  talkRatio: number;
  /** Number of speech segments */
  speechSegments: number;
  /** Average speech segment duration (seconds) */
  avgSpeechDuration: number;
  /** Number of silence segments */
  silenceSegments: number;
  /** Average silence duration (seconds) */
  avgSilenceDuration: number;
  /** Longest silence in seconds */
  longestSilence: number;
  /** Speaking pace estimate (segments per minute) */
  speakingPace: number;
}

export interface DualChannelAnalytics {
  agent: TalkTimeAnalytics;
  caller: TalkTimeAnalytics;
  /** Cross-talk segments (both speaking at once) */
  crossTalkSegments: number;
  /** Cross-talk duration in seconds */
  crossTalkDuration: number;
  /** Who spoke more (ratio: agent / (agent + caller)) */
  agentTalkRatio: number;
}

// ─── Default Config ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: VadConfig = {
  threshold: 0.015,
  minSpeechDuration: 250,
  minSilenceDuration: 500,
  windowSize: 1024,
  smoothing: 0.85,
};

// ─── VAD Analyzer Class ─────────────────────────────────────────────────────

export class VadAnalyzer {
  private config: VadConfig;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private state: VadState = {
    isVoiceActive: false,
    currentLevel: 0,
    smoothedLevel: 0,
    currentStateDuration: 0,
  };
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private stateStartTime = 0;
  private speechSegments: number[] = [];
  private silenceSegments: number[] = [];
  private startTime = 0;

  private onVoiceStart?: () => void;
  private onVoiceEnd?: () => void;
  private onSilenceAlert?: (duration: number) => void;

  constructor(config: Partial<VadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start analyzing a MediaStream for voice activity.
   */
  start(stream: MediaStream, pollIntervalMs = 50): void {
    this.audioContext = new AudioContext({ sampleRate: 48000 });
    const source = this.audioContext.createMediaStreamSource(stream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.config.windowSize * 2;
    this.analyser.smoothingTimeConstant = this.config.smoothing;

    source.connect(this.analyser);

    this.startTime = Date.now();
    this.stateStartTime = Date.now();
    this.speechSegments = [];
    this.silenceSegments = [];

    const buffer = new Float32Array(this.analyser.fftSize);

    this.pollInterval = setInterval(() => {
      if (!this.analyser) return;

      this.analyser.getFloatTimeDomainData(buffer);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);

      // Smooth the level
      this.state.currentLevel = rms;
      this.state.smoothedLevel = this.state.smoothedLevel * this.config.smoothing
        + rms * (1 - this.config.smoothing);

      // Determine voice activity
      const wasActive = this.state.isVoiceActive;
      const isNowActive = this.state.smoothedLevel > this.config.threshold;

      const stateDuration = Date.now() - this.stateStartTime;
      this.state.currentStateDuration = stateDuration;

      // State transition
      if (isNowActive && !wasActive && stateDuration >= this.config.minSpeechDuration) {
        // Silence → Speech
        if (stateDuration >= this.config.minSilenceDuration) {
          this.silenceSegments.push(stateDuration);
        }
        this.state.isVoiceActive = true;
        this.stateStartTime = Date.now();
        this.onVoiceStart?.();
      } else if (!isNowActive && wasActive && stateDuration >= this.config.minSilenceDuration) {
        // Speech → Silence
        if (stateDuration >= this.config.minSpeechDuration) {
          this.speechSegments.push(stateDuration);
        }
        this.state.isVoiceActive = false;
        this.stateStartTime = Date.now();
        this.onVoiceEnd?.();
      }

      // Silence alert (long silence > 10s)
      if (!this.state.isVoiceActive && stateDuration > 10000) {
        this.onSilenceAlert?.(stateDuration / 1000);
      }
    }, pollIntervalMs);
  }

  /**
   * Stop analysis and return results.
   */
  stop(): TalkTimeAnalytics {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Record final segment
    const finalDuration = Date.now() - this.stateStartTime;
    if (this.state.isVoiceActive) {
      this.speechSegments.push(finalDuration);
    } else {
      this.silenceSegments.push(finalDuration);
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;

    return this.getAnalytics();
  }

  /**
   * Get current analytics snapshot.
   */
  getAnalytics(): TalkTimeAnalytics {
    const totalDuration = (Date.now() - this.startTime) / 1000;
    const totalSpeech = this.speechSegments.reduce((a, b) => a + b, 0) / 1000;
    const totalSilence = this.silenceSegments.reduce((a, b) => a + b, 0) / 1000;

    return {
      totalDuration,
      totalSpeechTime: totalSpeech,
      totalSilenceTime: totalSilence,
      talkRatio: totalDuration > 0 ? totalSpeech / totalDuration : 0,
      speechSegments: this.speechSegments.length,
      avgSpeechDuration: this.speechSegments.length > 0
        ? totalSpeech / this.speechSegments.length
        : 0,
      silenceSegments: this.silenceSegments.length,
      avgSilenceDuration: this.silenceSegments.length > 0
        ? totalSilence / this.silenceSegments.length
        : 0,
      longestSilence: this.silenceSegments.length > 0
        ? Math.max(...this.silenceSegments) / 1000
        : 0,
      speakingPace: totalDuration > 0
        ? (this.speechSegments.length / totalDuration) * 60
        : 0,
    };
  }

  /**
   * Get current VAD state.
   */
  getState(): VadState {
    return { ...this.state };
  }

  /**
   * Register voice activity callbacks.
   */
  onVoice(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onSilenceAlert?: (duration: number) => void;
  }): void {
    this.onVoiceStart = callbacks.onStart;
    this.onVoiceEnd = callbacks.onEnd;
    this.onSilenceAlert = callbacks.onSilenceAlert;
  }

  /**
   * Create a dual-channel analyzer for agent + caller.
   */
  static analyzeDualChannel(
    agentAnalytics: TalkTimeAnalytics,
    callerAnalytics: TalkTimeAnalytics
  ): DualChannelAnalytics {
    const totalTalkTime = agentAnalytics.totalSpeechTime + callerAnalytics.totalSpeechTime;

    return {
      agent: agentAnalytics,
      caller: callerAnalytics,
      crossTalkSegments: 0, // Would need synchronized timestamp analysis
      crossTalkDuration: 0,
      agentTalkRatio: totalTalkTime > 0
        ? agentAnalytics.totalSpeechTime / totalTalkTime
        : 0.5,
    };
  }
}
