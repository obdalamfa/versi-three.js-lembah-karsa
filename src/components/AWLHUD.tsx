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
  Sparkles,
} from 'lucide-react';

interface AWLHUDProps {
  state: AWLGameState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectTool: (t: ToolType) => void;
  onSelectSeed: (c: CropId) => void;
  onPerformAction: () => void;
  onWhistle: () => void;
  onToggleHorseRide: () => void;
  onRingPastureBell: () => void;
  onRotateCamera: (dir: 'left' | 'right') => void;
  onPutAwayHeldItem: () => void;
  onEatHeldItem: () => void;
  onShipHeldItem: () => void;
  onOpenModal: (modal: 'bag' | 'animals' | 'cooking' | 'diary' | 'shipping' | 'tartan' | 'sprites') => void;
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
  onWhistle,
  onToggleHorseRide,
  onRingPastureBell,
  onRotateCamera,
  onPutAwayHeldItem,
  onEatHeldItem,
  onShipHeldItem,
  onOpenModal,
}) => {
  const { time, stats, player } = state;
  const displayHour = time.hour % 12 === 0 ? 12 : time.hour % 12;
  const ampm = time.hour >= 12 ? 'PM' : 'AM';
  const timeStr = `${String(displayHour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')} ${ampm}`;

  const seasonNames: Record<string, { label: string; color: string; icon: string }> = {
    spring: { label: 'Spring', color: 'text-rose-400', icon: '🌸' },
    summer: { label: 'Summer', color: 'text-amber-400', icon: '☀️' },
    autumn: { label: 'Fall', color: 'text-orange-400', icon: '🍂' },
    winter: { label: 'Winter', color: 'text-cyan-300', icon: '❄️' },
  };

  const curSeason = seasonNames[time.season];

  // Authentic AWL Stamina Face Icon & Status
  const getStaminaFace = () => {
    if (stats.stamina > 70) {
      return { emoji: '😄', label: 'Penuh Semangat', ring: 'border-emerald-500 bg-emerald-950/80', pulse: false };
    }
    if (stats.stamina > 40) {
      return { emoji: '🙂', label: 'Bugar & Sehat', ring: 'border-amber-500 bg-amber-950/80', pulse: false };
    }
    if (stats.stamina > 18) {
      return { emoji: '😓', label: 'Mulai Lelah', ring: 'border-orange-500 bg-orange-950/80', pulse: false };
    }
    return { emoji: '😫', label: 'Sangat Lemas!', ring: 'border-rose-500 bg-rose-950/90 animate-pulse', pulse: true };
  };

  const staminaInfo = getStaminaFace();

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* ─── TOP LEFT: AUTHENTIC AWL ANALOG CLOCK & WEATHER DIAL ─── */}
      <div className="absolute top-4 left-4 pointer-events-auto flex items-start gap-3">
        <div className="bg-stone-900/95 border-2 border-amber-700/80 rounded-3xl p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-3.5 min-w-[250px]">
          {/* Rotating Sun/Moon Dial */}
          <div className="w-14 h-14 rounded-2xl bg-amber-950 border-2 border-amber-600/70 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <span className="text-2xl drop-shadow">
              {time.hour >= 6 && time.hour < 18 ? '☀️' : '🌙'}
            </span>
            <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-tight">
              {ampm}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${curSeason.color}`}>
                <span>{curSeason.icon}</span> {curSeason.label}
              </span>
              <span className="text-amber-100 text-xs font-mono font-black">
                Day {time.day}/10
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-mono font-black text-stone-100 tracking-tight">
                {timeStr}
              </span>
              <div className="flex items-center gap-1 text-xs text-stone-300">
                {time.weather === 'sunny' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                {time.weather === 'cloudy' && <Cloud className="w-3.5 h-3.5 text-stone-400" />}
                {time.weather === 'rainy' && <CloudRain className="w-3.5 h-3.5 text-sky-400" />}
                <span className="capitalize text-[11px] text-stone-400 font-bold">{time.weather}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio & Camera Controls */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-2xl bg-stone-900/90 border border-amber-800 text-amber-200 hover:bg-amber-950 transition shadow-lg"
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

      {/* ─── TOP CENTER: HELD ITEM BANNER (Above Head!) ─── */}
      {player.heldItem && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 bg-stone-950/95 border-2 border-amber-500 rounded-3xl px-4 py-2 shadow-2xl backdrop-blur-md animate-slideDown">
          <span className="text-2xl animate-bounce">{player.heldItem.icon}</span>
          <div>
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
              Mengangkat di Atas Kepala
            </div>
            <div className="text-xs font-black text-stone-100">{player.heldItem.name}</div>
          </div>

          <div className="w-[1px] h-6 bg-stone-800 mx-1" />

          <button
            onClick={onPutAwayHeldItem}
            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition"
            title="Kembalikan ke tas"
          >
            Simpan (Tas)
          </button>

          {['produce', 'cooked'].includes(player.heldItem.category) && (
            <button
              onClick={onEatHeldItem}
              className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-black transition"
            >
              Makan
            </button>
          )}

          {player.heldItem.sellPrice > 0 && (
            <button
              onClick={onShipHeldItem}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black transition"
            >
              Kirim
            </button>
          )}
        </div>
      )}

      {/* ─── TOP RIGHT: AWL FARMER FACE METER & GOLD ─── */}
      <div className="absolute top-4 right-4 pointer-events-auto flex items-start gap-3">
        {/* Stamina Face (GameCube AWL Style!) */}
        <div className="bg-stone-900/95 border-2 border-stone-800 rounded-3xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-inner ${staminaInfo.ring}`}
            title={`Energi: ${stats.stamina}% (${staminaInfo.label})`}
          >
            {staminaInfo.emoji}
          </div>

          <div className="flex flex-col gap-1 w-28">
            <div className="flex justify-between items-baseline text-[10px] font-bold">
              <span className="text-stone-400 uppercase">Stamina</span>
              <span className="font-mono text-amber-300 font-bold">{stats.stamina}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  stats.stamina > 40 ? 'bg-emerald-500' : stats.stamina > 18 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${stats.stamina}%` }}
              />
            </div>

            <div className="flex justify-between items-baseline text-[10px] font-bold mt-0.5">
              <span className="text-stone-400 uppercase">Kenyang</span>
              <span className="font-mono text-orange-400 font-bold">{stats.fullness}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-300"
                style={{ width: `${stats.fullness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Gold Counter */}
        <div className="bg-stone-900/95 border-2 border-amber-600/70 rounded-3xl px-4 py-3 shadow-2xl backdrop-blur-md flex items-center gap-2.5">
          <span className="text-2xl">🪙</span>
          <div className="text-right">
            <span className="text-[9px] text-stone-400 block font-bold tracking-wider uppercase">Tabungan Emas</span>
            <span className="text-lg font-mono font-black text-amber-300 leading-none">
              {stats.gold.toLocaleString('id-ID')} G
            </span>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM LEFT: GAMECUBE ACTION PROMPTS ─── */}
      <div className="absolute bottom-6 left-6 pointer-events-none hidden md:flex flex-col gap-1.5 opacity-90">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-300 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800 backdrop-blur-sm">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-stone-950 flex items-center justify-center font-black text-[10px]">
            A
          </span>
          <span>Interaksi / Panen / Bicara</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-stone-300 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800 backdrop-blur-sm">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-[10px]">
            B
          </span>
          <span>Pakai Perkakas Aktif</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-stone-300 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800 backdrop-blur-sm">
          <span className="w-5 h-5 rounded-full bg-stone-600 text-stone-200 flex items-center justify-center font-black text-[10px]">
            X
          </span>
          <span>Buka Rucksack (Tas)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-stone-300 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800 backdrop-blur-sm">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black text-[10px]">
            Y
          </span>
          <span>Bersiul (Kuda & Anjing)</span>
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

          {/* Whistle Button */}
          <button
            onClick={onWhistle}
            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex flex-col items-center shadow-lg active:scale-95 transition"
            title="Bersiul untuk memanggil Kuda & Anjing (Y)"
          >
            <span className="text-base">📢</span>
            <span className="text-[9px] font-black uppercase mt-0.5">Bersiul (Y)</span>
          </button>

          {/* Quick Action Button */}
          <button
            onClick={onPerformAction}
            className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition"
            title="Aksi Utama (Spasi)"
          >
            <span>✨</span> Lakukan Aksi
          </button>
        </div>

        {/* Shortcuts: Horse Riding, Pasture Bell, Tartan, Sprites */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHorseRide}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
              stats.isRidingHorse
                ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
                : 'bg-stone-900/90 border-stone-800 text-amber-200 hover:bg-stone-800'
            }`}
          >
            <span>🐎</span> {stats.isRidingHorse ? 'Turun Kuda' : 'Tunggangi Spirit'}
          </button>

          <button
            onClick={onRingPastureBell}
            className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-amber-800 text-amber-300 hover:bg-amber-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Bell className="w-3.5 h-3.5" /> Lonceng Padang Rumput
          </button>

          <button
            onClick={() => onOpenModal('tartan')}
            className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-emerald-800 text-emerald-300 hover:bg-emerald-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <span>🪴</span> Tartan Hibrida
          </button>

          <button
            onClick={() => onOpenModal('sprites')}
            className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-cyan-800 text-cyan-300 hover:bg-cyan-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" /> Harvest Sprites
          </button>
        </div>
      </div>

      {/* ─── BOTTOM RIGHT: MENU SHORTCUTS (Bag, Barn, Kitchen, Shipping, Diary) ─── */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => onOpenModal('bag')}
          className="p-3 rounded-2xl bg-stone-900/95 border-2 border-stone-800 hover:border-amber-500 text-stone-200 hover:text-amber-300 transition shadow-2xl flex flex-col items-center group"
          title="Rucksack & Tas (I)"
        >
          <Backpack className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-400" />
          <span className="text-[10px] font-bold mt-1">Rucksack</span>
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
