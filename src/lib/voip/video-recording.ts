/**
 * Video Call Recording - MediaRecorder API + Azure Blob Storage upload
 * Records video calls (local + remote streams) and uploads to cloud storage.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoRecordingConfig {
  /** Video codec: 'vp9' | 'vp8' | 'h264' */
  codec?: string;
  /** Video bitrate in bps (default 2.5Mbps) */
  videoBitrate?: number;
  /** Audio bitrate in bps (default 128kbps) */
  audioBitrate?: number;
  /** Recording MIME type */
  mimeType?: string;
}

export interface VideoRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startedAt?: Date;
  duration: number;
  fileSize: number;
  codec: string;
}

export interface VideoRecordingResult {
  blob: Blob;
  mimeType: string;
  duration: number;
  fileSize: number;
  startedAt: Date;
  stoppedAt: Date;
}

// ─── Supported Codecs ───────────────────────────────────────────────────────

const CODEC_PREFERENCES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=h264,opus',
  'video/webm',
  'video/mp4',
];

// ─── Video Recorder Class ───────────────────────────────────────────────────

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private state: VideoRecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    fileSize: 0,
    codec: '',
  };
  private startTime = 0;
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private onStateChange?: (state: VideoRecordingState) => void;

  /**
   * Start recording a combined video+audio stream.
   */
  start(stream: MediaStream, config: VideoRecordingConfig = {}): void {
    if (this.mediaRecorder) {
      throw new Error('Recording is already in progress');
    }

    // Find supported MIME type
    const mimeType = config.mimeType ?? this.findSupportedMimeType();
    if (!mimeType) {
      throw new Error('No supported video recording format found');
    }

    const options: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: config.videoBitrate ?? 2500000,
      audioBitsPerSecond: config.audioBitrate ?? 128000,
    };

    this.mediaRecorder = new MediaRecorder(stream, options);
    this.chunks = [];
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.state.fileSize = this.chunks.reduce((sum, c) => sum + c.size, 0);
        this.notifyState();
      }
    };

    this.mediaRecorder.onerror = () => {
      this.state.isRecording = false;
      this.notifyState();
    };

    // Request data every second for real-time size tracking
    this.mediaRecorder.start(1000);

    // Track duration
    this.durationInterval = setInterval(() => {
      this.state.duration = Math.floor((Date.now() - this.startTime) / 1000);
      this.notifyState();
    }, 1000);

    this.state = {
      isRecording: true,
      isPaused: false,
      startedAt: new Date(),
      duration: 0,
      fileSize: 0,
      codec: mimeType,
    };
    this.notifyState();
  }

  /**
   * Pause recording.
   */
  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.state.isPaused = true;
      this.notifyState();
    }
  }

  /**
   * Resume recording.
   */
  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.state.isPaused = false;
      this.notifyState();
    }
  }

  /**
   * Stop recording and return the recorded blob.
   */
  async stop(): Promise<VideoRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.state.codec });

        if (this.durationInterval) {
          clearInterval(this.durationInterval);
          this.durationInterval = null;
        }

        const result: VideoRecordingResult = {
          blob,
          mimeType: this.state.codec,
          duration: Math.floor((Date.now() - this.startTime) / 1000),
          fileSize: blob.size,
          startedAt: this.state.startedAt ?? new Date(),
          stoppedAt: new Date(),
        };

        this.mediaRecorder = null;
        this.chunks = [];
        this.state = {
          isRecording: false,
          isPaused: false,
          duration: 0,
          fileSize: 0,
          codec: '',
        };
        this.notifyState();

        resolve(result);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording state.
   */
  getState(): VideoRecordingState {
    return { ...this.state };
  }

  /**
   * Register state change callback.
   */
  onState(callback: (state: VideoRecordingState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Check if video recording is supported.
   */
  static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined'
      && CODEC_PREFERENCES.some(c => MediaRecorder.isTypeSupported(c));
  }

  /**
   * Upload recorded video to server.
   */
  static async upload(
    result: VideoRecordingResult,
    callLogId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      const extension = result.mimeType.includes('webm') ? 'webm' : 'mp4';
      formData.append('file', result.blob, `video-${callLogId}.${extension}`);
      formData.append('callLogId', callLogId);
      formData.append('duration', String(result.duration));
      formData.append('mimeType', result.mimeType);

      const response = await fetch('/api/admin/voip/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        return { success: true, url: json.data?.url };
      }
      return { success: false, error: json.error?.message ?? 'Upload failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Create a combined stream from local camera + remote video for recording.
   */
  static combineStreams(
    localStream: MediaStream,
    remoteStream: MediaStream,
    layout: 'pip' | 'side-by-side' = 'pip'
  ): { stream: MediaStream; cleanup: () => void } {
    const canvas = document.createElement('canvas');
    canvas.width = layout === 'pip' ? 1280 : 1920;
    canvas.height = layout === 'pip' ? 720 : 540;
    const ctx = canvas.getContext('2d')!;

    const localVideo = document.createElement('video');
    localVideo.srcObject = localStream;
    localVideo.autoplay = true;
    localVideo.muted = true;

    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = remoteStream;
    remoteVideo.autoplay = true;
    remoteVideo.muted = true;

    let animFrame: number;

    const render = () => {
      if (layout === 'pip') {
        // Remote = full screen, local = picture-in-picture
        ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
        const pipW = canvas.width * 0.25;
        const pipH = canvas.height * 0.25;
        ctx.drawImage(localVideo, canvas.width - pipW - 10, canvas.height - pipH - 10, pipW, pipH);
      } else {
        // Side by side
        const halfW = canvas.width / 2;
        ctx.drawImage(remoteVideo, 0, 0, halfW, canvas.height);
        ctx.drawImage(localVideo, halfW, 0, halfW, canvas.height);
      }
      animFrame = requestAnimationFrame(render);
    };

    localVideo.onloadedmetadata = () => localVideo.play();
    remoteVideo.onloadedmetadata = () => remoteVideo.play();

    render();

    const combinedStream = canvas.captureStream(30);

    // Add audio from both streams
    localStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
    remoteStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));

    return {
      stream: combinedStream,
      cleanup: () => {
        cancelAnimationFrame(animFrame);
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
      },
    };
  }

  // ─── Private ────────────────────────────────────────────────────────

  private findSupportedMimeType(): string | null {
    return CODEC_PREFERENCES.find(c => MediaRecorder.isTypeSupported(c)) ?? null;
  }

  private notifyState(): void {
    this.onStateChange?.({ ...this.state });
  }
}
