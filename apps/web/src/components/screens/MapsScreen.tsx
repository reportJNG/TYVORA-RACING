// apps/web/src/components/screens/MapsScreen.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Sun,
  CloudRain,
  Mountain,
  Play,
  Check,
} from 'lucide-react';
import { TRACKS_LIST, TRACKS_DATA } from '../../data/tracks.js';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export const MapsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedTrackId, selectTrack, prepareRace } = useRaceStore();

  const currentTrack = TRACKS_DATA[selectedTrackId] || TRACKS_LIST[0];

  const handleSelectAndRace = (trackId: string) => {
    audioEngine.playUiClick();
    selectTrack(trackId);
    prepareRace(1);
    navigate('/race/playing');
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-56px)] flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none font-sans bg-[#070A12] overflow-x-hidden">
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_55%_at_50%_25%,rgba(255,75,38,0.08)_0%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* 1. TOP HEADER */}
      <header className="relative z-20 max-w-7xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => {
            audioEngine.playUiClick();
            navigate('/race');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 hover:bg-surface border border-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all text-xs font-mono backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO PADDOCK</span>
        </button>

        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-accent" />
          <h1 className="font-display font-black text-xl sm:text-2xl tracking-tight text-white uppercase">
            WORLD CIRCUITS
          </h1>
        </div>

        <div className="text-xs font-mono text-white/60 hidden sm:block">
          <span className="text-accent font-bold">{TRACKS_LIST.length}</span> TRACKS AVAILABLE
        </div>
      </header>

      {/* 2. MAIN GRID: 6 DETAILED CIRCUIT CARDS */}
      <main className="relative z-20 max-w-7xl w-full mx-auto my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TRACKS_LIST.map((track) => {
          const isSelected = track.id === selectedTrackId;

          return (
            <div
              key={track.id}
              onClick={() => {
                audioEngine.playUiClick();
                selectTrack(track.id);
              }}
              className={`group relative rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'bg-[#0E1527]/90 border-accent shadow-[0_0_30px_rgba(255,75,38,0.3)] ring-1 ring-accent'
                  : 'bg-[#0A0E18]/70 hover:bg-[#0E1422]/90 border-white/12 hover:border-white/25'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-white/60 uppercase">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>{track.location}</span>
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isSelected
                        ? 'bg-accent text-white'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {track.difficulty}
                  </span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight group-hover:text-accent transition-colors flex items-center gap-2">
                    <span>{track.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-accent stroke-[3]" />}
                  </h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                    {track.tagline}
                  </p>
                </div>

                {/* Circuit Specifications */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/8 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-white/40 block text-[10px]">TIME OF DAY</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      {track.timeOfDay}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">WEATHER</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-cyan-400" />
                      {track.weather}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">TERRAIN</span>
                    <span className="text-accent font-bold capitalize flex items-center gap-1">
                      <Mountain className="w-3 h-3 text-accent" />
                      {track.scenery.terrainType}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">ROAD WIDTH</span>
                    <span className="text-white font-bold">
                      {track.road.width}M ASPHALT
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2 border-t border-white/8">
                {isSelected ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAndRace(track.id);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,75,38,0.4)] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>RACE THIS CIRCUIT</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      audioEngine.playUiClick();
                      selectTrack(track.id);
                    }}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    SELECT MAP
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* 3. FOOTER */}
      <footer className="relative z-20 max-w-7xl w-full mx-auto pt-3 border-t border-white/8 flex items-center justify-between text-xs font-mono text-white/50">
        <span>CURRENT TRACK: <span className="text-accent font-bold">{currentTrack.name}</span></span>
        <button
          onClick={() => {
            audioEngine.playUiClick();
            navigate('/race');
          }}
          className="text-white/80 hover:text-white transition-colors"
        >
          GO TO RACE LOBBY →
        </button>
      </footer>
    </div>
  );
};
