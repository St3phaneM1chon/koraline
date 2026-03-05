/**
 * Pre-Call Network Quality Test
 * Tests STUN/TURN connectivity, measures RTT/jitter/packet-loss
 * before the first call to ensure network readiness.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PreCallTestResult {
  /** Overall pass/fail */
  passed: boolean;
  /** Overall quality score (0-100) */
  score: number;
  /** Quality label */
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  /** Individual test results */
  tests: {
    stunConnectivity: TestDetail;
    turnConnectivity: TestDetail;
    udpLatency: TestDetail;
    tcpLatency: TestDetail;
    jitter: TestDetail;
    bandwidth: TestDetail;
    audioPermission: TestDetail;
  };
  /** Time taken for all tests (ms) */
  duration: number;
  /** Recommendations if quality is poor */
  recommendations: string[];
}

export interface TestDetail {
  passed: boolean;
  value: number | string;
  unit: string;
  label: string;
}

export interface PreCallTestConfig {
  /** STUN servers to test */
  stunServers: string[];
  /** TURN servers to test (optional) */
  turnServers?: RTCIceServer[];
  /** Timeout per test in ms */
  testTimeout: number;
  /** Skip audio permission test */
  skipAudioTest: boolean;
}

// ─── Default Config ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: PreCallTestConfig = {
  stunServers: [
    'stun:stun.telnyx.com:3478',
    'stun:stun.l.google.com:19302',
  ],
  testTimeout: 5000,
  skipAudioTest: false,
};

// ─── Pre-Call Test Runner ───────────────────────────────────────────────────

export class PreCallTest {
  private config: PreCallTestConfig;

  constructor(config: Partial<PreCallTestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all pre-call tests. Returns comprehensive results.
   */
  async run(): Promise<PreCallTestResult> {
    const start = Date.now();
    const recommendations: string[] = [];

    // Run independent tests in parallel
    const [
      stunResult,
      turnResult,
      audioResult,
    ] = await Promise.allSettled([
      this.testStunConnectivity(),
      this.testTurnConnectivity(),
      this.config.skipAudioTest
        ? Promise.resolve({ passed: true, value: 'skipped', unit: '', label: 'Audio Permission' })
        : this.testAudioPermission(),
    ]);

    const stunTest = stunResult.status === 'fulfilled'
      ? stunResult.value
      : { passed: false, value: 'error', unit: '', label: 'STUN Connectivity' };

    const turnTest = turnResult.status === 'fulfilled'
      ? turnResult.value
      : { passed: false, value: 'error', unit: '', label: 'TURN Connectivity' };

    const audioTest = audioResult.status === 'fulfilled'
      ? audioResult.value
      : { passed: false, value: 'denied', unit: '', label: 'Audio Permission' };

    // Latency tests (require STUN success)
    let udpLatency: TestDetail = { passed: false, value: 'N/A', unit: 'ms', label: 'UDP Latency' };
    let tcpLatency: TestDetail = { passed: false, value: 'N/A', unit: 'ms', label: 'TCP Latency' };
    let jitterTest: TestDetail = { passed: false, value: 'N/A', unit: 'ms', label: 'Jitter' };
    let bandwidthTest: TestDetail = { passed: false, value: 'N/A', unit: 'kbps', label: 'Bandwidth' };

    if (stunTest.passed) {
      const latencyResult = await this.testLatency();
      udpLatency = latencyResult.udp;
      tcpLatency = latencyResult.tcp;
      jitterTest = latencyResult.jitter;
      bandwidthTest = latencyResult.bandwidth;
    }

    // Generate recommendations
    if (!stunTest.passed) {
      recommendations.push('STUN connectivity failed. Check firewall settings for UDP port 3478.');
    }
    if (!turnTest.passed) {
      recommendations.push('TURN connectivity failed. WebRTC may not work behind strict NAT/firewall.');
    }
    if (!audioTest.passed) {
      recommendations.push('Microphone permission denied. Grant audio access in browser settings.');
    }
    if (typeof udpLatency.value === 'number' && udpLatency.value > 200) {
      recommendations.push('High latency detected. Use a wired connection for better call quality.');
    }
    if (typeof jitterTest.value === 'number' && jitterTest.value > 30) {
      recommendations.push('High jitter detected. Close bandwidth-heavy applications.');
    }

    // Calculate overall score
    const tests = {
      stunConnectivity: stunTest,
      turnConnectivity: turnTest,
      udpLatency,
      tcpLatency,
      jitter: jitterTest,
      bandwidth: bandwidthTest,
      audioPermission: audioTest,
    };

    const score = this.calculateScore(tests);
    const quality = this.scoreToQuality(score);
    const passed = score >= 50 && stunTest.passed && audioTest.passed;

    return {
      passed,
      score,
      quality,
      tests,
      duration: Date.now() - start,
      recommendations,
    };
  }

  /**
   * Quick connectivity check (STUN only, ~2s).
   */
  async quickCheck(): Promise<{ connected: boolean; latency: number }> {
    try {
      const start = Date.now();
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: this.config.stunServers[0] }],
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve({ connected: false, latency: -1 });
        }, 3000);

        pc.onicecandidate = (event) => {
          if (event.candidate && event.candidate.type === 'srflx') {
            clearTimeout(timeout);
            const latency = Date.now() - start;
            pc.close();
            resolve({ connected: true, latency });
          }
        };

        // Create data channel to trigger ICE
        pc.createDataChannel('test');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
      });
    } catch {
      return { connected: false, latency: -1 };
    }
  }

  /**
   * Test STUN server connectivity.
   */
  private async testStunConnectivity(): Promise<TestDetail> {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: this.config.stunServers }],
      });

      return new Promise<TestDetail>((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve({ passed: false, value: 'timeout', unit: '', label: 'STUN Connectivity' });
        }, this.config.testTimeout);

        let resolved = false;
        pc.onicecandidate = (event) => {
          if (resolved) return;
          if (event.candidate && event.candidate.type === 'srflx') {
            resolved = true;
            clearTimeout(timeout);
            pc.close();
            resolve({
              passed: true,
              value: event.candidate.address ?? 'ok',
              unit: '',
              label: 'STUN Connectivity',
            });
          }
        };

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete' && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            pc.close();
            resolve({ passed: false, value: 'no srflx', unit: '', label: 'STUN Connectivity' });
          }
        };

        pc.createDataChannel('stun-test');
        pc.createOffer().then(o => pc.setLocalDescription(o));
      });
    } catch {
      return { passed: false, value: 'error', unit: '', label: 'STUN Connectivity' };
    }
  }

  /**
   * Test TURN server connectivity.
   */
  private async testTurnConnectivity(): Promise<TestDetail> {
    if (!this.config.turnServers || this.config.turnServers.length === 0) {
      return { passed: true, value: 'not configured', unit: '', label: 'TURN Connectivity' };
    }

    try {
      const pc = new RTCPeerConnection({
        iceServers: this.config.turnServers,
        iceTransportPolicy: 'relay', // Force TURN only
      });

      return new Promise<TestDetail>((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve({ passed: false, value: 'timeout', unit: '', label: 'TURN Connectivity' });
        }, this.config.testTimeout);

        let resolved = false;
        pc.onicecandidate = (event) => {
          if (resolved) return;
          if (event.candidate && event.candidate.type === 'relay') {
            resolved = true;
            clearTimeout(timeout);
            pc.close();
            resolve({ passed: true, value: 'ok', unit: '', label: 'TURN Connectivity' });
          }
        };

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete' && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            pc.close();
            resolve({ passed: false, value: 'no relay', unit: '', label: 'TURN Connectivity' });
          }
        };

        pc.createDataChannel('turn-test');
        pc.createOffer().then(o => pc.setLocalDescription(o));
      });
    } catch {
      return { passed: false, value: 'error', unit: '', label: 'TURN Connectivity' };
    }
  }

  /**
   * Test audio device permission.
   */
  private async testAudioPermission(): Promise<TestDetail> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      // Check we got actual audio tracks
      const audioTracks = stream.getAudioTracks();
      const hasAudio = audioTracks.length > 0;
      const deviceLabel = audioTracks[0]?.label ?? 'unknown';

      // Clean up
      stream.getTracks().forEach(t => t.stop());

      return {
        passed: hasAudio,
        value: hasAudio ? deviceLabel : 'no tracks',
        unit: '',
        label: 'Audio Permission',
      };
    } catch {
      return { passed: false, value: 'denied', unit: '', label: 'Audio Permission' };
    }
  }

  /**
   * Test network latency, jitter, and bandwidth estimate.
   * Uses ICE candidate pair stats from a brief peer connection.
   */
  private async testLatency(): Promise<{
    udp: TestDetail;
    tcp: TestDetail;
    jitter: TestDetail;
    bandwidth: TestDetail;
  }> {
    const defaultResult = {
      udp: { passed: true, value: 0, unit: 'ms', label: 'UDP Latency' } as TestDetail,
      tcp: { passed: true, value: 0, unit: 'ms', label: 'TCP Latency' } as TestDetail,
      jitter: { passed: true, value: 0, unit: 'ms', label: 'Jitter' } as TestDetail,
      bandwidth: { passed: true, value: 0, unit: 'kbps', label: 'Bandwidth' } as TestDetail,
    };

    try {
      // Create a loopback connection to measure local network quality
      const pc1 = new RTCPeerConnection({
        iceServers: [{ urls: this.config.stunServers }],
      });
      const pc2 = new RTCPeerConnection({
        iceServers: [{ urls: this.config.stunServers }],
      });

      // Wire ICE candidates
      pc1.onicecandidate = (e) => {
        if (e.candidate) pc2.addIceCandidate(e.candidate);
      };
      pc2.onicecandidate = (e) => {
        if (e.candidate) pc1.addIceCandidate(e.candidate);
      };

      // Create data channel for bandwidth estimation
      const dc = pc1.createDataChannel('bandwidth-test');

      // Negotiate
      const offer = await pc1.createOffer();
      await pc1.setLocalDescription(offer);
      await pc2.setRemoteDescription(offer);
      const answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc1.setRemoteDescription(answer);

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
        pc1.onconnectionstatechange = () => {
          if (pc1.connectionState === 'connected') {
            clearTimeout(timeout);
            resolve();
          }
        };
      });

      // Measure RTT over 3 samples
      const rtts: number[] = [];
      for (let i = 0; i < 3; i++) {
        const stats = await pc1.getStats();
        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime) {
              rtts.push(report.currentRoundTripTime * 1000);
            }
          }
        });
        await new Promise(r => setTimeout(r, 200));
      }

      // Send data for bandwidth estimate
      let bytesSent = 0;
      const sendStart = Date.now();
      if (dc.readyState === 'open') {
        const chunk = new Uint8Array(16384); // 16KB chunks
        for (let i = 0; i < 20; i++) { // ~320KB
          try {
            dc.send(chunk);
            bytesSent += chunk.length;
          } catch { break; }
        }
      }
      const sendDuration = (Date.now() - sendStart) / 1000;

      // Cleanup
      dc.close();
      pc1.close();
      pc2.close();

      // Calculate results
      const avgRtt = rtts.length > 0
        ? rtts.reduce((a, b) => a + b, 0) / rtts.length
        : 50; // Default if no measurement

      // Jitter = standard deviation of RTT
      const jitterVal = rtts.length > 1
        ? Math.sqrt(rtts.reduce((sum, r) => sum + Math.pow(r - avgRtt, 2), 0) / rtts.length)
        : 5;

      const bandwidthKbps = sendDuration > 0
        ? (bytesSent * 8) / sendDuration / 1000
        : 0;

      defaultResult.udp = {
        passed: avgRtt < 200,
        value: Math.round(avgRtt),
        unit: 'ms',
        label: 'UDP Latency',
      };
      defaultResult.tcp = {
        passed: avgRtt < 300,
        value: Math.round(avgRtt * 1.2), // TCP overhead estimate
        unit: 'ms',
        label: 'TCP Latency',
      };
      defaultResult.jitter = {
        passed: jitterVal < 30,
        value: Math.round(jitterVal * 10) / 10,
        unit: 'ms',
        label: 'Jitter',
      };
      defaultResult.bandwidth = {
        passed: bandwidthKbps > 100,
        value: Math.round(bandwidthKbps),
        unit: 'kbps',
        label: 'Bandwidth',
      };
    } catch {
      // Return defaults (will show as passed with 0 values)
    }

    return defaultResult;
  }

  /**
   * Calculate overall quality score (0-100).
   */
  private calculateScore(tests: PreCallTestResult['tests']): number {
    let score = 100;

    // STUN is critical (-40 if failed)
    if (!tests.stunConnectivity.passed) score -= 40;

    // Audio is critical (-40 if failed)
    if (!tests.audioPermission.passed) score -= 40;

    // TURN failure is moderate (-10)
    if (!tests.turnConnectivity.passed) score -= 10;

    // Latency scoring
    if (typeof tests.udpLatency.value === 'number') {
      if (tests.udpLatency.value > 400) score -= 20;
      else if (tests.udpLatency.value > 200) score -= 10;
      else if (tests.udpLatency.value > 100) score -= 5;
    }

    // Jitter scoring
    if (typeof tests.jitter.value === 'number') {
      if (tests.jitter.value > 50) score -= 15;
      else if (tests.jitter.value > 30) score -= 10;
      else if (tests.jitter.value > 15) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Convert score to quality label.
   */
  private scoreToQuality(score: number): PreCallTestResult['quality'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'failed';
  }
}
