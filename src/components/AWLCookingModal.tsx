// ─── HARVEST MOON: A WONDERFUL LIFE 3D - COOKING & KITCHEN MODAL ───
import React, { useState } from 'react';
import { Recipe, InventoryItem } from '../types/awlTypes';
import { RECIPES } from '../data/awlData';
import { Utensils, Sparkles, X } from 'lucide-react';

interface AWLCookingModalProps {
  inventory: Record<string, InventoryItem>;
  onClose: () => void;
  onCookRecipe: (recipe: Recipe) => void;
}

export const AWLCookingModal: React.FC<AWLCookingModalProps> = ({ inventory, onClose, onCookRecipe }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'soup' | 'salad' | 'entree' | 'dessert'>('all');

  const filteredRecipes = RECIPES.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const canCook = (recipe: Recipe) => {
    return recipe.ingredients.every((ingId) => {
      // Map aliases e.g. susu_segar -> any milk
      if (ingId === 'susu_segar') {
        return (inventory['susu_b']?.count || 0) > 0 || (inventory['susu_a']?.count || 0) > 0 || (inventory['susu_s']?.count || 0) > 0;
      }
      if (ingId === 'telur_segar') {
        return (inventory['telur_ayam']?.count || 0) > 0 || (inventory['telur_emas']?.count || 0) > 0;
      }
      return (inventory[ingId]?.count || 0) > 0;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-stone-950 border-2 border-orange-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-950 border border-orange-700/60 flex items-center justify-center text-2xl shadow-inner">
              🍳
            </div>
            <div>
              <h2 className="text-lg font-black text-orange-200">Dapur Rumah & Resep Masakan</h2>
              <span className="text-xs text-stone-400">Olah hasil tani dan susu segar menjadi santapan bergizi!</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'Semua Resep' },
            { id: 'soup', label: 'Sup Hangat' },
            { id: 'salad', label: 'Salad Segar' },
            { id: 'entree', label: 'Hidangan Utama' },
            { id: 'dessert', label: 'Kue & Manisan' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id as typeof selectedCategory)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === c.id
                  ? 'bg-orange-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
          {filteredRecipes.map((recipe) => {
            const cookable = canCook(recipe);
            return (
              <div
                key={recipe.id}
                className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{recipe.icon}</span>
                      <h4 className="text-sm font-black text-amber-200">{recipe.name}</h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      +{recipe.energyRestore} Energi
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-950 p-2 rounded-xl border border-stone-800/80 mb-2">
                    {recipe.description}
                  </p>

                  {/* Required Ingredients */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="text-stone-500 font-bold self-center">Bahan:</span>
                    {recipe.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700 font-mono capitalize"
                      >
                        {ing.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onCookRecipe(recipe)}
                  disabled={!cookable}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow ${
                    cookable
                      ? 'bg-orange-600 hover:bg-orange-500 text-stone-950 active:scale-95'
                      : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  {cookable ? 'Masak Hidangan Ini' : 'Bahan Belum Cukup'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
