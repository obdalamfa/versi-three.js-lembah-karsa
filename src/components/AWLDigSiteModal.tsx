// ─── HARVEST MOON: A WONDERFUL LIFE 3D - ARCHAEOLOGICAL DIG SITE MINIGAME ───
import React, { useState } from 'react';
import { DigCell, DigSiteRelic } from '../types/awlTypes';
import { DIG_RELICS } from '../data/awlData';
import { Sparkles, X } from 'lucide-react';

interface AWLDigSiteModalProps {
  onClose: () => void;
  onRelicFound: (relic: DigSiteRelic) => void;
  stamina: number;
}

export const AWLDigSiteModal: React.FC<AWLDigSiteModalProps> = ({
  onClose,
  onRelicFound,
  stamina,
}) => {
  // Generate a 6x5 excavation grid
  const [grid, setGrid] = useState<DigCell[]>(() => {
    const cells: DigCell[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 6; x++) {
        // 35% chance a cell holds an ancient relic
        let relic: DigSiteRelic | null = null;
        if (Math.random() < 0.38) {
          relic = DIG_RELICS[Math.floor(Math.random() * DIG_RELICS.length)];
        }
        cells.push({ x, y, dug: false, relic });
      }
    }
    return cells;
  });

  const [message, setMessage] = useState<string>(
    'Carter: "Pilihlah petak tanah liat di parit purba ini untuk mulai menggali fosil dan artefak kuno!"'
  );

  const handleDigCell = (idx: number) => {
    if (grid[idx].dug) return;
    if (stamina < 5) {
      setMessage('Carter: "Kau tampak kelelahan, istirahatlah dulu atau makan sesuatu!"');
      return;
    }

    const nextGrid = [...grid];
    nextGrid[idx].dug = true;
    setGrid(nextGrid);

    const cell = nextGrid[idx];
    if (cell.relic) {
      onRelicFound(cell.relic);
      setMessage(`✨ LUAR BIASA! Kau menemukan ${cell.relic.name}! (${cell.relic.sellPrice} G)`);
    } else {
      const emptyResponses = [
        'Hanya tanah liat dan batu kerikil biasa...',
        'Belum ada apa-apa di sini, coba petak sebelahnya!',
        'Debu purba terangkat, tapi belum ada fosil.',
      ];
      setMessage(emptyResponses[Math.floor(Math.random() * emptyResponses.length)]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-stone-950 border-2 border-amber-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-2xl shadow-inner">
              🔍
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-200">Situs Penggalian Gua Arkeologi</h2>
              <span className="text-xs text-stone-400">Parit Ekspedisi Carter & Flora • Forget-Me-Not Valley</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Carter's Dialogue / Status */}
        <div className="bg-amber-950/20 border border-amber-900/60 rounded-2xl p-3 text-xs text-amber-200 flex items-center gap-2.5">
          <span className="text-xl">👴</span>
          <span className="font-medium leading-relaxed">{message}</span>
        </div>

        {/* Digging Grid */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 flex flex-col items-center">
          <div className="grid grid-cols-6 gap-2 w-full max-w-md">
            {grid.map((cell, idx) => {
              return (
                <button
                  key={`${cell.x}_${cell.y}`}
                  onClick={() => handleDigCell(idx)}
                  disabled={cell.dug}
                  className={`h-14 rounded-xl flex items-center justify-center text-xl transition-all duration-200 border-2 ${
                    cell.dug
                      ? cell.relic
                        ? 'bg-amber-950/80 border-amber-500 shadow-md animate-bounce'
                        : 'bg-stone-950 border-stone-800 opacity-60'
                      : 'bg-stone-800 hover:bg-amber-900/60 border-stone-700 hover:border-amber-600 cursor-pointer active:scale-95 shadow-sm'
                  }`}
                  title={cell.dug ? 'Sudah digali' : 'Gali dengan sekop (-5 Energi)'}
                >
                  {cell.dug ? (
                    cell.relic ? (
                      <span className="text-2xl drop-shadow">{cell.relic.icon}</span>
                    ) : (
                      <span className="text-stone-700 text-xs font-mono">•</span>
                    )
                  ) : (
                    <span className="text-stone-500 text-sm">⛏️</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-400 px-2">
          <span>Energi penggalian: -5 Energi per petak</span>
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black transition shadow"
          >
            Selesai Menggali
          </button>
        </div>
      </div>
    </div>
  );
};
