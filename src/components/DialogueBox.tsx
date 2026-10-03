// Story & NPC Dialogue Modal
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NPCData, ItemDef } from '../types/game';
import { sound } from '../systems/sound';
import { Heart, Gift, MessageCircle } from 'lucide-react';
import { ITEMS } from '../data/gameData';

interface DialogueBoxProps {
  isOpen: boolean;
  npc: NPCData | null;
  text: string;
  inventory: Record<string, number>;
  onClose: () => void;
  onGiveGift: (itemId: string) => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  isOpen,
  npc,
  text,
  inventory,
  onClose,
  onGiveGift,
}) => {
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);

  if (!npc) return null;

  const inventoryItems = Object.entries(inventory)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => ({ item: ITEMS[id], count }))
    .filter((entry) => entry.item);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 pointer-events-auto bg-black/30 backdrop-blur-xs">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-2xl bg-stone-900/95 border-2 border-amber-600/70 rounded-3xl p-5 shadow-2xl flex flex-col gap-3"
          >
            {/* Top Bar: NPC Name, Role & Hearts */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-3xl shadow-inner">
                  {npc.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-base flex items-center gap-2">
                    {npc.name}
                    <span className="text-xs font-normal text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      {npc.role}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">{npc.personality}</p>
                </div>
              </div>

              {/* Heart Friendship Gauge */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < npc.hearts
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-stone-700 fill-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Dialogue Body Text */}
            <div className="py-2 text-stone-200 text-sm leading-relaxed min-h-[50px]">
              "{text}"
            </div>

            {/* Gift Drawer */}
            {showGiftDrawer && (
              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <p className="text-xs font-bold text-amber-300 mb-2">Pilih Barang untuk Hadiah:</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto">
                  {inventoryItems.length === 0 ? (
                    <p className="text-xs text-stone-500 col-span-full py-2">Tas kosong</p>
                  ) : (
                    inventoryItems.map(({ item, count }) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          sound.playClick();
                          onGiveGift(item.id);
                          setShowGiftDrawer(false);
                        }}
                        className="flex flex-col items-center p-2 rounded-xl bg-stone-900 hover:bg-amber-950/60 border border-stone-700 hover:border-amber-500 transition"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-[10px] text-stone-300 truncate w-full text-center mt-1">
                          {item.name}
                        </span>
                        <span className="text-[9px] text-amber-400 font-mono">x{count}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowGiftDrawer(!showGiftDrawer);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Gift className="w-3.5 h-3.5" />
                Beri Hadiah
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition active:scale-95 shadow-lg"
              >
                Lanjut
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
