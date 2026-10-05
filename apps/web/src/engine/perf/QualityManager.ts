// apps/web/src/engine/perf/QualityManager.ts
import { QualityTier, detectInitialTier } from './deviceProfile.js';
import { PerfMetrics } from './PerfMonitor.js';
import { EventBus } from '../core/EventBus.js';

export interface QualityConfig {
  tier: QualityTier;
  dprCap: number;
  shadowMapSize: number;
  shadowsEnabled: boolean;
  speedStreakCount: number;
  dustCount: number;
  detailLayer: boolean;
  viewDistanceMultiplier: number;
}

export const QUALITY_CONFIGS: Record<QualityTier, QualityConfig> = {
  high: {
    tier: 'high',
    dprCap: 2.0,
    shadowMapSize: 2048,
    shadowsEnabled: true,
    speedStreakCount: 28,
    dustCount: 16,
    detailLayer: true,
    viewDistanceMultiplier: 1.0,
  },
  medium: {
    tier: 'medium',
    dprCap: 1.5,
    shadowMapSize: 1024,
    shadowsEnabled: true,
    speedStreakCount: 16,
    dustCount: 10,
    detailLayer: true,
    viewDistanceMultiplier: 0.8,
  },
  low: {
    tier: 'low',
    dprCap: 1.0,
    shadowMapSize: 0,
    shadowsEnabled: false,
    speedStreakCount: 6,
    dustCount: 4,
    detailLayer: false,
    viewDistanceMultiplier: 0.6,
  },
};

export class QualityManager {
  public tier: QualityTier;
  public config: QualityConfig;
  private eventBus: EventBus;

  private downgradeCount: number = 0;
  private isLocked: boolean = false;
  private lastEvaluationTime: number = 0;
  private goodPerformanceSince: number = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.tier = detectInitialTier();
    this.config = QUALITY_CONFIGS[this.tier];
  }

  public setTier(tier: QualityTier): void {
    if (this.tier === tier) return;
    this.tier = tier;
    this.config = QUALITY_CONFIGS[tier];
    this.eventBus.emit('qualityChanged', { tier });
  }

  /**
   * Evaluates dynamic performance and gracefully scales quality down if device is under heavy load.
   */
  public evaluate(metrics: PerfMetrics, nowWallMs: number, isRacing: boolean): void {
    if (!isRacing || this.isLocked) return;

    // Check at most every 2 seconds
    if (nowWallMs - this.lastEvaluationTime < 2000) return;
    this.lastEvaluationTime = nowWallMs;

    // Downgrade condition: average frame time > 18.5ms (~54 FPS) or p95 > 20.0ms
    if (metrics.avgFrameMs > 18.5 || metrics.p95FrameMs > 20.0) {
      this.goodPerformanceSince = 0;
      if (this.tier === 'high') {
        this.setTier('medium');
        this.downgradeCount++;
      } else if (this.tier === 'medium') {
        this.setTier('low');
        this.downgradeCount++;
        this.isLocked = true; // Lock on low to prevent flapping
      }
      return;
    }

    // Upgrade condition: rock-solid performance (p95 < 16.0ms) for 12 continuous seconds
    if (metrics.p95FrameMs < 16.0 && metrics.avgFrameMs < 15.0) {
      if (this.goodPerformanceSince === 0) {
        this.goodPerformanceSince = nowWallMs;
      } else if (nowWallMs - this.goodPerformanceSince > 12000) {
        if (this.tier === 'medium' && this.downgradeCount < 2) {
          this.setTier('high');
        }
        this.goodPerformanceSince = 0;
      }
    } else {
      this.goodPerformanceSince = 0;
    }
  }
}
