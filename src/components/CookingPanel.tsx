// Cooking & Food Processing Station Modal
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RECIPES, Recipe, ITEMS } from '../data/gameData';
import { sound } from '../systems/sound';
import { Flame, ChefHat, CheckCircle, AlertCircle } from 'lucide-react';

interface CookingPanelProps {
  isOpen: boolean;
  inventory: Record<string, number>;
  playerEnergy: number;
  onCook: (recipe: Recipe) => void;
  onClose: () => void;
}

export const CookingPanel: React.FC<CookingPanelProps> = ({
  isOpen,
  inventory,
  playerEnergy,
  onCook,
  onClose,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(RECIPES[0]);

  if (!isOpen) return null;

  const canCook = (recipe: Recipe) => {
    if (playerEnergy < recipe.energyCost) return false;
    for (const [ingId, count] of Object.entries(recipe.ingredients)) {
      if ((inventory[ingId] || 0) < count) return false;
    }
    return true;
  };

  const outputItem = ITEMS[selectedRecipe.outputId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-stone-900 border-2 border-amber-600/70 rounded-3xl p-5 shadow-2xl max-w-2xl w-full flex flex-col gap-4 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-200">Kompor & Dapur Olahan Karsa</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
          {/* Left: Recipe List */}
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {RECIPES.map((rec) => {
              const isSelected = selectedRecipe.id === rec.id;
              const hasIngredients = canCook(rec);
              const out = ITEMS[rec.outputId];

              return (
                <button
                  key={rec.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedRecipe(rec);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-950/60 border-amber-500 shadow-md'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{out?.icon || '🍲'}</span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-200">{rec.name}</h4>
                      <p className="text-[10px] text-stone-400">{rec.desc}</p>
                    </div>
                  </div>

                  {hasIngredients ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      Siap
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                      Kurang
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Recipe Details & Cooking Action */}
          <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-900/30 border border-amber-600/40 flex items-center justify-center text-3xl">
                  {outputItem?.icon || '🍲'}
                </div>
                <div>
                  <h3 className="font-bold text-amber-300 text-sm">{selectedRecipe.name}</h3>
                  <p className="text-xs text-stone-400">Nilai Jual: {outputItem?.sellPrice} G</p>
                  <p className="text-[11px] text-emerald-400">Pulihkan HP: +{outputItem?.healHp} | EN: +{outputItem?.healEnergy}</p>
                </div>
              </div>

              {/* Required Ingredients */}
              <div className="mt-2">
                <p className="text-xs font-bold text-stone-300 mb-2">Bahan yang Dibutuhkan:</p>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(selectedRecipe.ingredients).map(([ingId, needed]) => {
                    const ing = ITEMS[ingId];
                    const owned = inventory[ingId] || 0;
                    const isEnough = owned >= needed;

                    return (
                      <div
                        key={ingId}
                        className="flex items-center justify-between p-2 rounded-xl bg-stone-900 border border-stone-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span>{ing?.icon || '🌱'}</span>
                          <span className="text-stone-300">{ing?.name || ingId}</span>
                        </div>
                        <span className={`font-mono font-bold ${isEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {owned} / {needed}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cook Button */}
            <button
              onClick={() => {
                if (canCook(selectedRecipe)) {
                  sound.playHarvest();
                  onCook(selectedRecipe);
                }
              }}
              disabled={!canCook(selectedRecipe)}
              className={`w-full mt-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                canCook(selectedRecipe)
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:brightness-110'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4" />
              Masak & Olah Makanan (-{selectedRecipe.energyCost} EN)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
