// apps/web/src/engine/core/EventBus.ts

export type EngineEventMap = {
  countdown: { count: number };
  go: void;
  mistake: { entrantIndex: number };
  rankChange: { oldRank: number; newRank: number };
  playerFinish: { rank: number; timeMs: number };
  raceComplete: void;
  qualityChanged: { tier: 'high' | 'medium' | 'low' };
};

export type EventCallback<T> = (payload: T) => void;

export class EventBus {
  private listeners: {
    [K in keyof EngineEventMap]?: Set<EventCallback<EngineEventMap[K]>>;
  } = {};

  public on<K extends keyof EngineEventMap>(
    event: K,
    callback: EventCallback<EngineEventMap[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    const set = this.listeners[event] as Set<EventCallback<EngineEventMap[K]>>;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  public emit<K extends keyof EngineEventMap>(
    event: K,
    payload: EngineEventMap[K]
  ): void {
    const set = this.listeners[event] as Set<EventCallback<EngineEventMap[K]>> | undefined;
    if (set && set.size > 0) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in EventBus listener for "${event}":`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners = {};
  }
}
