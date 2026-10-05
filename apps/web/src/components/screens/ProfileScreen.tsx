// apps/web/src/components/screens/ProfileScreen.tsx
import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Zap,
  CheckCircle2,
  Lock,
  FileCode,
  Database,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { Avatar } from '../common/Avatar.js';
import { Button } from '../common/Button.js';
import { Modal } from '../common/Modal.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    stats,
    unlockedCars,
    downloadDatabaseFile,
    importDatabaseFile,
    downloadJsonBackup,
    importJsonBackup,
    resetDatabase,
  } = useAuthStore();

  const [notification, setNotification] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const sqliteInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const favoriteCar = CARS_DATA[stats.favoriteCarId] || CARS_DATA['scrapper-rust'];

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // SQLite File Upload Handler
  const handleSqliteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await importDatabaseFile(bytes);
      audioEngine.playUiClick();
      showNotification('SQLite Database restored successfully!');
    } catch (err: any) {
      console.error('[Profile] Failed to import SQLite:', err);
      showNotification('Error restoring SQLite database file.');
    } finally {
      if (sqliteInputRef.current) sqliteInputRef.current.value = '';
    }
  };

  // JSON File Upload Handler
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importJsonBackup(text);
      audioEngine.playUiClick();
      showNotification('JSON Backup restored successfully!');
    } catch (err: any) {
      console.error('[Profile] Failed to import JSON:', err);
      showNotification('Error parsing JSON backup file.');
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    await resetDatabase();
    setIsResetModalOpen(false);
    audioEngine.playUiClick();
    showNotification('Local database reset to factory defaults.');
  };

  // Determine Driver Tier
  const pts = currentUser.points || 0;
  let driverTier = 'Scrap Pilot';
  let tierColor = 'text-text-muted';
  if (pts >= 3500) {
    driverTier = 'Apex Legend';
    tierColor = 'text-accent';
  } else if (pts >= 1800) {
    driverTier = 'Circuit Champion';
    tierColor = 'text-yellow-400';
  } else if (pts >= 800) {
    driverTier = 'Pro Racer';
    tierColor = 'text-blue-400';
  } else if (pts >= 250) {
    driverTier = 'Street Tuner';
    tierColor = 'text-emerald-400';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans select-none">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 p-3 rounded-xl bg-surface-2 border border-accent text-accent text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. DRIVER DOSSIER HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 p-6 rounded-2xl glass-panel border border-border shadow-xl">
        <Avatar seed={currentUser.username} size="xl" />
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
                  {currentUser.username}
                </h1>
                <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 border border-border ${tierColor}`}>
                  {driverTier}
                </span>
              </div>
              <span className="text-xs text-text-muted mt-1 block">
                Pilot since {currentUser.memberSince} · {currentUser.email} · {favoriteCar.name}
              </span>
            </div>

            <div className="flex items-center gap-2 self-center sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent-subtle px-3 py-1.5 rounded-full border border-accent/30 shadow-sm">
                <Zap className="w-4 h-4 fill-accent" />
                <span>{currentUser.points} PTS</span>
              </div>
            </div>
          </div>

          {/* FOUR CORE METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface-2/80 border border-border text-center mt-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">VICTORIES</span>
              <span className="text-xl md:text-2xl font-bold text-accent tabular-nums">
                {stats.wins}
              </span>
            </div>
            <div className="border-l border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">WIN RATE</span>
              <span className="text-xl md:text-2xl font-bold text-text tabular-nums">
                {stats.winRate}%
              </span>
            </div>
            <div className="border-l border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">BEST SPEED</span>
              <span className="text-xl md:text-2xl font-bold text-text tabular-nums">
                {stats.bestWpm > 0 ? `${stats.bestWpm} WPM` : '—'}
              </span>
            </div>
            <div className="border-l border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">ACCURACY</span>
              <span className="text-xl md:text-2xl font-bold text-text tabular-nums">
                {stats.bestAccuracy > 0 ? `${stats.bestAccuracy}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FLEET & GARAGE UNLOCK PROGRESSION */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-6 p-6 rounded-2xl glass-panel border border-border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-text">
              Fleet Progression
            </h2>
            <span className="text-xs text-text-muted">
              {unlockedCars.length} of 8 Vehicles Unlocked
            </span>
          </div>
          <span className="text-xs font-mono text-accent bg-accent-subtle px-3 py-1 rounded-full border border-accent/20">
            {currentUser.points} PTS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CARS_LIST.map((car) => {
            const isUnlocked = unlockedCars.includes(car.id);
            const req = car.unlockPoints;
            const pct = req > 0 ? Math.min(100, Math.round((pts / req) * 100)) : 100;

            return (
              <div
                key={car.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? 'bg-surface-2/80 border-accent/40 shadow-sm'
                    : 'bg-surface-2/30 border-border opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    {req === 0 ? (
                      <span className="text-accent font-semibold">Free Starter</span>
                    ) : (
                      <span className="text-text-muted">{req} PTS</span>
                    )}

                    {isUnlocked ? (
                      <span className="text-success flex items-center gap-1 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-text-faint flex items-center gap-1 text-[11px]">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  {car.spriteUrl && (
                    <div className="w-full h-14 flex items-center justify-center my-1">
                      <img
                        src={car.spriteUrl}
                        alt={car.name}
                        className="max-h-12 max-w-full object-contain drop-shadow"
                      />
                    </div>
                  )}

                  <h3 className="text-xs font-semibold text-text truncate">
                    {car.name}
                  </h3>
                  <div className="text-[10px] text-text-faint">{car.category}</div>
                </div>

                {!isUnlocked && (
                  <div className="mt-2.5">
                    <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border">
                      <div
                        className="bg-accent h-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-text-faint mt-1 flex justify-between">
                      <span>{pct}%</span>
                      <span>Need {Math.max(0, req - pts)} pts</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. CLEAN DATA MANAGEMENT & BACKUP HUB */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-6 p-6 rounded-2xl glass-panel border border-border shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-base font-bold text-text">
                Database & Backups
              </h2>
              <p className="text-xs text-text-muted">
                Export or restore your local SQLite database and profile.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-accent px-2.5 py-0.5 rounded-full bg-accent-subtle border border-accent/20">
            Local SQLite
          </span>
        </div>

        {/* HIDDEN FILE INPUTS */}
        <input
          ref={sqliteInputRef}
          type="file"
          accept=".sqlite,.db"
          className="hidden"
          onChange={handleSqliteUpload}
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleJsonUpload}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 1. Download SQLite DB */}
          <div className="p-4 rounded-xl bg-surface-2/60 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text mb-1">
                <Database className="w-4 h-4 text-accent" />
                <span>Export SQLite (.sqlite)</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Save the complete binary SQLite database file to your computer.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={downloadDatabaseFile}
              className="mt-3 w-full"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Download DB</span>
            </Button>
          </div>

          {/* 2. Upload SQLite DB */}
          <div className="p-4 rounded-xl bg-surface-2/60 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text mb-1">
                <Upload className="w-4 h-4 text-accent" />
                <span>Restore SQLite (.sqlite)</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Load a previously saved SQLite file to restore all progress.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => sqliteInputRef.current?.click()}
              className="mt-3 w-full"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              <span>Upload DB File</span>
            </Button>
          </div>

          {/* 3. Export JSON */}
          <div className="p-4 rounded-xl bg-surface-2/60 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text mb-1">
                <FileCode className="w-4 h-4 text-accent" />
                <span>Export JSON Backup</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Human-readable JSON backup of your records and career stats.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadJsonBackup}
              className="mt-3 w-full"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Save JSON</span>
            </Button>
          </div>

          {/* 4. Restore JSON */}
          <div className="p-4 rounded-xl bg-surface-2/60 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text mb-1">
                <FileCode className="w-4 h-4 text-accent" />
                <span>Restore JSON Backup</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Import from a JSON file backup.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => jsonInputRef.current?.click()}
              className="mt-3 w-full"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              <span>Upload JSON</span>
            </Button>
          </div>
        </div>

        {/* Reset Database Button */}
        <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-text-faint">
            Reset clears local browser storage and re-seeds default drivers.
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 text-xs w-full sm:w-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset Local Data</span>
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. RECENT RACES TELEMETRY */}
      {/* ------------------------------------------------------------- */}
      <section className="glass-panel border border-border rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-border text-xs font-semibold text-text flex items-center justify-between">
          <span>Recent Activity</span>
          <span className="text-[11px] text-text-muted font-normal">Last 20 Runs</span>
        </div>

        {stats.history.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-xs">
            No race records logged yet. Enter your first race to record telemetry and earn points.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] text-text-muted bg-surface-2/40">
                  <th className="py-2.5 px-4 font-medium">Result</th>
                  <th className="py-2.5 px-4 font-medium">Points</th>
                  <th className="py-2.5 px-4 font-medium">Speed</th>
                  <th className="py-2.5 px-4 font-medium">Accuracy</th>
                  <th className="py-2.5 px-4 font-medium">Time</th>
                  <th className="py-2.5 px-4 font-medium">Machine</th>
                  <th className="py-2.5 px-4 font-medium">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.history.map((h) => {
                  const car = CARS_DATA[h.carId] || CARS_DATA['scrapper-rust'];
                  return (
                    <tr key={h.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold">
                        <span className={h.isWin ? 'text-accent' : 'text-danger'}>
                          {h.isWin ? 'VICTORY' : 'DEFEAT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-accent tabular-nums">
                        +{h.pointsEarned || 0} PTS
                      </td>
                      <td className="py-2.5 px-4 tabular-nums">{h.wpm} WPM</td>
                      <td className="py-2.5 px-4 tabular-nums">{h.accuracy}%</td>
                      <td className="py-2.5 px-4 tabular-nums">{h.timeSeconds.toFixed(2)}s</td>
                      <td className="py-2.5 px-4 uppercase">{car.name}</td>
                      <td className="py-2.5 px-4 uppercase text-[10px] text-text-muted">
                        {h.difficulty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CONFIRM RESET MODAL */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Local Data"
        maxWidth="sm"
      >
        <div className="text-center py-2 select-none">
          <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-3" />
          <p className="text-xs text-text-muted mb-5 leading-relaxed font-sans">
            This will wipe your local SQLite database stored in your browser, resetting all career statistics, points, and unlocked cars back to factory defaults.
          </p>

          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsResetModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={handleReset}
              fullWidth
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
