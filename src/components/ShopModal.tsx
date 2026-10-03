// Warung Bu Sari - Shop Modal for buying seeds, supplies & selling produce
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ItemDef } from '../types/game';
import { ITEMS } from '../data/gameData';
import { sound } from '../systems/sound';
import { ShoppingBag, Coins, TrendingUp } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  playerGold: number;
  inventory: Record<string, number>;
  onBuy: (item: ItemDef, count: number) => void;
  onSell: (item: ItemDef, count: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  playerGold,
  inventory,
  onBuy,
  onSell,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'beli' | 'jual'>('beli');

  if (!isOpen) return null;

  // Items available for purchase in shop
  const shopCatalog = Object.values(ITEMS).filter((it) => it.buyPrice && it.buyPrice > 0);

  // Shippable items player currently owns
  const sellableInventory = Object.entries(inventory)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => ({ item: ITEMS[id], count }))
    .filter((entry) => entry.item && entry.item.sellPrice > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-stone-900 border-2 border-amber-600/70 rounded-3xl p-5 shadow-2xl max-w-xl w-full flex flex-col gap-4 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="text-3xl">👩‍🌾</div>
            <div>
              <h2 className="text-lg font-bold text-amber-200">Warung Bu Sari</h2>
              <p className="text-xs text-stone-400">Sedia benih sayur, bibit pohon, dan pakan ternak</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950 border border-stone-800">
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-mono font-bold text-amber-300 text-sm">
                {playerGold.toLocaleString('id-ID')} G
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switcher: Beli / Jual */}
        <div className="flex items-center gap-2 bg-stone-950 p-1 rounded-2xl border border-stone-800">
          <button
            onClick={() => { sound.playClick(); setActiveTab('beli'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'beli' ? 'bg-amber-600 text-stone-950 shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            Beli Benih & Pasokan
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('jual'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'jual' ? 'bg-amber-600 text-stone-950 shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            Jual Hasil Panen (Instan)
          </button>
        </div>

        {/* Catalog List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
          {activeTab === 'beli' ? (
            shopCatalog.map((item) => {
              const price = item.buyPrice || 10;
              const canAfford = playerGold >= price;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-600/40 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-stone-200 truncate">{item.name}</h4>
                      <p className="text-[10px] text-amber-400 font-mono">{price} G</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (playerGold >= price) {
                          sound.playHarvest();
                          onBuy(item, 1);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition active:scale-95 ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      Beli 1
                    </button>
                    <button
                      onClick={() => {
                        if (playerGold >= price * 5) {
                          sound.playHarvest();
                          onBuy(item, 5);
                        }
                      }}
                      disabled={playerGold < price * 5}
                      className={`px-2 py-1 text-[10px] font-bold rounded-xl transition active:scale-95 ${
                        playerGold >= price * 5
                          ? 'bg-amber-700/80 hover:bg-amber-600 text-amber-100'
                          : 'bg-stone-800/60 text-stone-600 cursor-not-allowed'
                      }`}
                    >
                      x5
                    </button>
                  </div>
                </div>
              );
            })
          ) : sellableInventory.length === 0 ? (
            <p className="text-xs text-stone-500 col-span-full py-8 text-center">
              Tidak ada hasil bumi di tas yang bisa dijual saat ini.
            </p>
          ) : (
            sellableInventory.map(({ item, count }) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-600/40 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-stone-200 truncate">{item.name}</h4>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      +{item.sellPrice} G <span className="text-stone-500">(Punya: {count})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      sound.playHarvest();
                      onSell(item, 1);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 transition active:scale-95"
                  >
                    Jual 1
                  </button>
                  {count > 1 && (
                    <button
                      onClick={() => {
                        sound.playHarvest();
                        onSell(item, count);
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 transition active:scale-95"
                    >
                      Semua
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
