// ─── HARVEST MOON: A WONDERFUL LIFE 3D - LIVESTOCK MANAGEMENT MODAL ───
import React from 'react';
import { AnimalState } from '../types/awlTypes';
import { Heart, Bell, Sparkles, X } from 'lucide-react';

interface AWLFarmManagementModalProps {
  animals: Record<string, AnimalState>;
  fodderCount: number;
  onClose: () => void;
  onPetAnimal: (id: string) => void;
  onBrushAnimal: (id: string) => void;
  onMilkAnimal: (id: string) => void;
  onShearAnimal: (id: string) => void;
  onFeedAnimal: (id: string) => void;
  onRingBell: () => void;
}

export const AWLFarmManagementModal: React.FC<AWLFarmManagementModalProps> = ({
  animals,
  fodderCount,
  onClose,
  onPetAnimal,
  onBrushAnimal,
  onMilkAnimal,
  onShearAnimal,
  onFeedAnimal,
  onRingBell,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-stone-950 border-2 border-amber-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4 max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-2xl">
              🐄
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-200">Manajemen Kandang & Ternak Lembah</h2>
              <span className="text-xs text-stone-400">
                Pelihara sapi, domba, kuda, dan ayammu agar menghasilkan produk berkualitas S!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRingBell}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow"
            >
              <Bell className="w-3.5 h-3.5" /> Lonceng Padang Rumput
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Animals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto pr-1 flex-1">
          {Object.values(animals).map((a) => {
            const isCow = a.type === 'sapi' || a.type === 'sapi_jersey';
            const isSheep = a.type === 'domba';
            const isChicken = a.type === 'ayam';

            return (
              <div
                key={a.id}
                className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg hover:border-amber-700/50 transition"
              >
                {/* Animal Title & Hearts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">
                      {isCow ? '🐄' : isSheep ? '🐑' : a.type === 'kuda' ? '🐎' : isChicken ? '🐔' : '🐕'}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-stone-100 flex items-center gap-2">
                        {a.name}
                        {a.inPasture ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-600 text-emerald-300 font-normal">
                            Di Padang Rumput
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-400 font-normal">
                            Di Dalam Kandang
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-stone-400">{a.speciesLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-rose-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-sm ${i < a.hearts ? 'text-rose-500' : 'text-stone-700'}`}>♥</span>
                    ))}
                  </div>
                </div>

                {/* Vital Meters (Kenyang & Bersih) */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                  <div>
                    <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                      <span>Kenyang</span>
                      <span className="font-mono font-bold text-amber-300">{a.hunger}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-900 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${a.hunger}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                      <span>Kebersihan Bulu</span>
                      <span className="font-mono font-bold text-sky-300">{a.cleanliness}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-900 overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${a.cleanliness}%` }} />
                    </div>
                  </div>
                </div>

                {/* Production Banner */}
                {a.hasProductToday && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {isCow ? 'Susu Siap Diperah!' : isSheep ? 'Bulu Wol Siap Dicukur!' : 'Telur Siap Diambil!'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-amber-500 text-stone-950 rounded text-[10px] font-black">
                      Grade {a.productQuality}
                    </span>
                  </div>
                )}

                {/* Care Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => onPetAnimal(a.id)}
                    className="py-1.5 px-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Heart className="w-3 h-3 text-rose-400" /> Belai
                  </button>

                  <button
                    onClick={() => onBrushAnimal(a.id)}
                    className="py-1.5 px-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-200 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <span>🪮</span> Sikat
                  </button>

                  <button
                    onClick={() => onFeedAnimal(a.id)}
                    disabled={fodderCount <= 0}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                      fodderCount > 0
                        ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-800 text-amber-200'
                        : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    <span>🌾</span> Beri Pakan
                  </button>

                  {/* Harvest Action (Milk or Shear) */}
                  {isCow && a.hasProductToday && (
                    <button
                      onClick={() => onMilkAnimal(a.id)}
                      className="col-span-3 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <span>🥛</span> Perah Susu Sapi (Pemerah)
                    </button>
                  )}

                  {isSheep && a.hasProductToday && (
                    <button
                      onClick={() => onShearAnimal(a.id)}
                      className="col-span-3 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <span>✂️</span> Cukur Wol Domba (Gunting)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
