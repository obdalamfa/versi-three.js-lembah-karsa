// ─── HARVEST MOON: A WONDERFUL LIFE 3D - FISHING MINIGAME ───
import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface AWLFishingModalProps {
  onClose: () => void;
  onFishCaught: (fish: { name: string; price: number; icon: string }) => void;
}

const FISH_TYPES = [
  { name: 'Ikan Yamame Segar', price: 90, icon: '🐟', difficulty: 1 },
  { name: 'Ikan Trout Pelangi', price: 130, icon: '🐠', difficulty: 1.2 },
  { name: 'Ikan Mas Sungai', price: 75, icon: '🐟', difficulty: 0.9 },
  { name: 'Ikan Salmon Emas', price: 280, icon: '🐡', difficulty: 1.8 },
];

export const AWLFishingModal: React.FC<AWLFishingModalProps> = ({ onClose, onFishCaught }) => {
  const [phase, setPhase] = useState<'waiting' | 'hooked' | 'reeling' | 'caught'>('waiting');
  const [currentFish, setCurrentFish] = useState(FISH_TYPES[0]);
  const [reelProgress, setReelProgress] = useState(30); // 0 to 100
  const [targetFishPos, setTargetFishPos] = useState(50); // 0 to 100
  const [barPos, setBarPos] = useState(40); // 0 to 100
  const [isPulling, setIsPulling] = useState(false);

  // 1. Waiting for Bite Phase
  useEffect(() => {
    if (phase === 'waiting') {
      const fish = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
      setCurrentFish(fish);

      const biteDelay = 2000 + Math.random() * 2500;
      const t = setTimeout(() => {
        setPhase('hooked');
      }, biteDelay);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Hook reaction window
  useEffect(() => {
    if (phase === 'hooked') {
      const hookTimer = setTimeout(() => {
        // Missed bite
        setPhase('waiting');
      }, 1500);
      return () => clearTimeout(hookTimer);
    }
  }, [phase]);

  // 2. Reeling Balance Game Loop
  useEffect(() => {
    if (phase !== 'reeling') return;

    const interval = setInterval(() => {
      // Fish erratic swimming motion
      setTargetFishPos((prev) => {
        const delta = (Math.random() - 0.5) * 8 * currentFish.difficulty;
        return Math.max(10, Math.min(90, prev + delta));
      });

      // Player bar physics (falls with gravity, rises when pulling)
      setBarPos((prev) => {
        const vel = isPulling ? 4.5 : -3.5;
        return Math.max(0, Math.min(80, prev + vel));
      });

      // Check if fish is inside reel bar window (bar has height ~22%)
      const isInside = targetFishPos >= barPos && targetFishPos <= barPos + 22;

      setReelProgress((prev) => {
        const next = prev + (isInside ? 1.6 : -1.8);
        if (next >= 100) {
          setPhase('caught');
          onFishCaught(currentFish);
          return 100;
        }
        if (next <= 0) {
          // Fish escaped
          setPhase('waiting');
          return 30;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [phase, isPulling, targetFishPos, barPos, currentFish, onFishCaught]);

  const handleHookClick = () => {
    if (phase === 'hooked') {
      setPhase('reeling');
      setReelProgress(35);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-stone-950 border-2 border-cyan-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-2xl shadow-inner">
              🎣
            </div>
            <div>
              <h2 className="text-lg font-black text-cyan-200">Memancing di Sungai Lembah</h2>
              <span className="text-xs text-stone-400">Joran Bambu Forget-Me-Not Valley</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase State Views */}
        {phase === 'waiting' && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-950/80 border-2 border-cyan-500/50 flex items-center justify-center text-3xl animate-pulse">
              🌊
            </div>
            <span className="text-sm font-bold text-cyan-300">Umpan terlempar...</span>
            <p className="text-xs text-stone-400 max-w-xs">
              Tunggu riak air dan hentakan ikan menggigit kailmu!
            </p>
          </div>
        )}

        {phase === 'hooked' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-950 border-4 border-rose-500 flex items-center justify-center text-4xl animate-bounce shadow-2xl">
              ❗
            </div>
            <div className="text-base font-black text-rose-400">IKAN MENYAMBAR!</div>
            <button
              onClick={handleHookClick}
              className="py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider shadow-xl active:scale-95 transition"
            >
              TARIK JORAN!
            </button>
          </div>
        )}

        {phase === 'reeling' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex justify-between items-center text-xs font-bold text-stone-300">
              <span>Kemajuan Menarik:</span>
              <span className="font-mono text-cyan-300">{Math.round(reelProgress)}%</span>
            </div>

            {/* Overall Progress Bar */}
            <div className="h-3 rounded-full bg-stone-900 border border-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-75"
                style={{ width: `${reelProgress}%` }}
              />
            </div>

            {/* Tension Reel Window */}
            <div className="relative h-44 rounded-2xl bg-stone-900 border-2 border-stone-800 overflow-hidden">
              {/* Fish Position */}
              <div
                className="absolute right-4 text-2xl transition-all duration-75 select-none"
                style={{ bottom: `${targetFishPos}%` }}
              >
                {currentFish.icon}
              </div>

              {/* Player Reel Green Window */}
              <div
                className="absolute left-2 right-12 bg-emerald-500/30 border-2 border-emerald-400 rounded-xl transition-all duration-75"
                style={{ bottom: `${barPos}%`, height: '26%' }}
              />
            </div>

            <p className="text-[11px] text-stone-400 text-center">
              Tahan tombol di bawah agar kotak hijau sejajar dengan posisi ikan!
            </p>

            {/* Hold Button */}
            <button
              onMouseDown={() => setIsPulling(true)}
              onMouseUp={() => setIsPulling(false)}
              onTouchStart={() => setIsPulling(true)}
              onTouchEnd={() => setIsPulling(false)}
              className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 text-stone-950 font-black text-sm shadow-xl select-none"
            >
              TAHAN UNTUK MENARIK GULUNGAN
            </button>
          </div>
        )}

        {phase === 'caught' && (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <span className="text-5xl">{currentFish.icon}</span>
            <div className="flex items-center gap-1.5 text-base font-black text-amber-300">
              <Sparkles className="w-5 h-5 text-amber-400" /> Berhasil Menangkap {currentFish.name}!
            </div>
            <span className="text-xs font-mono text-stone-400">Harga Jual: {currentFish.price} G</span>
            <button
              onClick={onClose}
              className="mt-3 py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition shadow"
            >
              Simpan ke Tas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
