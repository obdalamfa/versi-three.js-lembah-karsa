// ─── HARVEST MOON: A WONDERFUL LIFE 3D - HUD COMPONENT ───
import React from 'react';
import { AWLGameState, ToolType, CropId } from '../types/awlTypes';
import { CROPS } from '../data/awlData';
import {
  Sun,
  Cloud,
  CloudRain,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Book,
  Utensils,
  Backpack,
  Compass,
  Bell,
} from 'lucide-react';

interface AWLHUDProps {
  state: AWLGameState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectTool: (t: ToolType) => void;
  onSelectSeed: (c: CropId) => void;
  onPerformAction: () => void;
  onToggleHorseRide: () => void;
  onRingPastureBell: () => void;
  onRotateCamera: (dir: 'left' | 'right') => void;
  onOpenModal: (modal: 'bag' | 'animals' | 'cooking' | 'diary' | 'shipping') => void;
}

const TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: 'cangkul', label: 'Cangkul', icon: '⛏️' },
  { id: 'penyiram', label: 'Penyiram', icon: '💧' },
  { id: 'benih', label: 'Benih', icon: '🌱' },
  { id: 'pemerah', label: 'Pemerah', icon: '🥛' },
  { id: 'sikat', label: 'Sikat', icon: '🪮' },
  { id: 'gunting', label: 'Gunting', icon: '✂️' },
  { id: 'sabit', label: 'Sabit', icon: '🌾' },
  { id: 'pancingan', label: 'Pancing', icon: '🎣' },
  { id: 'sekop', label: 'Sekop', icon: '🪓' },
];

export const AWLHUD: React.FC<AWLHUDProps> = ({
  state,
  soundEnabled,
  onToggleSound,
  onSelectTool,
  onSelectSeed,
  onPerformAction,
  onToggleHorseRide,
  onRingPastureBell,
  onRotateCamera,
  onOpenModal,
}) => {
  const { time, stats, player } = state;
  const isMorning = time.hour < 12;
  const displayHour = time.hour % 12 === 0 ? 12 : time.hour % 12;
  const ampm = time.hour >= 12 ? 'PM' : 'AM';
  const timeStr = `${String(displayHour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')} ${ampm}`;

  const seasonNames: Record<string, { label: string; color: string; icon: string }> = {
    spring: { label: 'Musim Semi', color: 'text-rose-400', icon: '🌸' },
    summer: { label: 'Musim Panas', color: 'text-amber-400', icon: '☀️' },
    autumn: { label: 'Musim Gugur', color: 'text-orange-400', icon: '🍂' },
    winter: { label: 'Musim Dingin', color: 'text-cyan-300', icon: '❄️' },
  };

  const curSeason = seasonNames[time.season];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* ─── TOP LEFT: VINTAGE WOODEN CLOCK & WEATHER DIAL ─── */}
      <div className="absolute top-4 left-4 pointer-events-auto flex items-start gap-3">
        <div className="bg-stone-900/90 border-2 border-amber-700/70 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-3.5 min-w-[240px]">
          {/* Rotating Sun/Moon Dial */}
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-600/50 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <span className="text-xl">
              {time.hour >= 6 && time.hour < 18 ? '☀️' : '🌙'}
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-300 uppercase tracking-tighter">
              {ampm}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold uppercase tracking-wide flex items-center gap-1 ${curSeason.color}`}>
                <span>{curSeason.icon}</span> {curSeason.label}
              </span>
              <span className="text-stone-400 text-xs font-mono font-bold">
                Hari {time.day}/10
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-mono font-black text-amber-100 tracking-tight">
                {timeStr}
              </span>
              <div className="flex items-center gap-1 text-xs text-stone-300">
                {time.weather === 'sunny' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                {time.weather === 'cloudy' && <Cloud className="w-3.5 h-3.5 text-stone-400" />}
                {time.weather === 'rainy' && <CloudRain className="w-3.5 h-3.5 text-sky-400" />}
                <span className="capitalize text-[11px] text-stone-400">{time.weather}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Controls & Audio Toggle */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-stone-900/90 border border-amber-800/60 text-amber-200 hover:bg-amber-950 hover:text-amber-100 transition shadow-lg"
            title="Nyalakan / Matikan Musik"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onRotateCamera('left')}
              className="p-2 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-300 hover:bg-stone-800 transition"
              title="Putar Kamera Kiri (Q)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRotateCamera('right')}
              className="p-2 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-300 hover:bg-stone-800 transition"
              title="Putar Kamera Kanan (E)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── TOP RIGHT: GOLD & STAMINA METERS ─── */}
      <div className="absolute top-4 right-4 pointer-events-auto flex flex-col items-end gap-2.5">
        {/* Gold Badge */}
        <div className="bg-stone-900/90 border-2 border-amber-600/70 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2.5">
          <span className="text-xl">🪙</span>
          <div className="text-right">
            <span className="text-[10px] text-stone-400 block font-bold tracking-wider uppercase">Tabungan Emas</span>
            <span className="text-lg font-mono font-black text-amber-300 leading-none">
              {stats.gold.toLocaleString('id-ID')} G
            </span>
          </div>
        </div>

        {/* Stamina & Fullness Bars */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 shadow-xl backdrop-blur-md w-52 flex flex-col gap-2">
          {/* Stamina */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-stone-300 mb-1">
              <span className="flex items-center gap-1">⚡ Energi</span>
              <span className="font-mono">{stats.stamina}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  stats.stamina > 40 ? 'bg-emerald-500' : stats.stamina > 15 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${stats.stamina}%` }}
              />
            </div>
          </div>

          {/* Fullness */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-stone-300 mb-1">
              <span className="flex items-center gap-1">🍎 Kenyang</span>
              <span className="font-mono">{stats.fullness}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-300"
                style={{ width: `${stats.fullness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM CENTER: AWL TOOLBELT & ACTIONS ─── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2">
        {/* Seed Selector Bar if Seed Tool selected */}
        {player.activeTool === 'benih' && (
          <div className="bg-stone-900/95 border-2 border-emerald-600/70 rounded-2xl px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <span>🌱</span> Pilih Benih:
            </span>
            <div className="flex gap-1.5">
              {(Object.keys(CROPS) as CropId[]).map((cId) => {
                const c = CROPS[cId];
                const active = player.activeSeed === cId;
                return (
                  <button
                    key={cId}
                    onClick={() => onSelectSeed(cId)}
                    className={`px-2 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      active
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <span>{c.fruitColor ? '🌱' : '🌾'}</span> {c.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Hotbar */}
        <div className="bg-stone-950/95 border-2 border-amber-800/80 rounded-3xl p-2 shadow-2xl backdrop-blur-xl flex items-center gap-1.5">
          {TOOLS.map((t, idx) => {
            const isSelected = player.activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                className={`relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-lg scale-105 border-2 border-amber-300'
                    : 'bg-stone-900/90 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
                title={`${t.label} (Tekan ${idx + 1})`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="text-[9px] font-bold font-mono tracking-tighter opacity-80">
                  {idx + 1}
                </span>
              </button>
            );
          })}

          <div className="w-[1px] h-8 bg-stone-800 mx-1" />

          {/* Quick Action Button */}
          <button
            onClick={onPerformAction}
            className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition"
            title="Aksi Utama (Spasi)"
          >
            <span>✨</span> Lakukan Aksi
          </button>
        </div>

        {/* Pasture & Horse shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHorseRide}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
              stats.isRidingHorse
                ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
                : 'bg-stone-900/90 border-stone-800 text-amber-200 hover:bg-stone-800'
            }`}
          >
            <span>🐎</span> {stats.isRidingHorse ? 'Turun Kuda' : 'Tunggangi Spirit (Kuda)'}
          </button>

          <button
            onClick={onRingPastureBell}
            className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-amber-800 text-amber-300 hover:bg-amber-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Bell className="w-3.5 h-3.5" /> Lonceng Padang Rumput
          </button>
        </div>
      </div>

      {/* ─── BOTTOM RIGHT: MENU SHORTCUTS (Bag, Barn, Kitchen, Diary) ─── */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => onOpenModal('bag')}
          className="p-3 rounded-2xl bg-stone-900/95 border-2 border-stone-800 hover:border-amber-500 text-stone-200 hover:text-amber-300 transition shadow-2xl flex flex-col items-center group"
          title="Tas & Inventori (I)"
        >
          <Backpack className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-400" />
          <span className="text-[10px] font-bold mt-1">Tas</span>
        </button>

        <button
          onClick={() => onOpenModal('animals')}
          className="p-3 rounded-2xl bg-stone-900/95 border-2 border-stone-800 hover:border-amber-500 text-stone-200 hover:text-amber-300 transition shadow-2xl flex flex-col items-center group"
          title="Kandang & Ternak"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🐄</span>
          <span className="text-[10px] font-bold mt-1">Ternak</span>
        </button>

        <button
          onClick={() => onOpenModal('cooking')}
          className="p-3 rounded-2xl bg-stone-900/95 border-2 border-stone-800 hover:border-amber-500 text-stone-200 hover:text-amber-300 transition shadow-2xl flex flex-col items-center group"
          title="Dapur & Masak"
        >
          <Utensils className="w-5 h-5 group-hover:scale-110 transition-transform text-orange-400" />
          <span className="text-[10px] font-bold mt-1">Dapur</span>
        </button>

        <button
          onClick={() => onOpenModal('shipping')}
          className="p-3 rounded-2xl bg-stone-900/95 border-2 border-stone-800 hover:border-amber-500 text-stone-200 hover:text-amber-300 transition shadow-2xl flex flex-col items-center group"
          title="Buku Catatan Takakura"
        >
          <Compass className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-400" />
          <span className="text-[10px] font-bold mt-1">Pengiriman</span>
        </button>

        <button
          onClick={() => onOpenModal('diary')}
          className="p-3 rounded-2xl bg-stone-900/95 border-2 border-amber-600 hover:border-amber-400 text-amber-200 hover:text-amber-100 transition shadow-2xl flex flex-col items-center group bg-amber-950/40"
          title="Buku Harian & Gramofon"
        >
          <Book className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-300" />
          <span className="text-[10px] font-bold mt-1">Buku Harian</span>
        </button>
      </div>
    </div>
  );
};
