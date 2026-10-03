// ─── HARVEST MOON: A WONDERFUL LIFE 3D - SHIPPING LEDGER MODAL ───
import React from 'react';
import { AWLGameState, InventoryItem } from '../types/awlTypes';
import { Package, Compass, X } from 'lucide-react';

interface AWLShippingModalProps {
  shippingBin: Record<string, number>;
  shippingHistory: AWLGameState['shippingHistory'];
  inventory: Record<string, InventoryItem>;
  onClose: () => void;
}

export const AWLShippingModal: React.FC<AWLShippingModalProps> = ({
  shippingBin,
  shippingHistory,
  inventory,
  onClose,
}) => {
  let projectedTotal = 0;
  const binEntries = Object.entries(shippingBin).map(([id, count]) => {
    const item = inventory[id];
    const price = item?.sellPrice || 50;
    const subtotal = price * count;
    projectedTotal += subtotal;
    return { id, name: item?.name || id, icon: item?.icon || '📦', count, price, subtotal };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-stone-950 border-2 border-emerald-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-2xl shadow-inner">
              📦
            </div>
            <div>
              <h2 className="text-lg font-black text-emerald-200">Buku Pengiriman Takakura</h2>
              <span className="text-xs text-stone-400">Takakura menjemput kiriman setiap jam 05:00 PM sore</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Shipping Bin Section */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Package className="w-3.5 h-3.5" /> Menunggu Penjemputan Hari Ini:
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              Perkiraan: +{projectedTotal.toLocaleString('id-ID')} G
            </span>
          </div>

          {binEntries.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-4 text-center">
              Kotak pengiriman masih kosong. Pindahkan hasil panen atau susu dari tasmu!
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {binEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{entry.icon}</span>
                    <span className="font-bold text-stone-200">{entry.name}</span>
                    <span className="text-stone-400 font-mono">x{entry.count}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+{entry.subtotal} G</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping History Ledger */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-2.5 flex-1 overflow-hidden">
          <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-stone-400" /> Riwayat Penjualan Terakhir:
          </span>

          {shippingHistory.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-4 text-center">
              Belum ada riwayat penjualan sebelumnya.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
              {shippingHistory.slice(-5).reverse().map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs"
                >
                  <span className="text-stone-300 font-medium">
                    Hari {h.day} ({h.season.toUpperCase()})
                  </span>
                  <span className="font-mono font-bold text-amber-300">+{h.totalEarned.toLocaleString('id-ID')} G</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
