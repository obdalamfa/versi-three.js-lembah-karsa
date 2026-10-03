// ─── HARVEST MOON: A WONDERFUL LIFE 3D - INVENTORY & SHIPPING MODAL ───
import React, { useState } from 'react';
import { InventoryItem } from '../types/awlTypes';
import { Package, Utensils, Send, X, Coins } from 'lucide-react';

interface AWLBagModalProps {
  inventory: Record<string, InventoryItem>;
  shippingBin: Record<string, number>;
  gold: number;
  onClose: () => void;
  onShipItem: (itemId: string, count: number) => void;
  onEatItem: (itemId: string) => void;
}

export const AWLBagModal: React.FC<AWLBagModalProps> = ({
  inventory,
  shippingBin,
  gold,
  onClose,
  onShipItem,
  onEatItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'produce' | 'animal_product' | 'seed' | 'relic' | 'cooked'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const itemsList = Object.values(inventory).filter((i) => i.count > 0);
  const filteredItems = itemsList.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const selectedItem = selectedItemId ? inventory[selectedItemId] : filteredItems[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-stone-950 border-2 border-amber-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-xl">
              🎒
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-200">Tas Petani & Kotak Pengiriman</h2>
              <span className="text-xs text-stone-400">Kelola barang bawaan atau kirim hasil panen ke Takakura</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 border border-amber-700/50 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-300">{gold.toLocaleString('id-ID')} G</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'produce', label: 'Panen' },
            { id: 'animal_product', label: 'Hasil Ternak' },
            { id: 'seed', label: 'Benih' },
            { id: 'relic', label: 'Fosil & Relik' },
            { id: 'cooked', label: 'Masakan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                filter === tab.id
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body: Grid + Inspection Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-[300px]">
          {/* Items Grid */}
          <div className="md:col-span-2 overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-stone-500 gap-2">
                <Package className="w-8 h-8 opacity-40" />
                <span className="text-xs">Tidak ada barang dalam kategori ini.</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`relative p-3 rounded-2xl flex flex-col items-center text-center transition border ${
                        isSelected
                          ? 'bg-amber-950/80 border-amber-500 shadow-lg scale-105'
                          : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <span className="text-2xl mb-1">{item.icon}</span>
                      <span className="text-[11px] font-bold text-stone-200 truncate w-full">{item.name}</span>
                      <span className="absolute top-1 right-2 text-[10px] font-mono font-bold text-amber-400">
                        x{item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details & Actions Panel */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between">
            {selectedItem ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-stone-950 border border-stone-800">{selectedItem.icon}</span>
                  <div>
                    <h4 className="text-sm font-black text-amber-200">{selectedItem.name}</h4>
                    <span className="text-[10px] text-stone-400 font-mono capitalize">
                      Kategori: {selectedItem.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                  {selectedItem.description}
                </p>

                <div className="flex justify-between items-center text-xs py-1 border-y border-stone-800 text-stone-400">
                  <span>Harga Jual:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {selectedItem.sellPrice > 0 ? `${selectedItem.sellPrice} G / buah` : 'Tidak untuk dijual'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {/* Ship button */}
                  {selectedItem.sellPrice > 0 && selectedItem.category !== 'tool' && (
                    <button
                      onClick={() => onShipItem(selectedItem.id, 1)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" /> Kirim ke Takakura (1x)
                    </button>
                  )}

                  {/* Eat button */}
                  {['produce', 'cooked'].includes(selectedItem.category) && (
                    <button
                      onClick={() => onEatItem(selectedItem.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Makan (+Energi & Kenyang)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-500 text-center py-12">
                Pilih barang untuk melihat detail.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
