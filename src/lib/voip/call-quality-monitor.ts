/**
 * Call Quality Monitor - Real-time MOS/R-Factor calculation
 * Uses WebRTC getStats() API + rtcscore algorithm (ITU-T G.107 E-Model)
 *
 * Provides:
 * - Real-time MOS score (1.0-5.0)
 * - R-Factor (0-100)
 * - Jitter, packet loss, RTT monitoring
 * - Quality alerts when metrics degrade
 * - Quality history for post-call analysis
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CallQualityMetrics {
  /** Mean Opinion Score (1.0 = bad, 5.0 = excellent) */
  mos: number;
  /** R-Factor (0-100, maps to MOS) */
  rFactor: number;
  /** Round-trip time in ms */
  rtt: number;
  /** Jitter in ms */
  jitter: number;
  /** Packet loss percentage (0-100) */
  packetLoss: number;
  /** Audio bitrate in kbps */
  bitrate: number;
  /** Codec in use */
  codec: string;
  /** Signal level (1-5 bars for UI) */
  signalBars: number;
  /** Quality label */
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  /** Timestamp */
  timestamp: number;
}

export interface QualityAlert {
  type: 'packet_loss' | 'jitter' | 'rtt' | 'mos' | 'bitrate';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface QualityThresholds {
  packetLossWarning: number;   // % default 3
  packetLossCritical: number;  // % default 8
  jitterWarning: number;       // ms default 30
  jitterCritical: number;      // ms default 50
  rttWarning: number;          // ms default 200
  rttCritical: number;         // ms default 400
  mosWarning: number;          // default 3.5
  mosCritical: number;         // default 2.5
  bitrateMinWarning: number;   // kbps default 24
}

export interface QualityHistory {
  metrics: CallQualityMetrics[];
  alerts: QualityAlert[];
  averageMos: number;
  worstMos: number;
  totalPacketLoss: number;
  callDuration: number;
}

// ─── Default Thresholds ─────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS: QualityThresholds = {
  packetLossWarning: 3,
  packetLossCritical: 8,
  jitterWarning: 30,
  jitterCritical: 50,
  rttWarning: 200,
  rttCritical: 400,
  mosWarning: 3.5,
  mosCritical: 2.5,
  bitrateMinWarning: 24,
};

// ─── E-Model Constants (ITU-T G.107) ────────────────────────────────────────

const E_MODEL = {
  /** Default advantage factor for VoIP */
  A: 0,
  /** Equipment impairment factor for codec */
  Ie: {
    opus: 0,      // Opus has minimal impairment
    'g.722': 7,
    'g.711': 0,
    pcmu: 0,
    pcma: 0,
    unknown: 10,
  } as Record<string, number>,
  /** Packet loss robustness factor */
  Bpl: {
    opus: 19.8,   // Opus handles loss well
    'g.722': 10,
    'g.711': 4.3,
    pcmu: 4.3,
    pcma: 4.3,
    unknown: 10,
  } as Record<string, number>,
};

// ─── Quality Monitor Class ──────────────────────────────────────────────────

export class CallQualityMonitor {
  private peerConnection: RTCPeerConnection | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private thresholds: QualityThresholds;
  private history: CallQualityMetrics[] = [];
  private alerts: QualityAlert[] = [];
  private startTime = 0;
  private prevStats: {
    bytesSent: number;
    bytesReceived: number;
    packetsSent: number;
    packetsReceived: number;
    packetsLost: number;
    timestamp: number;
  } | null = null;

  private onMetricsUpdate?: (metrics: CallQualityMetrics) => void;
  private onAlert?: (alert: QualityAlert) => void;

  constructor(thresholds: Partial<QualityThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Start monitoring a WebRTC peer connection.
   * Polls getStats() every second.
   */
  start(pc: RTCPeerConnection, pollIntervalMs = 1000): void {
    this.peerConnection = pc;
    this.startTime = Date.now();
    this.history = [];
    this.alerts = [];
    this.prevStats = null;

    this.pollInterval = setInterval(() => {
      this.collectStats();
    }, pollIntervalMs);
  }

  /**
   * Stop monitoring and return quality history.
   */
  stop(): QualityHistory {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.peerConnection = null;

    const mosValues = this.history.map(m => m.mos);
    const avgMos = mosValues.length > 0
      ? mosValues.reduce((a, b) => a + b, 0) / mosValues.length
      : 0;
    const worstMos = mosValues.length > 0 ? Math.min(...mosValues) : 0;
    const totalPacketLoss = this.history.length > 0
      ? this.history[this.history.length - 1].packetLoss
      : 0;

    return {
      metrics: this.history,
      alerts: this.alerts,
      averageMos: Math.round(avgMos * 100) / 100,
      worstMos: Math.round(worstMos * 100) / 100,
      totalPacketLoss: Math.round(totalPacketLoss * 100) / 100,
      callDuration: (Date.now() - this.startTime) / 1000,
    };
  }

  /**
   * Register callback for real-time metrics updates.
   */
  onMetrics(callback: (metrics: CallQualityMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }

  /**
   * Register callback for quality alerts.
   */
  onQualityAlert(callback: (alert: QualityAlert) => void): void {
    this.onAlert = callback;
  }

  /**
   * Get current metrics snapshot.
   */
  getCurrentMetrics(): CallQualityMetrics | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Collect stats from the peer connection.
   */
  private async collectStats(): Promise<void> {
    if (!this.peerConnection || this.peerConnection.connectionState === 'closed') {
      return;
    }

    try {
      const stats = await this.peerConnection.getStats();
      let rtt = 0;
      let jitter = 0;
      let packetLoss = 0;
      let bitrate = 0;
      let codec = 'unknown';
      let currentBytesSent = 0;
      let currentBytesReceived = 0;
      let currentPacketsSent = 0;
      let currentPacketsReceived = 0;
      let currentPacketsLost = 0;
      let currentTimestamp = Date.now();

      // Codec lookup map
      const codecs = new Map<string, string>();

      stats.forEach((report) => {
        if (report.type === 'codec') {
          codecs.set(report.id, report.mimeType?.split('/')[1]?.toLowerCase() ?? 'unknown');
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
        }

        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          jitter = (report.jitter ?? 0) * 1000; // Convert to ms
          currentPacketsReceived = report.packetsReceived ?? 0;
          currentPacketsLost = report.packetsLost ?? 0;
          currentBytesReceived = report.bytesReceived ?? 0;
          currentTimestamp = report.timestamp;

          if (report.codecId && codecs.has(report.codecId)) {
            codec = codecs.get(report.codecId)!;
          }
        }

        if (report.type === 'outbound-rtp' && report.kind === 'audio') {
          currentBytesSent = report.bytesSent ?? 0;
          currentPacketsSent = report.packetsSent ?? 0;
        }
      });

      // Calculate packet loss percentage
      const totalPackets = currentPacketsReceived + currentPacketsLost;
      packetLoss = totalPackets > 0 ? (currentPacketsLost / totalPackets) * 100 : 0;

      // Calculate bitrate (delta)
      if (this.prevStats) {
        const deltaTime = (currentTimestamp - this.prevStats.timestamp) / 1000;
        if (deltaTime > 0) {
          const deltaBytes = (currentBytesReceived - this.prevStats.bytesReceived)
            + (currentBytesSent - this.prevStats.bytesSent);
          bitrate = (deltaBytes * 8) / deltaTime / 1000; // kbps
        }
      }

      this.prevStats = {
        bytesSent: currentBytesSent,
        bytesReceived: currentBytesReceived,
        packetsSent: currentPacketsSent,
        packetsReceived: currentPacketsReceived,
        packetsLost: currentPacketsLost,
        timestamp: currentTimestamp,
      };

      // Calculate MOS using E-Model
      const { mos, rFactor } = this.calculateMos(rtt, jitter, packetLoss, codec);

      // Determine signal bars and quality label
      const signalBars = this.mosToSignalBars(mos);
      const quality = this.mosToQuality(mos);

      const metrics: CallQualityMetrics = {
        mos: Math.round(mos * 100) / 100,
        rFactor: Math.round(rFactor),
        rtt: Math.round(rtt),
        jitter: Math.round(jitter * 10) / 10,
        packetLoss: Math.round(packetLoss * 100) / 100,
        bitrate: Math.round(bitrate),
        codec,
        signalBars,
        quality,
        timestamp: Date.now(),
      };

      this.history.push(metrics);
      this.checkAlerts(metrics);
      this.onMetricsUpdate?.(metrics);
    } catch {
      // getStats() can fail if connection is closing
    }
  }

  /**
   * Calculate MOS using ITU-T G.107 E-Model.
   * R = Ro - Is - Id - Ie_eff + A
   * MOS = 1 + 0.035*R + R*(R-60)*(100-R)*7e-6
   */
  private calculateMos(
    rtt: number,
    jitter: number,
    packetLoss: number,
    codec: string
  ): { mos: number; rFactor: number } {
    // Base R-Factor (assumes good equipment, no echo)
    const Ro = 93.2;

    // Simultaneous impairment factor (negligible for modern codecs)
    const Is = 0;

    // Delay impairment
    // One-way delay = RTT/2 + jitter buffer (assume 2x jitter)
    const oneWayDelay = rtt / 2 + jitter * 2;
    let Id = 0;
    if (oneWayDelay > 177.3) {
      Id = 0.024 * oneWayDelay + 0.11 * (oneWayDelay - 177.3);
    } else {
      Id = 0.024 * oneWayDelay;
    }

    // Equipment/codec impairment + packet loss
    const codecKey = codec.toLowerCase();
    const Ie = E_MODEL.Ie[codecKey] ?? E_MODEL.Ie.unknown;
    const Bpl = E_MODEL.Bpl[codecKey] ?? E_MODEL.Bpl.unknown;
    const Ie_eff = Ie + (95 - Ie) * (packetLoss / (packetLoss + Bpl));

    // R-Factor
    let R = Ro - Is - Id - Ie_eff + E_MODEL.A;
    R = Math.max(0, Math.min(100, R));

    // R-Factor to MOS conversion
    let mos: number;
    if (R < 6.5) {
      mos = 1;
    } else if (R > 100) {
      mos = 4.5;
    } else {
      mos = 1 + 0.035 * R + R * (R - 60) * (100 - R) * 7e-6;
    }
    mos = Math.max(1, Math.min(5, mos));

    return { mos, rFactor: R };
  }

  /**
   * Convert MOS to signal bars (1-5).
   */
  private mosToSignalBars(mos: number): number {
    if (mos >= 4.3) return 5;
    if (mos >= 4.0) return 4;
    if (mos >= 3.6) return 3;
    if (mos >= 3.1) return 2;
    return 1;
  }

  /**
   * Convert MOS to quality label.
   */
  private mosToQuality(mos: number): CallQualityMetrics['quality'] {
    if (mos >= 4.3) return 'excellent';
    if (mos >= 4.0) return 'good';
    if (mos >= 3.6) return 'fair';
    if (mos >= 3.1) return 'poor';
    return 'bad';
  }

  /**
   * Check metrics against thresholds and emit alerts.
   */
  private checkAlerts(metrics: CallQualityMetrics): void {
    const checks: Array<{
      type: QualityAlert['type'];
      value: number;
      warningThreshold: number;
      criticalThreshold: number;
      higherIsBad: boolean;
    }> = [
      {
        type: 'packet_loss',
        value: metrics.packetLoss,
        warningThreshold: this.thresholds.packetLossWarning,
        criticalThreshold: this.thresholds.packetLossCritical,
        higherIsBad: true,
      },
      {
        type: 'jitter',
        value: metrics.jitter,
        warningThreshold: this.thresholds.jitterWarning,
        criticalThreshold: this.thresholds.jitterCritical,
        higherIsBad: true,
      },
      {
        type: 'rtt',
        value: metrics.rtt,
        warningThreshold: this.thresholds.rttWarning,
        criticalThreshold: this.thresholds.rttCritical,
        higherIsBad: true,
      },
      {
        type: 'mos',
        value: metrics.mos,
        warningThreshold: this.thresholds.mosWarning,
        criticalThreshold: this.thresholds.mosCritical,
        higherIsBad: false, // Lower MOS is bad
      },
    ];

    for (const check of checks) {
      const isBad = check.higherIsBad
        ? check.value >= check.criticalThreshold
        : check.value <= check.criticalThreshold;
      const isWarning = check.higherIsBad
        ? check.value >= check.warningThreshold
        : check.value <= check.warningThreshold;

      if (isBad || isWarning) {
        const alert: QualityAlert = {
          type: check.type,
          severity: isBad ? 'critical' : 'warning',
          message: this.getAlertMessage(check.type, check.value, isBad ? 'critical' : 'warning'),
          value: check.value,
          threshold: isBad ? check.criticalThreshold : check.warningThreshold,
          timestamp: Date.now(),
        };

        // Deduplicate: only alert if last alert of same type was >10s ago
        const lastSame = this.alerts.filter(a => a.type === check.type).pop();
        if (!lastSame || Date.now() - lastSame.timestamp > 10000) {
          this.alerts.push(alert);
          this.onAlert?.(alert);
        }
      }
    }
  }

  /**
   * Generate human-readable alert message.
   */
  private getAlertMessage(
    type: QualityAlert['type'],
    value: number,
    severity: 'warning' | 'critical'
  ): string {
    const labels: Record<QualityAlert['type'], string> = {
      packet_loss: `Packet loss ${severity === 'critical' ? 'critical' : 'elevated'}: ${value.toFixed(1)}%`,
      jitter: `Jitter ${severity === 'critical' ? 'critical' : 'elevated'}: ${value.toFixed(0)}ms`,
      rtt: `Latency ${severity === 'critical' ? 'critical' : 'elevated'}: ${value.toFixed(0)}ms`,
      mos: `Call quality ${severity === 'critical' ? 'critical' : 'degraded'}: MOS ${value.toFixed(1)}`,
      bitrate: `Low bitrate: ${value.toFixed(0)}kbps`,
    };
    return labels[type];
  }
}
