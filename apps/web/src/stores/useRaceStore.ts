// apps/web/src/stores/useRaceStore.ts
import { create } from 'zustand';
import {
  Difficulty,
  CarSpec,
  CAR_SPECS,
  M,
  RacerSim,
  createRacerSim,
  generateAiLog,
  AI_DIFFICULTY_PROFILES,
  createTypingState,
  TypingState,
  KeystrokeEntry,
  Passage,
  passageEngine,
  RaceEntrant,
} from '@typerace/sim';
import { PassageItem } from '../data/passages.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { useTypingStore, setTypingMistakeListener } from './useTypingStore.js';
import { useAuthStore } from './useAuthStore.js';
import { useSettingsStore } from './useSettingsStore.js';
import { gameEngine } from '../engine/GameEngine.js';

export type RaceStatus =
  | 'idle'
  | 'countdown'
  | 'racing'
  | 'paused'
  | 'round_complete'
  | 'results';

export interface OpponentState {
  racer: RacerSim;
  typing: TypingState;
  log: KeystrokeEntry[];
  car: CarSpec;
  targetWpm: number;
}

export interface RoundResult {
  roundNumber: number; // 1, 2, 3
  isWin: boolean;
  position: 1 | 2 | 3;
  timeSeconds: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  passageText: string;
}

export interface FinalRaceResult {
  isWin: boolean;
  position: 1 | 2 | 3;
  timeSeconds: number; // total time
  wpm: number; // average WPM
  bestWpm: number;
  accuracy: number;
  mistakes: number;
  bestRound: number;
  carId: string;
  trackId?: string;
  difficulty: Difficulty;
  counted: boolean;
  rounds: RoundResult[];
  pointsEarned?: number;
  opponents: {
    name: string;
    position: number;
    timeSeconds: number;
    wpm: number;
  }[];
}

export interface RaceStoreState {
  status: RaceStatus;
  currentRound: number; // 1, 2, or 3
  totalRounds: number; // 3
  roundResults: RoundResult[];
  selectedCarId: string;
  selectedTrackId: string;
  customPaintColor: string | null;
  difficulty: Difficulty;
  currentPassage: Passage | PassageItem;
  raceDistance: number;
  countdownValue: number; // 3, 2, 1, 0 (GO)
  raceTimeMs: number;
  playerSim: RacerSim;
  opponents: OpponentState[];
  lastResult: FinalRaceResult | null;
  newBests: string[];
  pointsEarned: number;

  selectCar: (carId: string) => void;
  selectTrack: (trackId: string) => void;
  setCustomPaintColor: (hex: string | null) => void;
  selectDifficulty: (diff: Difficulty) => void;
  prepareRace: (round?: number) => void;
  startCountdown: () => void;
  pauseRace: () => void;
  resumeRace: () => void;
  tickRace: (deltaMs: number) => void;
  handleMistake: () => void;
  finishCurrentRound: () => void;
  advanceToNextRound: () => void;
  completeRace: () => void;
  resetToCarSelect: () => void;
}

function getPassageForRound(difficulty: Difficulty, roundNumber: number, seed?: number, excludeIds?: string[]): Passage {
  return passageEngine.getPassageForRound(difficulty, roundNumber, seed, excludeIds);
}

const defaultPassage = passageEngine.getRandomPassage('normal');

let engineUnsubscribers: (() => void)[] = [];

export const useRaceStore = create<RaceStoreState>((set, get) => ({
  status: 'idle',
  currentRound: 1,
  totalRounds: 3,
  roundResults: [],
  selectedCarId:
    (typeof window !== 'undefined' && window.location?.search
      ? new URLSearchParams(window.location.search).get('car')
      : null) || 'scrapper-rust',
  selectedTrackId: 'pacific-coast',
  customPaintColor: null,
  difficulty: 'normal',
  currentPassage: defaultPassage as any,
  raceDistance: defaultPassage.text.length * M,
  countdownValue: 3,
  raceTimeMs: 0,
  playerSim: createRacerSim('player', 'You', 'B', true),
  opponents: [],
  lastResult: null,
  newBests: [],
  pointsEarned: 0,

  selectCar: (carId: string) => set({ selectedCarId: carId }),
  selectTrack: (trackId: string) => set({ selectedTrackId: trackId }),
  setCustomPaintColor: (customPaintColor: string | null) => set({ customPaintColor }),
  selectDifficulty: (difficulty: Difficulty) => set({ difficulty }),

  prepareRace: (roundNumber: number = 1) => {
    const { difficulty, selectedCarId, selectedTrackId, roundResults } = get();
    const isNewMatch = roundNumber === 1;
    const excludeIds = isNewMatch ? [] : roundResults.map((r: any) => r.passageId).filter(Boolean);
    const passage = getPassageForRound(difficulty, roundNumber, undefined, excludeIds);
    const targetDistance = passage.text.length * M;

    // Initialize player typing state
    useTypingStore.getState().initPassage(passage);

    // Setup Player sim
    const playerSim = createRacerSim('player', 'You', 'B', true);

    // Pick 2 AI cars
    const availableCarIds = Object.keys(CAR_SPECS).filter((id) => id !== selectedCarId);
    const shuffledCars = [...availableCarIds].sort(() => 0.5 - Math.random());
    const rivalCarId = shuffledCars[0] || 'strada-r';
    const pacerCarId = shuffledCars[1] || 'volta-e';

    const profiles = AI_DIFFICULTY_PROFILES[difficulty];
    const seed = Date.now() + Math.floor(Math.random() * 100000);

    // Generate AI Rival
    const rivalAi = generateAiLog(
      seed,
      passage.text,
      profiles.rival.targetWpm,
      profiles.rival.errorRatePermille
    );
    const rivalSim = createRacerSim('ai-rival', profiles.rival.name, 'A', false);
    const rivalTyping = createTypingState(passage.text);

    // Generate AI Pacer
    const pacerAi = generateAiLog(
      seed + 1,
      passage.text,
      profiles.pacer.targetWpm,
      profiles.pacer.errorRatePermille
    );
    const pacerSim = createRacerSim('ai-pacer', profiles.pacer.name, 'C', false);
    const pacerTyping = createTypingState(passage.text);

    const opponents: OpponentState[] = [
      {
        racer: rivalSim,
        typing: rivalTyping,
        log: rivalAi.log,
        car: CAR_SPECS[rivalCarId],
        targetWpm: profiles.rival.targetWpm,
      },
      {
        racer: pacerSim,
        typing: pacerTyping,
        log: pacerAi.log,
        car: CAR_SPECS[pacerCarId],
        targetWpm: profiles.pacer.targetWpm,
      },
    ];

    // Load into decoupled GameEngine
    const entrants: RaceEntrant[] = [
      {
        racer: playerSim,
        typing: useTypingStore.getState().typingState,
        car: CAR_SPECS[selectedCarId],
        script: null,
        cursor: 0,
        laneOffset: 0, // Lane B
        targetWpm: 85,
        mistakeTwitchSign: 1,
      },
      {
        racer: rivalSim,
        typing: rivalTyping,
        car: CAR_SPECS[rivalCarId],
        script: rivalAi.log,
        cursor: 0,
        laneOffset: -3.6, // Lane A
        targetWpm: profiles.rival.targetWpm,
        mistakeTwitchSign: -1,
      },
      {
        racer: pacerSim,
        typing: pacerTyping,
        car: CAR_SPECS[pacerCarId],
        script: pacerAi.log,
        cursor: 0,
        laneOffset: 3.6, // Lane C
        targetWpm: profiles.pacer.targetWpm,
        mistakeTwitchSign: 1,
      },
    ];

    // Clean up previous engine event subscriptions
    engineUnsubscribers.forEach((unsub) => unsub());
    engineUnsubscribers = [];

    const settings = useSettingsStore.getState();
    gameEngine.loadRace(selectedTrackId, targetDistance, entrants, {
      screenShake: settings.screenShake,
      reducedMotion: settings.reducedMotion,
    });

    // Wire up engine event listeners to high-level store states
    const unsubCountdown = gameEngine.eventBus.on('countdown', ({ count }) => {
      set({ countdownValue: count });
      audioEngine.playCountdownBeep(false);
    });

    const unsubGo = gameEngine.eventBus.on('go', () => {
      set({ countdownValue: 0, status: 'racing', raceTimeMs: 0 });
      audioEngine.playCountdownBeep(true);
    });

    const unsubFinish = gameEngine.eventBus.on('playerFinish', () => {
      get().finishCurrentRound();
    });

    // Wire up imperative audio updates (RPM pitch & roar) on frame
    let lastAudioUpdate = 0;
    const unsubFrame = gameEngine.onFrame((engine) => {
      const now = performance.now();
      if (now - lastAudioUpdate > 30) {
        lastAudioUpdate = now;
        const playerView = engine.view.racers[0];
        if (playerView) {
          audioEngine.updateEngineRpm(playerView.speedKmh, playerView.accel > 0.3);
        }
      }
    });

    engineUnsubscribers.push(unsubCountdown, unsubGo, unsubFinish, unsubFrame);

    set({
      status: 'idle',
      currentRound: roundNumber,
      totalRounds: 3,
      roundResults: isNewMatch ? [] : get().roundResults,
      currentPassage: passage,
      raceDistance: targetDistance,
      countdownValue: 3,
      raceTimeMs: 0,
      playerSim,
      opponents,
      lastResult: isNewMatch ? null : get().lastResult,
      newBests: isNewMatch ? [] : get().newBests,
    });
  },

  startCountdown: () => {
    set({ status: 'countdown', countdownValue: 3 });
    audioEngine.init();
    audioEngine.startEngine();
    audioEngine.playCountdownBeep(false);

    gameEngine.startCountdown();
  },

  pauseRace: () => {
    if (get().status === 'racing') {
      gameEngine.pause();
      set({ status: 'paused' });
    }
  },

  resumeRace: () => {
    if (get().status === 'paused') {
      gameEngine.resume();
      set({ status: 'racing' });
    }
  },

  handleMistake: () => {
    gameEngine.handleMistake();
  },

  tickRace: (_deltaMs: number) => {
    // Engine now ticks independently via requestAnimationFrame in EngineDriver.
    // Backward compatibility hook:
    if (gameEngine.phase === 'racing' || gameEngine.phase === 'cooldown') {
      gameEngine.frame(performance.now());
    }
  },

  finishCurrentRound: () => {
    const { currentRound, totalRounds, playerSim, opponents, currentPassage, roundResults, raceDistance } = get();
    const typingState = useTypingStore.getState().typingState;
    const raceTimeMs = gameEngine.clock.raceTimeMs;

    // Fast-forward any unfinished AI using deterministic engine estimates
    opponents.forEach((opp, idx) => {
      const entrantIdx = idx + 1;
      const finishMs = gameEngine.sim.estimateFinishMs(entrantIdx, raceTimeMs, raceDistance);
      opp.racer.finishMs = finishMs;
    });

    const playerTimeMs = playerSim.finishMs ?? raceTimeMs;
    const playerTimeSec = Number((playerTimeMs / 1000).toFixed(2));

    // Determine standings
    const standings = [
      { name: 'You', finishMs: playerTimeMs, isPlayer: true },
      ...opponents.map((o) => ({
        name: o.racer.name,
        finishMs: o.racer.finishMs ?? 999999,
        isPlayer: false,
      })),
    ];
    standings.sort((a, b) => a.finishMs - b.finishMs);
    const playerRank = (standings.findIndex((s) => s.isPlayer) + 1) as 1 | 2 | 3;
    const isWin = playerRank === 1;

    const minutes = Math.max(0.01, playerTimeMs / 60000);
    const wpm = Number(((typingState.L / 5) / minutes).toFixed(1));
    const accuracy =
      typingState.totalKeystrokes > 0
        ? Math.min(100, Math.floor((typingState.correctKeystrokes / typingState.totalKeystrokes) * 100))
        : 100;

    const currentRoundResult: RoundResult = {
      roundNumber: currentRound,
      isWin,
      position: playerRank,
      timeSeconds: playerTimeSec,
      wpm,
      accuracy,
      mistakes: typingState.mistakes,
      passageText: currentPassage.text,
    };

    const updatedRounds = [...roundResults, currentRoundResult];

    if (currentRound < totalRounds) {
      // Round Complete, celebrate and show prompt to advance
      audioEngine.playStreakMilestone(10);
      set({
        status: 'round_complete',
        roundResults: updatedRounds,
      });
    } else {
      // All 3 rounds complete -> Complete Match
      set({ roundResults: updatedRounds });
      get().completeRace();
    }
  },

  advanceToNextRound: () => {
    const { currentRound, totalRounds } = get();
    if (currentRound >= totalRounds) {
      get().completeRace();
      return;
    }

    const nextRound = currentRound + 1;
    get().prepareRace(nextRound);
    get().startCountdown();
  },

  completeRace: () => {
    const { roundResults, selectedCarId, selectedTrackId, difficulty, opponents } = get();

    audioEngine.stopEngine();

    const totalWins = roundResults.filter((r) => r.isWin).length;
    const isMatchWin = totalWins >= 2 || (roundResults.length > 0 && roundResults[roundResults.length - 1].isWin);

    if (isMatchWin) {
      audioEngine.playVictoryFanfare();
    } else {
      audioEngine.playLossSound();
    }

    const totalTimeSec = Number(roundResults.reduce((acc, r) => acc + r.timeSeconds, 0).toFixed(2));
    const avgWpm =
      roundResults.length > 0
        ? Number((roundResults.reduce((acc, r) => acc + r.wpm, 0) / roundResults.length).toFixed(1))
        : 0;
    const bestWpm = roundResults.reduce((max, r) => Math.max(max, r.wpm), 0);
    const avgAccuracy =
      roundResults.length > 0
        ? Math.round(roundResults.reduce((acc, r) => acc + r.accuracy, 0) / roundResults.length)
        : 100;
    const totalMistakes = roundResults.reduce((acc, r) => acc + r.mistakes, 0);

    let bestRound = 1;
    let highestRoundWpm = 0;
    roundResults.forEach((r) => {
      if (r.wpm > highestRoundWpm) {
        highestRoundWpm = r.wpm;
        bestRound = r.roundNumber;
      }
    });

    const matchResult: FinalRaceResult = {
      isWin: isMatchWin,
      position: isMatchWin ? 1 : 2,
      timeSeconds: totalTimeSec,
      wpm: avgWpm,
      bestWpm,
      accuracy: avgAccuracy,
      mistakes: totalMistakes,
      bestRound,
      carId: selectedCarId,
      trackId: selectedTrackId,
      difficulty,
      counted: difficulty !== 'easy',
      rounds: roundResults,
      opponents: opponents.map((o, idx) => ({
        name: o.racer.name,
        position: idx + 2,
        timeSeconds: Number(((o.racer.finishMs ?? 20000) / 1000).toFixed(2)),
        wpm: o.targetWpm,
      })),
    };

    // Commit to SQLite via AuthStore career stats
    const { newBests, pointsEarned } = useAuthStore.getState().recordRaceResult({
      isWin: isMatchWin,
      timeSeconds: totalTimeSec,
      wpm: avgWpm,
      accuracy: avgAccuracy,
      mistakes: totalMistakes,
      carId: selectedCarId,
      difficulty,
      counted: difficulty !== 'easy',
    });

    matchResult.pointsEarned = pointsEarned;

    set({
      status: 'results',
      lastResult: matchResult,
      newBests,
      pointsEarned,
    });
  },

  resetToCarSelect: () => {
    audioEngine.stopEngine();
    set({ status: 'idle', lastResult: null, currentRound: 1, roundResults: [] });
  },
}));

setTypingMistakeListener(() => {
  useRaceStore.getState().handleMistake();
});
