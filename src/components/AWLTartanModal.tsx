// ─── HARVEST MOON: A WONDERFUL LIFE 3D - TARTAN HYBRID PLANT MODAL ───
import React, { useState } from 'react';
import { InventoryItem, CropId } from '../types/awlTypes';
import { CROPS } from '../data/awlData';
import { Sparkles, X, Plus } from 'lucide-react';

interface AWLTartanModalProps {
  inventory: Record<string, InventoryItem>;
  onClose: () => void;
  onCombineSeeds: (seed1: string, seed2: string) => void;
}

export const AWLTartanModal: React.FC<AWLTartanModalProps> = ({
  inventory,
  onClose,
  onCombineSeeds,
}) => {
  const [seedA, setSeedA] = useState<string | null>(null);
  const [seedB, setSeedB] = useState<string | null>(null);

  // Available seed items in inventory
  const seedItems = Object.values(inventory).filter(
    (item) => item.category === 'seed' && item.count > 0
  );

  const canCombine = seedA !== null && seedB !== null && seedA !== seedB;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg bg-stone-950 border-2 border-emerald-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4">
        {/* Header with Tartan Two-Head Portrait */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border-2 border-emerald-600 flex items-center justify-center text-3xl shadow-inner animate-pulse">
              🪴
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-emerald-200">Tartan Si Tanaman Berkepala Dua</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500 text-emerald-300 font-bold">
                  Ahli Bibit Hibrida AWL 🌱
                </span>
              </div>
              <span className="text-xs text-stone-400">Pondok Takakura • Forget-Me-Not Valley</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tartan Quirky Dialogue */}
        <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-2xl p-3.5 text-xs text-emerald-200 flex items-start gap-2.5 italic">
          <span className="text-xl">🗣️</span>
          <span>
            "Hahaha! Kepala kananku mencium aroma benih manis, kepala kiriku mencium aroma benih segar! Masukkan dua kantong benih berbeda, dan kami akan menyatukannya menjadi varietas hibrida langka berharga tinggi!"
          </span>
        </div>

        {/* Hybrid Seed Combination Slots */}
        <div className="flex items-center justify-center gap-4 py-2">
          {/* Slot A */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-400">Benih Pertama</span>
            <div
              onClick={() => setSeedA(null)}
              className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition ${
                seedA && inventory[seedA]
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md'
                  : 'bg-stone-900/80 border-dashed border-stone-700 text-stone-500'
              }`}
            >
              {seedA && inventory[seedA] ? (
                <>
                  <span className="text-2xl">{inventory[seedA].icon}</span>
                  <span className="text-[10px] font-bold truncate max-w-[70px] mt-1">
                    {inventory[seedA].name.split(' ')[1] || inventory[seedA].name}
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono">Pilih</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center text-emerald-400 text-xl font-black pt-4">
            <Plus className="w-6 h-6" />
          </div>

          {/* Slot B */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-400">Benih Kedua</span>
            <div
              onClick={() => setSeedB(null)}
              className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition ${
                seedB && inventory[seedB]
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md'
                  : 'bg-stone-900/80 border-dashed border-stone-700 text-stone-500'
              }`}
            >
              {seedB && inventory[seedB] ? (
                <>
                  <span className="text-2xl">{inventory[seedB].icon}</span>
                  <span className="text-[10px] font-bold truncate max-w-[70px] mt-1">
                    {inventory[seedB].name.split(' ')[1] || inventory[seedB].name}
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono">Pilih</span>
              )}
            </div>
          </div>
        </div>

        {/* Seed Selector from Inventory */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-stone-300">Pilih Benih dari Tasmu:</span>
          {seedItems.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-2 text-center">
              Tasmu tidak memiliki kantong benih. Beli bibit di perkebunan Vesta!
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {seedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!seedA) setSeedA(item.id);
                    else if (!seedB && item.id !== seedA) setSeedB(item.id);
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                    seedA === item.id || seedB === item.id
                      ? 'bg-emerald-950/90 border-emerald-500'
                      : 'bg-stone-900 border-stone-800 hover:border-emerald-700/60'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-stone-200 truncate">{item.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">x{item.count}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Combine Action Button */}
        <button
          onClick={() => {
            if (canCombine && seedA && seedB) {
              onCombineSeeds(seedA, seedB);
              setSeedA(null);
              setSeedB(null);
            }
          }}
          disabled={!canCombine}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition shadow-xl ${
            canCombine
              ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-900/50 active:scale-95'
              : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Satukan Jadi Benih Hibrida Langka!
        </button>
      </div>
    </div>
  );
};
