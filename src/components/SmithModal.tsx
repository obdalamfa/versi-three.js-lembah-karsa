// Bengkel Pandai Budi - Blacksmith Tool Upgrades Modal
import React from 'react';
import { motion } from 'motion/react';
import { ToolType, ToolTier } from '../types/game';
import { sound } from '../systems/sound';
import { Hammer, ShieldCheck, Zap } from 'lucide-react';

interface SmithModalProps {
  isOpen: boolean;
  playerGold: number;
  inventory: Record<string, number>;
  toolTiers: Record<ToolType, ToolTier>;
  onUpgradeTool: (tool: ToolType, nextTier: ToolTier, costGold: number, oreNeeded: { id: string; count: number }) => void;
  onClose: () => void;
}

const TIER_ORDER: ToolTier[] = ['Kayu', 'Tembaga', 'Besi', 'Emas', 'Mithril'];

const UPGRADE_REQUIREMENTS: Record<ToolTier, { next: ToolTier; gold: number; oreId: string; oreCount: number; oreName: string }> = {
  Kayu: { next: 'Tembaga', gold: 300, oreId: 'bijih_tembaga', oreCount: 3, oreName: '3 Bijih Tembaga' },
  Tembaga: { next: 'Besi', gold: 750, oreId: 'bijih_besi', oreCount: 3, oreName: '3 Bijih Besi' },
  Besi: { next: 'Emas', gold: 1500, oreId: 'bijih_emas', oreCount: 3, oreName: '3 Bijih Emas' },
  Emas: { next: 'Mithril', gold: 3000, oreId: 'bijih_mithril', oreCount: 3, oreName: '3 Bijih Mithril' },
  Mithril: { next: 'Mithril', gold: 0, oreId: '', oreCount: 0, oreName: 'Maksimal' },
};

const UPGRADABLE_TOOLS: { id: ToolType; name: string; icon: string; desc: string }[] = [
  { id: 'cangkul', name: 'Cangkul Tani', icon: '⛏️', desc: 'Mencangkul lebih banyak petak sekaligus dan hemat energi!' },
  { id: 'siram', name: 'Penyiram Air', icon: '💧', desc: 'Kapasitas air lebih besar dan menyiram area 3x3!' },
  { id: 'pedang', name: 'Pedang Pusaka', icon: '⚔️', desc: 'Meningkatkan serangan (ATK) saat melawan monster di gua!' },
  { id: 'beliung', name: 'Beliung Tambang', icon: '🔨', desc: 'Menghancurkan batu dan bijih tambang dalam 1 kali ayunan!' },
  { id: 'sabit', name: 'Sabit Panen', icon: '🌾', desc: 'Memanen padi dan sayuran berjejer dengan satu tebasan!' },
];

export const SmithModal: React.FC<SmithModalProps> = ({
  isOpen,
  playerGold,
  inventory,
  toolTiers,
  onUpgradeTool,
  onClose,
}) => {
  if (!isOpen) return null;

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
            <div className="text-3xl">🧔</div>
            <div>
              <h2 className="text-lg font-bold text-amber-200">Bengkel Pandai Budi</h2>
              <p className="text-xs text-stone-400">Tempa dan tingkatkan kekuatan perkakasmu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tools List */}
        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
          {UPGRADABLE_TOOLS.map((t) => {
            const currentTier = toolTiers[t.id] || 'Kayu';
            const req = UPGRADE_REQUIREMENTS[currentTier];
            const isMax = currentTier === 'Mithril';

            const hasGold = playerGold >= req.gold;
            const hasOre = (inventory[req.oreId] || 0) >= req.oreCount;
            const canUpgrade = !isMax && hasGold && hasOre;

            return (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-600/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-stone-200">{t.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 font-bold border border-stone-700">
                        {currentTier}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-0.5">{t.desc}</p>
                    {!isMax && (
                      <p className="text-[10px] text-amber-300/80 mt-1 font-mono">
                        Syarat: {req.gold} G + {req.oreName} (Punya: {inventory[req.oreId] || 0})
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isMax ? (
                    <span className="text-xs px-3 py-1 rounded-xl bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                      Maksimal ✨
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (canUpgrade) {
                          sound.playLevelUp();
                          onUpgradeTool(t.id, req.next, req.gold, { id: req.oreId, count: req.oreCount });
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                        canUpgrade
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:brightness-110'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      Upgrade ke {req.next}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
