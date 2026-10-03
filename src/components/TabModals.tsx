// Fullscreen Tab Modals: Tas, Peta, Ternak, Motif, Misi, Warga, Panduan, Pengaturan
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, ItemDef, Season, PS2VisualSettings } from '../types/game';
import { ITEMS, CROPS } from '../data/gameData';
import { MOTIVE_KEYS, MOTIVE_NAMES, calculateMood, getMotiveColor } from '../systems/motives';
import { sound } from '../systems/sound';
import {
  Briefcase,
  Compass,
  Heart,
  Scroll,
  Users,
  BookOpen,
  Settings,
  Sparkles,
  Utensils,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  MapPin,
  Tv,
  Calendar,
} from 'lucide-react';
import { CalendarView } from './CalendarView';

interface TabModalsProps {
  isOpen: boolean;
  activeTab: 'tas' | 'kalender' | 'peta' | 'ternak' | 'motif' | 'misi' | 'warga' | 'pengaturan';
  state: GameState;
  onSelectTab: (tab: 'tas' | 'kalender' | 'peta' | 'ternak' | 'motif' | 'misi' | 'warga' | 'pengaturan') => void;
  onEatItem: (itemId: string) => void;
  onShipItem: (itemId: string, count: number) => void;
  onClaimQuest: (questId: string) => void;
  onTeleport: (sceneId: string, x: number, y: number) => void;
  onSaveGame: () => void;
  onResetGame: () => void;
  onUpdatePS2Settings?: (settings: Partial<PS2VisualSettings>) => void;
  onClose: () => void;
}

export const TabModals: React.FC<TabModalsProps> = ({
  isOpen,
  activeTab,
  state,
  onSelectTab,
  onEatItem,
  onShipItem,
  onClaimQuest,
  onTeleport,
  onSaveGame,
  onResetGame,
  onUpdatePS2Settings,
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = useState<ItemDef | null>(null);

  if (!isOpen) return null;

  const ps2 = state.ps2Settings || {
    enabled: true,
    bloomGlow: true,
    crtScanlines: true,
    gsDither: true,
    celOutlines: true,
    colorWarmth: 0.8,
    vignette: true,
    dualShockPrompts: true,
  };

  const inventoryEntries = Object.entries(state.inventory)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => ({ item: ITEMS[id] || { id, name: id, category: 'misc', sellPrice: 10, icon: '📦', description: '' }, count }));

  const moodScore = calculateMood(state.motives);

  const WORLD_REGIONS = [
    { id: 'farm', name: 'Kebun Paman Arsa', icon: '🌾', desc: 'Pusat pertanian dan peternakanmu', x: 15, y: 15 },
    { id: 'town', name: 'Desa Karsa', icon: '🏘️', desc: 'Alun-alun, warung, pandai besi, klinik', x: 18, y: 14 },
    { id: 'house', name: 'Rumah Kamu', icon: '🏡', desc: 'Tempat istirahat dan memasak di kompor', x: 7, y: 7 },
    { id: 'greenhouse', name: 'Rumah Kaca', icon: '🌿', desc: 'Lahan subur segala musim', x: 7, y: 7 },
    { id: 'lake', name: 'Danau Karsa', icon: '🎣', desc: 'Spot pemancingan air tawar', x: 14, y: 12 },
    { id: 'mountain', name: 'Lereng Gunung', icon: '⛰️', desc: 'Tambang bijih dan pintu dungeon gua', x: 15, y: 15 },
    { id: 'beach', name: 'Pantai Selatan', icon: '🏖️', desc: 'Dermaga perahu mistis ke Swarga & Samudra', x: 15, y: 10 },
    { id: 'ocean', name: 'Samudra Tropis', icon: '🌊', desc: 'Lautan karang, patung Moai & kuil air Innocent Life', x: 10, y: 14 },
    { id: 'dungeon_water', name: 'Kuil Air Kuno', icon: '💧', desc: 'Air terjun bawah tanah & kristal aquamarine', x: 14, y: 18 },
    { id: 'dungeon_fire', name: 'Gua Magma Api', icon: '🌋', desc: 'Sungai lahar membara & batu delima vulkanik', x: 14, y: 16 },
    { id: 'dungeon_forest', name: 'Reruntuhan Hutan', icon: '🌲', desc: 'Ziggurat purba berlumut & rel maglev purba', x: 14, y: 14 },
    { id: 'lab_hope', name: 'Lab Dr. Hope', icon: '🔬', desc: 'Kapsul regenerasi Life, terminal hologram & robot', x: 10, y: 10 },
    { id: 'cemetery', name: 'Kuburan Tua', icon: '🪦', desc: 'Makam kuno penjaga desa', x: 12, y: 10 },
    { id: 'naga_cave', name: 'Gua Sang Hyang', icon: '🐉', desc: 'Mata air suci dan altar naga', x: 9, y: 12 },
    { id: 'swarga', name: 'Swarga Langit', icon: '☁️', desc: 'Dunia atas danau teratai emas', x: 12, y: 12 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-stone-900 border-2 border-amber-600/70 rounded-3xl shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden text-stone-100"
      >
        {/* Top Tab Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800 bg-stone-950/60 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'tas', label: 'Tas', icon: <Briefcase className="w-4 h-4 text-amber-400" /> },
              { id: 'kalender', label: 'Kalender', icon: <Calendar className="w-4 h-4 text-amber-400" /> },
              { id: 'peta', label: 'Peta Dunia', icon: <Compass className="w-4 h-4 text-sky-400" /> },
              { id: 'ternak', label: 'Tani & Ternak', icon: '🐄' },
              { id: 'motif', label: '8 Motif Sims', icon: '🧠' },
              { id: 'misi', label: 'Jurnal Misi', icon: <Scroll className="w-4 h-4 text-emerald-400" /> },
              { id: 'warga', label: 'Warga Desa', icon: <Users className="w-4 h-4 text-rose-400" /> },
              { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-4 h-4 text-stone-400" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sound.playClick();
                  onSelectTab(t.id as typeof activeTab);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center ml-2 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* 1. TAS (Inventory) */}
          {activeTab === 'tas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Items Grid */}
              <div className="md:col-span-2 grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {inventoryEntries.length === 0 ? (
                  <p className="text-xs text-stone-500 col-span-full py-16 text-center">
                    Tas ranselmu kosong. Panen sayuran atau beli benih di warung!
                  </p>
                ) : (
                  inventoryEntries.map(({ item, count }) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedItem(item);
                      }}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        selectedItem?.id === item.id
                          ? 'bg-amber-950/80 border-amber-500 shadow-md scale-105'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-[10px] text-stone-300 truncate w-full text-center mt-1">
                        {item.name}
                      </span>
                      <span className="absolute top-1 right-2 text-[10px] font-mono font-bold text-amber-400">
                        x{count}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Selected Item Details */}
              <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 flex flex-col justify-between">
                {selectedItem ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-amber-900/30 border border-amber-600/40 flex items-center justify-center text-4xl">
                        {selectedItem.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-300 text-sm">{selectedItem.name}</h3>
                        <p className="text-[11px] text-stone-400 capitalize">{selectedItem.category}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">Nilai Jual: {selectedItem.sellPrice} G</p>
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                      {selectedItem.description || 'Barang koleksi Lembah Karsa.'}
                    </p>

                    {(selectedItem.healHp || selectedItem.healEnergy) && (
                      <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40 flex items-center justify-between">
                        <span>Efek Konsumsi:</span>
                        <span className="font-bold font-mono">
                          +{selectedItem.healHp || 0} HP | +{selectedItem.healEnergy || 0} EN
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 text-center py-12">
                    Pilih barang dari tas untuk melihat rincian & aksi.
                  </p>
                )}

                {/* Actions */}
                {selectedItem && (
                  <div className="flex flex-col gap-2 mt-4">
                    {(selectedItem.healHp || selectedItem.healEnergy) && (
                      <button
                        onClick={() => {
                          sound.playEat();
                          onEatItem(selectedItem.id);
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        Makan / Gunakan
                      </button>
                    )}

                    {selectedItem.isShippable && (
                      <button
                        onClick={() => {
                          sound.playHarvest();
                          onShipItem(selectedItem.id, 1);
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Kirim ke Peti Pengiriman (+{selectedItem.sellPrice} G)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. KALENDER & ACARA MUSIM */}
          {activeTab === 'kalender' && (
            <CalendarView
              time={state.time}
              npcs={state.npcs}
              onSelectNpcTab={() => onSelectTab('warga')}
            />
          )}

          {/* 3. PETA (World Map) */}
          {activeTab === 'peta' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-200">Peta Lembah Karsa Nusantara</h3>
                <span className="text-xs text-stone-400">Klik wilayah untuk melihat rincian & jalan pintas</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {WORLD_REGIONS.map((reg) => {
                  const isCurrent = state.player.scene === reg.id;

                  return (
                    <button
                      key={reg.id}
                      onClick={() => {
                        sound.playClick();
                        onTeleport(reg.id, reg.x, reg.y);
                        onClose();
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                        isCurrent
                          ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-3xl">{reg.icon}</span>
                      <h4 className="text-xs font-bold text-stone-200 mt-2">{reg.name}</h4>
                      <p className="text-[10px] text-stone-400 line-clamp-2 mt-0.5">{reg.desc}</p>
                      {isCurrent && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black mt-2">
                          Lokasimu Sekarang
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. TERNAK & TANI */}
          {activeTab === 'ternak' && (
            <div className="flex flex-col gap-5">
              {/* Animals Section */}
              <div>
                <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
                  🐄 Status Hewan Ternak
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(state.animals).map((a) => {
                    const quote = sound.getAnimalSoundQuote(a.type);
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          sound.playAnimalAmbient(a.type);
                        }}
                        className="p-3.5 rounded-2xl bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 flex flex-col gap-2 transition text-left cursor-pointer group active:scale-95"
                        title="Klik untuk mendengarkan suara hewan"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform">
                              {a.type === 'sapi' ? '🐄' : a.type === 'ayam' ? '🐔' : a.type === 'bebek' ? '🦆' : a.type === 'kambing' ? '🐐' : '🐑'}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors">{a.name}</h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                                  {quote.text}
                                </span>
                              </div>
                              <span className="text-[10px] text-stone-400">{a.speciesLabel}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-rose-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-xs ${i < a.hearts ? 'text-rose-500' : 'text-stone-700'}`}>♥</span>
                            ))}
                          </div>
                        </div>

                        {/* Vital bars */}
                        <div className="grid grid-cols-3 gap-1.5 text-[10px] w-full">
                          <div className="bg-stone-900/80 p-1.5 rounded-xl text-center">
                            <span className="text-stone-400 block">Kenyang</span>
                            <span className={`font-bold ${a.kenyang > 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {a.kenyang}%
                            </span>
                          </div>
                          <div className="bg-stone-900/80 p-1.5 rounded-xl text-center">
                            <span className="text-stone-400 block">Air Minum</span>
                            <span className={`font-bold ${a.air > 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {a.air}%
                            </span>
                          </div>
                          <div className="bg-stone-900/80 p-1.5 rounded-xl text-center">
                            <span className="text-stone-400 block">Kebersihan</span>
                            <span className={`font-bold ${a.bersih > 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {a.bersih}%
                            </span>
                          </div>
                        </div>

                        {a.produk_siap && (
                          <div className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-center border border-amber-500/30 w-full">
                            ✨ Hasil Ternak Siap Dipetik / Diperah!
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crops Overview */}
              <div>
                <h3 className="text-sm font-bold text-amber-300 mb-2">🌱 Lahan Kebun Aktif</h3>
                <p className="text-xs text-stone-400">
                  Total Petak Tani: {Object.keys(state.soil).length} petak terolah.
                </p>
              </div>
            </div>
          )}

          {/* 4. MOTIF (Sims 8-Motives Engine) */}
          {activeTab === 'motif' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-stone-950 p-4 rounded-2xl border border-stone-800">
                <div>
                  <h3 className="text-sm font-bold text-amber-200">Keseimbangan 8 Motif Karakter</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Sistem simulasi kebutuhan ala The Sims. Jaga suasana hatimu agar tetap bersemangat!
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-900 border border-stone-700">
                  <span className="text-2xl">{moodScore > 30 ? '😊' : moodScore > -20 ? '😐' : '😫'}</span>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Skor Suasana Hati</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">{moodScore} / 100</span>
                  </div>
                </div>
              </div>

              {/* 8 Bars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOTIVE_KEYS.map((key) => {
                  const val = Number(state.motives[key]);
                  const col = getMotiveColor(val);

                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-stone-300">{MOTIVE_NAMES[key]}</span>
                        <span className={`font-mono ${val > 40 ? 'text-emerald-400' : val > -20 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {Math.round(val)}
                        </span>
                      </div>

                      {/* Bar Gauge */}
                      <div className="h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            val > 40 ? 'bg-emerald-500' : val > -20 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, Math.min(100, (val + 100) / 2))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. MISI (Quests) */}
          {activeTab === 'misi' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-amber-200 mb-1">Jurnal Misi & Petualangan</h3>

              <div className="flex flex-col gap-3">
                {state.quests.map((q) => {
                  const isFinished = q.currentProgress >= q.requiredProgress;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                        q.completed
                          ? 'bg-stone-950/40 border-stone-800 opacity-60'
                          : isFinished
                          ? 'bg-amber-950/40 border-amber-500 shadow-md'
                          : 'bg-stone-950 border-stone-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-stone-200">{q.title}</h4>
                          <span className="text-[10px] text-amber-400">({q.giver})</span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">{q.description}</p>
                        <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                          Hadiah: {q.rewardGold} G + {q.rewardExp} EXP
                        </p>
                      </div>

                      <div className="shrink-0">
                        {q.completed ? (
                          <span className="text-xs text-stone-500 font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Selesai
                          </span>
                        ) : isFinished ? (
                          <button
                            onClick={() => {
                              sound.playLevelUp();
                              onClaimQuest(q.id);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg active:scale-95 transition"
                          >
                            Klaim Hadiah!
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-amber-300 font-bold">
                            {q.currentProgress} / {q.requiredProgress}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. WARGA DESA */}
          {activeTab === 'warga' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-amber-200 mb-1">Hubungan Warga Lembah Karsa</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(state.npcs).map((npc) => (
                  <div
                    key={npc.id}
                    className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-3xl">
                        {npc.avatar}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-200">{npc.name}</h4>
                        <span className="text-[10px] text-amber-400">{npc.role}</span>
                        <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{npc.personality}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-rose-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < npc.hearts ? 'text-rose-500' : 'text-stone-700'}`}>♥</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. PENGATURAN & SIMPAN */}
          {activeTab === 'pengaturan' && (
            <div className="flex flex-col gap-4 max-w-md mx-auto py-2">
              {/* PS2 Emotion Engine & Graphics Synthesizer Settings Card */}
              <div className="bg-sky-950/40 p-4 rounded-2xl border-2 border-sky-500/60 shadow-xl shadow-sky-950/50 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-sky-700/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/30 text-sky-300 font-mono font-black text-xs">
                      PS2
                    </span>
                    <h3 className="text-sm font-bold text-sky-200">
                      Grafis PlayStation®2 (Emotion Engine)
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdatePS2Settings?.({ enabled: !ps2.enabled });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      ps2.enabled
                        ? 'bg-sky-500 text-stone-950 shadow-md shadow-sky-400/30'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {ps2.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </button>
                </div>

                <p className="text-[11px] text-sky-200/80 leading-relaxed">
                  Adaptasi visual era emas konsol PS2 (Harvest Moon: AWL, Dragon Quest VIII, Shadow of the Colossus):
                  Bloom mimpi, pendaran matahari, dither 16-bit, dan scanline CRT.
                </p>

                {/* Sub-options */}
                <div className="flex flex-col gap-2.5 pt-1 text-xs">
                  {/* Bloom & Dream Glare */}
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-stone-900/60 border border-sky-900/50 hover:bg-stone-900">
                    <div>
                      <span className="font-semibold text-stone-200 block">Dreamy Bloom & Glow (AWL)</span>
                      <span className="text-[10px] text-stone-400">Efek pendaran hangat khas Harvest Moon & ICO</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ps2.bloomGlow}
                      disabled={!ps2.enabled}
                      onChange={(e) => {
                        sound.playClick();
                        onUpdatePS2Settings?.({ bloomGlow: e.target.checked });
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  {/* CRT 480p Scanlines */}
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-stone-900/60 border border-sky-900/50 hover:bg-stone-900">
                    <div>
                      <span className="font-semibold text-stone-200 block">Garis Pindai CRT 480p</span>
                      <span className="text-[10px] text-stone-400">Simulasi layar kaca tabung & fosfor subpixel</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ps2.crtScanlines}
                      disabled={!ps2.enabled}
                      onChange={(e) => {
                        sound.playClick();
                        onUpdatePS2Settings?.({ crtScanlines: e.target.checked });
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  {/* 16-Bit Bayer GS Dithering */}
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-stone-900/60 border border-sky-900/50 hover:bg-stone-900">
                    <div>
                      <span className="font-semibold text-stone-200 block">Dithering Matriks GS 16-Bit</span>
                      <span className="text-[10px] text-stone-400">Tekstur kuantisasi retro Graphics Synthesizer</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ps2.gsDither}
                      disabled={!ps2.enabled}
                      onChange={(e) => {
                        sound.playClick();
                        onUpdatePS2Settings?.({ gsDither: e.target.checked });
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  {/* Inverted-Hull Cel Outlines */}
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-stone-900/60 border border-sky-900/50 hover:bg-stone-900">
                    <div>
                      <span className="font-semibold text-stone-200 block">Garis Kontur Cel-Shading</span>
                      <span className="text-[10px] text-stone-400">Siluet komik 3D ala Dragon Quest VIII & Dark Cloud 2</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ps2.celOutlines}
                      disabled={!ps2.enabled}
                      onChange={(e) => {
                        sound.playClick();
                        onUpdatePS2Settings?.({ celOutlines: e.target.checked });
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  {/* DualShock 2 Button Glyphs */}
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-stone-900/60 border border-sky-900/50 hover:bg-stone-900">
                    <div>
                      <span className="font-semibold text-stone-200 block">Ikon Tombol DualShock 2</span>
                      <span className="text-[10px] text-stone-400">Tampilkan prompt ✕, ◯, ▢, △, L1, R1</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ps2.dualShockPrompts}
                      disabled={!ps2.enabled}
                      onChange={(e) => {
                        sound.playClick();
                        onUpdatePS2Settings?.({ dualShockPrompts: e.target.checked });
                      }}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Memory Card Save Card */}
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-300">Memory Card (8MB) Slot 1</h3>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                    LocalStorage
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Data petualangan kamu disimpan ke memori penyimpanan lokal browser.
                </p>

                <button
                  onClick={() => {
                    sound.playPS2Save();
                    onSaveGame();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <span>💾</span> Simpan Data ke Memory Card Sekarang
                </button>

                <button
                  onClick={() => {
                    if (confirm('Yakin ingin mereset dan memulai ulang permainan dari awal?')) {
                      onResetGame();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Reset & Mulai Ulang
                </button>
              </div>

              {/* Statistics */}
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-2 text-xs">
                <h3 className="font-bold text-amber-300">Statistik Petualangan</h3>
                <div className="flex justify-between py-1 border-b border-stone-900 text-stone-300">
                  <span>Hasil Panen:</span> <span className="font-mono font-bold text-amber-400">{state.stats.cropsHarvested}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900 text-stone-300">
                  <span>Monster Dikalahkan:</span> <span className="font-mono font-bold text-amber-400">{state.stats.monstersDefeated}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900 text-stone-300">
                  <span>Ikan Tertangkap:</span> <span className="font-mono font-bold text-amber-400">{state.stats.fishCaught}</span>
                </div>
                <div className="flex justify-between py-1 text-stone-300">
                  <span>Bijih Tambang:</span> <span className="font-mono font-bold text-amber-400">{state.stats.oresMined}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
