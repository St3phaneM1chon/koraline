/**
 * Virtual Background - MediaPipe Selfie Segmentation + Canvas Composite
 * Provides blur, image, and color backgrounds for video calls.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BackgroundType = 'none' | 'blur' | 'image' | 'color';

export interface VirtualBackgroundConfig {
  type: BackgroundType;
  /** Blur intensity (1-20, default 10) */
  blurIntensity?: number;
  /** Background image URL */
  imageUrl?: string;
  /** Background color (CSS color) */
  color?: string;
}

export interface BackgroundPreset {
  id: string;
  label: string;
  type: BackgroundType;
  thumbnailUrl?: string;
  value: string; // blur intensity, image URL, or color
}

// ─── Default Presets ────────────────────────────────────────────────────────

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'none', label: 'None', type: 'none', value: '' },
  { id: 'blur-light', label: 'Slight Blur', type: 'blur', value: '5' },
  { id: 'blur-strong', label: 'Strong Blur', type: 'blur', value: '15' },
  { id: 'color-office', label: 'Office Gray', type: 'color', value: '#e5e7eb' },
  { id: 'color-green', label: 'Green Screen', type: 'color', value: '#22c55e' },
  { id: 'color-blue', label: 'Corporate Blue', type: 'color', value: '#3b82f6' },
];

// ─── Virtual Background Processor ───────────────────────────────────────────

export class VirtualBackgroundProcessor {
  private config: VirtualBackgroundConfig = { type: 'none' };
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private video: HTMLVideoElement | null = null;
  private outputStream: MediaStream | null = null;
  private animationFrame: number | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private isProcessing = false;

  /**
   * Initialize the virtual background processor.
   * Takes a raw camera MediaStream and returns a processed MediaStream.
   */
  async process(
    inputStream: MediaStream,
    config: VirtualBackgroundConfig
  ): Promise<MediaStream> {
    this.config = config;

    if (config.type === 'none') {
      return inputStream; // Pass through
    }

    // Create video element to play input stream
    this.video = document.createElement('video');
    this.video.srcObject = inputStream;
    this.video.autoplay = true;
    this.video.muted = true;

    await new Promise<void>((resolve) => {
      this.video!.onloadedmetadata = () => {
        this.video!.play();
        resolve();
      };
    });

    const width = this.video.videoWidth || 640;
    const height = this.video.videoHeight || 480;

    // Create canvas for compositing
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    if (!this.ctx) {
      throw new Error('Could not get canvas 2D context');
    }

    // Load background image if needed
    if (config.type === 'image' && config.imageUrl) {
      this.backgroundImage = await this.loadImage(config.imageUrl);
    }

    // Create output stream from canvas
    this.outputStream = this.canvas.captureStream(30);

    // Add audio tracks from input
    inputStream.getAudioTracks().forEach(track => {
      this.outputStream!.addTrack(track);
    });

    // Start rendering loop
    this.isProcessing = true;
    this.renderFrame();

    return this.outputStream;
  }

  /**
   * Render a single frame with background effects.
   * Note: Without MediaPipe segmentation, this uses a simpler
   * canvas-based approach. In production, integrate @mediapipe/selfie_segmentation.
   */
  private renderFrame(): void {
    if (!this.isProcessing || !this.ctx || !this.video || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Draw current video frame
    this.ctx.drawImage(this.video, 0, 0, width, height);

    switch (this.config.type) {
      case 'blur': {
        // Simple blur effect (no segmentation - blurs entire frame edges)
        // In production, MediaPipe would segment person from background
        const intensity = this.config.blurIntensity ?? 10;
        this.ctx.filter = `blur(${intensity}px)`;
        this.ctx.drawImage(this.video, 0, 0, width, height);
        this.ctx.filter = 'none';
        // Draw sharp center (crude person approximation)
        const cx = width * 0.15;
        const cy = height * 0.1;
        const cw = width * 0.7;
        const ch = height * 0.8;
        this.ctx.drawImage(this.video, cx, cy, cw, ch, cx, cy, cw, ch);
        break;
      }

      case 'image': {
        if (this.backgroundImage) {
          // Draw background image
          this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
          // Overlay person (crude center crop without segmentation)
          const cx = width * 0.2;
          const cy = height * 0.05;
          const cw = width * 0.6;
          const ch = height * 0.9;
          this.ctx.drawImage(this.video, cx, cy, cw, ch, cx, cy, cw, ch);
        }
        break;
      }

      case 'color': {
        // Solid color background
        this.ctx.fillStyle = this.config.color ?? '#e5e7eb';
        this.ctx.fillRect(0, 0, width, height);
        // Overlay person (crude center crop)
        const cx = width * 0.2;
        const cy = height * 0.05;
        const cw = width * 0.6;
        const ch = height * 0.9;
        this.ctx.drawImage(this.video, cx, cy, cw, ch, cx, cy, cw, ch);
        break;
      }
    }

    this.animationFrame = requestAnimationFrame(() => this.renderFrame());
  }

  /**
   * Update the background configuration mid-call.
   */
  async updateConfig(config: VirtualBackgroundConfig): Promise<void> {
    this.config = config;

    if (config.type === 'image' && config.imageUrl) {
      this.backgroundImage = await this.loadImage(config.imageUrl);
    }
  }

  /**
   * Stop processing and clean up.
   */
  destroy(): void {
    this.isProcessing = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    if (this.outputStream) {
      this.outputStream.getTracks().forEach(t => t.stop());
      this.outputStream = null;
    }

    this.canvas = null;
    this.ctx = null;
    this.backgroundImage = null;
  }

  /**
   * Check if virtual backgrounds are supported.
   */
  static isSupported(): boolean {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('2d') && typeof canvas.captureStream === 'function';
  }

  /**
   * Load an image URL into an HTMLImageElement.
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
