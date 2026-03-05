/**
 * Spatial Audio Engine — Web Audio API panning for multi-participant conferences.
 *
 * Uses HRTF (Head-Related Transfer Function) panning to position each participant
 * in 3D space around the listener, creating a natural conference experience where
 * voices come from different directions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpatialParticipant {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  stream: MediaStream;
  pannerNode?: PannerNode;
  gainNode?: GainNode;
  sourceNode?: MediaStreamAudioSourceNode;
}

// ---------------------------------------------------------------------------
// SpatialAudioEngine
// ---------------------------------------------------------------------------

export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private participants: Map<string, SpatialParticipant> = new Map();
  private listener: AudioListener | null = null;

  constructor() {}

  /**
   * Initialize the AudioContext and set listener position at origin.
   * Must be called after a user gesture (browser autoplay policy).
   */
  init(): void {
    if (this.ctx) return;

    this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
    this.listener = this.ctx.listener;

    // Position listener at origin, facing negative Z (standard WebAudio convention)
    if (this.listener.positionX) {
      // AudioListener with AudioParam API (modern browsers)
      this.listener.positionX.value = 0;
      this.listener.positionY.value = 0;
      this.listener.positionZ.value = 0;
      this.listener.forwardX.value = 0;
      this.listener.forwardY.value = 0;
      this.listener.forwardZ.value = -1;
      this.listener.upX.value = 0;
      this.listener.upY.value = 1;
      this.listener.upZ.value = 0;
    } else {
      // Fallback for older browsers
      this.listener.setPosition(0, 0, 0);
      this.listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
  }

  /**
   * Add a participant with their audio stream at a 3D position.
   * Chain: MediaStreamSource -> PannerNode -> GainNode -> destination
   *
   * @param id - Unique participant identifier
   * @param name - Display name
   * @param stream - MediaStream from WebRTC
   * @param position - Optional 3D position; defaults to auto-arranged in circle
   */
  addParticipant(
    id: string,
    name: string,
    stream: MediaStream,
    position?: { x: number; y: number; z: number },
  ): void {
    if (!this.ctx) {
      this.init();
    }

    // Remove existing participant with same ID if present
    if (this.participants.has(id)) {
      this.removeParticipant(id);
    }

    const ctx = this.ctx!;

    // Create audio source from stream
    const sourceNode = ctx.createMediaStreamSource(stream);

    // Create PannerNode with HRTF for realistic spatial audio
    const pannerNode = ctx.createPanner();
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'inverse';
    pannerNode.refDistance = 1;
    pannerNode.maxDistance = 100;
    pannerNode.rolloffFactor = 1;
    pannerNode.coneInnerAngle = 360;
    pannerNode.coneOuterAngle = 360;
    pannerNode.coneOuterGain = 0;

    // Create GainNode for individual volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;

    // Set position
    const pos = position ?? this.getNextCirclePosition();

    if (pannerNode.positionX) {
      pannerNode.positionX.value = pos.x;
      pannerNode.positionY.value = pos.y;
      pannerNode.positionZ.value = pos.z;
    } else {
      pannerNode.setPosition(pos.x, pos.y, pos.z);
    }

    // Connect chain: source -> panner -> gain -> destination
    sourceNode.connect(pannerNode);
    pannerNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const participant: SpatialParticipant = {
      id,
      name,
      position: { ...pos },
      stream,
      pannerNode,
      gainNode,
      sourceNode,
    };

    this.participants.set(id, participant);
  }

  /**
   * Remove a participant and disconnect their audio nodes.
   */
  removeParticipant(id: string): void {
    const participant = this.participants.get(id);
    if (!participant) return;

    try {
      participant.sourceNode?.disconnect();
      participant.pannerNode?.disconnect();
      participant.gainNode?.disconnect();
    } catch {
      // Nodes may already be disconnected
    }

    this.participants.delete(id);
  }

  /**
   * Update a participant's 3D position with smooth interpolation.
   */
  setPosition(id: string, x: number, y: number, z: number): void {
    const participant = this.participants.get(id);
    if (!participant || !participant.pannerNode) return;

    participant.position = { x, y, z };

    const panner = participant.pannerNode;
    const currentTime = this.ctx?.currentTime ?? 0;
    const rampDuration = 0.1; // 100ms smooth transition

    if (panner.positionX) {
      panner.positionX.linearRampToValueAtTime(x, currentTime + rampDuration);
      panner.positionY.linearRampToValueAtTime(y, currentTime + rampDuration);
      panner.positionZ.linearRampToValueAtTime(z, currentTime + rampDuration);
    } else {
      panner.setPosition(x, y, z);
    }
  }

  /**
   * Automatically arrange all participants in a circle around the listener.
   * Radius 3 units, at ear level (y=0), evenly spaced.
   */
  arrangeCircle(): void {
    const ids = Array.from(this.participants.keys());
    const count = ids.length;
    if (count === 0) return;

    const radius = 3;

    ids.forEach((id, index) => {
      const angle = (2 * Math.PI * index) / count;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      this.setPosition(id, x, 0, z);
    });
  }

  /**
   * Set individual participant volume.
   * @param volume - 0.0 (silent) to 1.0 (full volume)
   */
  setVolume(id: string, volume: number): void {
    const participant = this.participants.get(id);
    if (!participant?.gainNode || !this.ctx) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    participant.gainNode.gain.linearRampToValueAtTime(
      clampedVolume,
      this.ctx.currentTime + 0.05,
    );
  }

  /**
   * Mute or unmute a specific participant.
   */
  muteParticipant(id: string, muted: boolean): void {
    const participant = this.participants.get(id);
    if (!participant?.gainNode || !this.ctx) return;

    participant.gainNode.gain.linearRampToValueAtTime(
      muted ? 0 : 1,
      this.ctx.currentTime + 0.05,
    );
  }

  /**
   * Get a snapshot of all current participants.
   */
  getParticipants(): SpatialParticipant[] {
    return Array.from(this.participants.values()).map((p) => ({
      id: p.id,
      name: p.name,
      position: { ...p.position },
      stream: p.stream,
      pannerNode: p.pannerNode,
      gainNode: p.gainNode,
      sourceNode: p.sourceNode,
    }));
  }

  /**
   * Get the number of active participants.
   */
  getParticipantCount(): number {
    return this.participants.size;
  }

  /**
   * Check if a participant exists.
   */
  hasParticipant(id: string): boolean {
    return this.participants.has(id);
  }

  /**
   * Compute the next position on a circle for a new participant.
   */
  private getNextCirclePosition(): { x: number; y: number; z: number } {
    const count = this.participants.size;
    const radius = 3;
    const angle = (2 * Math.PI * count) / Math.max(count + 1, 2);
    return {
      x: radius * Math.cos(angle),
      y: 0,
      z: radius * Math.sin(angle),
    };
  }

  /**
   * Cleanup all audio resources and close the context.
   */
  destroy(): void {
    // Disconnect all participants
    for (const [id] of this.participants) {
      this.removeParticipant(id);
    }
    this.participants.clear();

    // Close the audio context
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.listener = null;
  }
}
