// Iconic PlayStation 2 Memory Card (8MB) Save Screen Overlay
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types/game';

interface PS2SaveOverlayProps {
  isOpen: boolean;
  state: GameState;
}

export const PS2SaveOverlay: React.FC<PS2SaveOverlayProps> = ({ isOpen, state }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-none select-none"
        >
          {/* PS2 Blue Memory Card Chassis */}
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-sky-950/90 via-blue-950/95 to-slate-950 border-2 border-sky-400/70 shadow-[0_0_50px_rgba(56,189,248,0.35)] p-6 text-stone-100 flex flex-col items-center">
            {/* Memory Card Top Label & Notches */}
            <div className="w-full flex items-center justify-between border-b border-sky-600/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                {/* PS2 Logo Style Mark */}
                <div className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400 text-[10px] font-black tracking-widest text-sky-300">
                  PS2
                </div>
                <span className="text-xs font-bold tracking-wider text-sky-200">
                  MEMORY CARD (8MB)
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SLOT 1
              </span>
            </div>

            {/* 3D Animated Memory Card Icon / Spinning Cube */}
            <div className="relative my-2 w-20 h-20 rounded-2xl bg-sky-900/40 border border-sky-400/50 flex items-center justify-center shadow-inner">
              <span className="text-4xl animate-bounce">🌾</span>
              <div className="absolute inset-0 rounded-2xl border border-sky-300/30 animate-pulse pointer-events-none" />
            </div>

            {/* Game Info Details */}
            <h3 className="text-base font-extrabold text-white mt-2 tracking-wide text-center">
              Lembah Karsa 3D
            </h3>
            <p className="text-xs text-sky-300 font-semibold mb-3">
              {state.player.name} &bull; Lv. {state.player.level}
            </p>

            {/* Save Slot Metadata Box */}
            <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-sky-900/60 flex flex-col gap-1.5 text-xs text-stone-300">
              <div className="flex justify-between">
                <span className="text-stone-400">Musim & Hari:</span>
                <span className="font-semibold text-amber-300">Thn {state.time.year}, {state.time.season} {state.time.day}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Waktu Desa:</span>
                <span className="font-mono font-semibold text-sky-200">{String(state.time.hour).padStart(2, '0')}:{String(state.time.minute).padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Total Tabungan:</span>
                <span className="font-bold text-amber-400">{state.player.gold.toLocaleString('id-ID')} G</span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>DATA BERHASIL DITULIS KE MEMORY CARD</span>
            </div>

            {/* PlayStation MagicGate Subtext */}
            <div className="mt-3 text-[9px] font-mono text-stone-500 tracking-wider">
              MagicGate™ &bull; PlayStation®2 Format &bull; 8MB
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
