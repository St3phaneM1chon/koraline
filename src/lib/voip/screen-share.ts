/**
 * Screen Sharing via getDisplayMedia() API
 * Captures screen/window/tab and adds as video track to peer connection.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScreenShareOptions {
  /** Preferred resolution */
  width?: number;
  height?: number;
  /** Max framerate */
  frameRate?: number;
  /** Include system audio */
  systemAudio?: boolean;
  /** Preferred display surface: 'monitor' | 'window' | 'browser' */
  displaySurface?: 'monitor' | 'window' | 'browser';
}

export interface ScreenShareState {
  isSharing: boolean;
  stream: MediaStream | null;
  trackId: string | null;
  displaySurface?: string;
}

// ─── Screen Share Manager ───────────────────────────────────────────────────

export class ScreenShareManager {
  private state: ScreenShareState = {
    isSharing: false,
    stream: null,
    trackId: null,
  };
  private onStateChange?: (state: ScreenShareState) => void;
  private onEnded?: () => void;

  /**
   * Start screen sharing. Returns the MediaStream to add to peer connection.
   */
  async start(options: ScreenShareOptions = {}): Promise<MediaStream> {
    if (this.state.isSharing) {
      throw new Error('Screen sharing is already active');
    }

    const constraints: DisplayMediaStreamOptions = {
      video: {
        width: { ideal: options.width ?? 1920 },
        height: { ideal: options.height ?? 1080 },
        frameRate: { max: options.frameRate ?? 15 },
        displaySurface: options.displaySurface ?? 'monitor',
      },
      audio: options.systemAudio ? {
        // @ts-expect-error systemAudio is Chrome-specific
        systemAudio: 'include',
      } : false,
    };

    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

    // Handle user stopping share via browser UI
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        this.stop();
        this.onEnded?.();
      });
    }

    this.state = {
      isSharing: true,
      stream,
      trackId: videoTrack?.id ?? null,
      displaySurface: videoTrack?.getSettings()?.displaySurface,
    };

    this.onStateChange?.(this.state);
    return stream;
  }

  /**
   * Stop screen sharing.
   */
  stop(): void {
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(t => t.stop());
    }

    this.state = {
      isSharing: false,
      stream: null,
      trackId: null,
    };

    this.onStateChange?.(this.state);
  }

  /**
   * Add screen share track to an existing peer connection.
   */
  async addToPeerConnection(
    pc: RTCPeerConnection,
    stream: MediaStream
  ): Promise<RTCRtpSender | null> {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const sender = pc.addTrack(videoTrack, stream);
    return sender;
  }

  /**
   * Replace screen share with camera video (or vice versa).
   */
  async replaceTrack(
    sender: RTCRtpSender,
    newStream: MediaStream
  ): Promise<void> {
    const newTrack = newStream.getVideoTracks()[0];
    if (newTrack) {
      await sender.replaceTrack(newTrack);
    }
  }

  /**
   * Get current sharing state.
   */
  getState(): ScreenShareState {
    return { ...this.state };
  }

  /**
   * Check if screen sharing is supported.
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && typeof navigator.mediaDevices.getDisplayMedia === 'function';
  }

  /**
   * Register state change callback.
   */
  onState(callback: (state: ScreenShareState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Register ended callback (user stopped sharing via browser UI).
   */
  onShareEnded(callback: () => void): void {
    this.onEnded = callback;
  }
}
