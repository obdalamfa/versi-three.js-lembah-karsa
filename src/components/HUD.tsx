// In-Game HUD: Status Bar, Hotbar, Quick Touch Controls, Mini Radar
import React from 'react';
import { GameState, ToolType } from '../types/game';
import { calculateMood } from '../systems/motives';
import {
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Volume2,
  VolumeX,
  MapPin,
  Heart,
  Zap,
  Coins,
  Smile,
  Frown,
  Meh,
  Menu as MenuIcon,
  Compass,
  Briefcase,
  Crosshair,
  Calendar,
} from 'lucide-react';
import { sound } from '../systems/sound';

interface HUDProps {
  state: GameState;
  activeTool: ToolType;
  onSelectTool: (t: ToolType) => void;
  onOpenTab: (tab: 'tas' | 'kalender' | 'peta' | 'ternak' | 'motif' | 'misi' | 'warga' | 'pengaturan') => void;
  onActionClick: () => void;
  onAttackClick: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  locationName: string;
}

const TOOLS_CONFIG: { id: ToolType; label: string; icon: string }[] = [
  { id: 'tangan', label: 'Tangan', icon: '✋' },
  { id: 'cangkul', label: 'Cangkul', icon: '⛏️' },
  { id: 'siram', label: 'Penyiram', icon: '💧' },
  { id: 'tanam', label: 'Tanam', icon: '🌱' },
  { id: 'sabit', label: 'Sabit Panen', icon: '🌾' },
  { id: 'beliung', label: 'Beliung', icon: '🔨' },
  { id: 'pedang', label: 'Pedang', icon: '⚔️' },
  { id: 'pancing', label: 'Pancing', icon: '🎣' },
];

export const HUD: React.FC<HUDProps> = ({
  state,
  activeTool,
  onSelectTool,
  onOpenTab,
  onActionClick,
  onAttackClick,
  onToggleSound,
  soundEnabled,
  locationName,
}) => {
  const { player, time, motives } = state;
  const moodScore = calculateMood(motives);

  const getWeatherIcon = () => {
    switch (time.weather) {
      case 'Hujan': return <CloudRain className="w-4 h-4 text-sky-400" />;
      case 'Badai': return <CloudLightning className="w-4 h-4 text-purple-400" />;
      case 'Bersalju': return <Snowflake className="w-4 h-4 text-cyan-200" />;
      default: return <Sun className="w-4 h-4 text-amber-400" />;
    }
  };

  const getMoodIcon = () => {
    if (moodScore > 30) return <Smile className="w-5 h-5 text-emerald-400" />;
    if (moodScore > -20) return <Meh className="w-5 h-5 text-amber-400" />;
    return <Frown className="w-5 h-5 text-rose-400" />;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-2 pointer-events-auto">
        {/* Left: Player Vital Stats */}
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-2xl p-3 shadow-xl flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-2xl shadow-inner">
            🧑
          </div>

          <div className="flex flex-col gap-1 min-w-[140px] sm:min-w-[170px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-100 tracking-wide">{player.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Lv. {player.level}
              </span>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
              <div className="flex-1 h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 font-mono w-9 text-right">
                {player.hp}/{player.maxHp}
              </span>
            </div>

            {/* Energy Bar */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
              <div className="flex-1 h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (player.energy / player.maxEnergy) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 font-mono w-9 text-right">
                {player.energy}/{player.maxEnergy}
              </span>
            </div>
          </div>

          {/* Motive Mood Button */}
          <button
            onClick={() => { sound.playClick(); onOpenTab('motif'); }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 transition active:scale-95 ml-1"
            title="Klik untuk cek 8 Motif Sims"
          >
            {getMoodIcon()}
            <span className="text-[10px] text-stone-300 font-medium mt-0.5">Motif</span>
          </button>
        </div>

        {/* Center: Location Pill */}
        <div className="hidden md:flex items-center gap-2 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 px-4 py-2 rounded-full shadow-lg">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-amber-200">{locationName}</span>
        </div>

        {/* Right: Clock, Weather, Gold & Menu Shortcuts */}
        <div className="flex items-center gap-2">
          {/* Gold Pill */}
          <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-amber-300 font-mono text-sm tracking-wide">
              {player.gold.toLocaleString('id-ID')} G
            </span>
          </div>

          {/* Clock & Season (Clickable to open Kalender) */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTab('kalender');
            }}
            className="bg-stone-900/90 hover:bg-stone-850 hover:border-amber-500/60 backdrop-blur-md border border-stone-700/80 rounded-2xl px-3 py-2 flex items-center gap-2.5 shadow-lg transition active:scale-95 text-left cursor-pointer group"
            title="Klik untuk membuka Kalender & Acara Musim"
          >
            <div className="group-hover:scale-110 transition-transform">
              {getWeatherIcon()}
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-semibold text-amber-300 group-hover:text-amber-200">
                Thn {time.year}, {time.season} {time.day}
              </span>
              <span className="font-mono text-xs font-bold text-stone-200">
                {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-10 h-10 rounded-2xl bg-stone-900/90 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 transition active:scale-95 shadow-lg"
            title="Suara"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* PS2 Graphic Mode Badge */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTab('pengaturan');
            }}
            className={`h-10 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-bold tracking-wide shadow-lg transition active:scale-95 border ${
              state.ps2Settings?.enabled !== false
                ? 'bg-sky-950/90 border-sky-400/80 text-sky-200 shadow-sky-500/20'
                : 'bg-stone-900/90 border-stone-700 text-stone-400'
            }`}
            title="Pengaturan Mode Grafis PS2"
          >
            <span className="text-[10px] px-1 py-0.5 rounded bg-sky-500/30 text-sky-300 font-mono font-bold">PS2</span>
            <span className="hidden sm:inline font-mono text-[11px]">{state.ps2Settings?.enabled !== false ? 'GS ON' : 'OFF'}</span>
          </button>

          {/* Menu Trigger with PS2 Triangle Badge */}
          <button
            onClick={() => { sound.playClick(); onOpenTab('tas'); }}
            className="h-10 px-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1.5 transition active:scale-95 shadow-lg"
          >
            {state.ps2Settings?.dualShockPrompts !== false && (
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-emerald-100 text-[10px] font-black flex items-center justify-center shadow-sm">
                △
              </span>
            )}
            <MenuIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Menu</span>
          </button>
        </div>
      </div>

      {/* Bottom Area: Tool Hotbar + Action Buttons */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        {/* Navigation Quick Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-900/80 backdrop-blur-md p-1 rounded-full border border-stone-700/60 shadow-lg">
          <button
            onClick={() => { sound.playClick(); onOpenTab('tas'); }}
            className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Tas
          </button>
          <button
            onClick={() => { sound.playClick(); onOpenTab('kalender'); }}
            className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition"
            title="Kalender & Acara Musim"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Kalender
          </button>
          <button
            onClick={() => { sound.playClick(); onOpenTab('peta'); }}
            className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Peta
          </button>
          <button
            onClick={() => { sound.playClick(); onOpenTab('ternak'); }}
            className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition"
          >
            🐄 Ternak
          </button>
          <button
            onClick={() => { sound.playClick(); onOpenTab('misi'); }}
            className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition"
          >
            📜 Misi
          </button>
          <button
            onClick={() => { sound.playClick(); onOpenTab('warga'); }}
            className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition"
          >
            👥 Warga
          </button>
        </div>

        {/* Hotbar & Interactive Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* L1 Trigger Prompt */}
          {state.ps2Settings?.dualShockPrompts !== false && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-stone-800 border border-stone-600 text-[10px] font-mono font-bold text-stone-400">
              L1
            </span>
          )}

          {/* Tool Selection Hotbar */}
          <div className="flex items-center gap-1 bg-stone-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-700/80 shadow-2xl overflow-x-auto max-w-[85vw] sm:max-w-[90vw]">
            {TOOLS_CONFIG.map((t, idx) => {
              const isActive = activeTool === t.id;
              const tier = player.toolTiers[t.id] || 'Kayu';

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    sound.playClick();
                    onSelectTool(t.id);
                  }}
                  className={`relative flex flex-col items-center justify-center w-11 h-12 sm:w-12 sm:h-13 rounded-xl transition-all ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold scale-105 shadow-md shadow-amber-500/20'
                      : 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-200'
                  }`}
                  title={`${t.label} (${tier})`}
                >
                  <span className="text-lg sm:text-xl">{t.icon}</span>
                  <span className={`text-[8px] sm:text-[9px] font-medium leading-none mt-0.5 ${isActive ? 'text-stone-950 font-bold' : 'text-stone-400'}`}>
                    {t.label}
                  </span>
                  <span className="absolute top-0.5 right-1 text-[8px] opacity-70 font-mono">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* R1 Trigger Prompt */}
          {state.ps2Settings?.dualShockPrompts !== false && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-stone-800 border border-stone-600 text-[10px] font-mono font-bold text-stone-400">
              R1
            </span>
          )}

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onActionClick();
              }}
              className="relative w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white font-bold flex flex-col items-center justify-center shadow-xl shadow-emerald-900/40 hover:brightness-110 active:scale-95 transition"
              title="Gunakan Perkakas / Interaksi (✕ / Spasi)"
            >
              {state.ps2Settings?.dualShockPrompts !== false && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 border border-blue-300 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                  ✕
                </span>
              )}
              <Crosshair className="w-5 h-5" />
              <span className="text-[10px]">Aksi</span>
            </button>

            <button
              onClick={() => {
                sound.playSwordSwing();
                onAttackClick();
              }}
              className="relative w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-700 to-rose-500 text-white font-bold flex flex-col items-center justify-center shadow-xl shadow-rose-900/40 hover:brightness-110 active:scale-95 transition"
              title="Serang Monster / Tebas Pedang (▢ / Z)"
            >
              {state.ps2Settings?.dualShockPrompts !== false && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md bg-pink-600 border border-pink-300 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                  ▢
                </span>
              )}
              <span className="text-xl">⚔️</span>
              <span className="text-[10px]">Serang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
