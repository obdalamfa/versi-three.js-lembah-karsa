// Interactive Real-Time Fishing Mini-Game
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { sound } from '../systems/sound';

interface FishingMiniGameProps {
  isOpen: boolean;
  sceneId?: string;
  onCatch: (fishType: string) => void;
  onClose: () => void;
}

export const FishingMiniGame: React.FC<FishingMiniGameProps> = ({
  isOpen,
  sceneId,
  onCatch,
  onClose,
}) => {
  const [gameState, setGameState] = useState<'waiting' | 'hooked' | 'reeling' | 'success' | 'failed'>('waiting');
  const [fishPos, setFishPos] = useState(50); // 0 - 100%
  const [barPos, setBarPos] = useState(50);   // 0 - 100%
  const [progress, setProgress] = useState(30); // 0 - 100%
  const isHoldingRef = useRef(false);

  // Hook trigger timer
  useEffect(() => {
    if (!isOpen) {
      setGameState('waiting');
      return;
    }

    setGameState('waiting');
    const hookDelay = 1500 + Math.random() * 2500;
    const timer = setTimeout(() => {
      sound.playFishBite();
      setGameState('hooked');
    }, hookDelay);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Reeling game loop
  useEffect(() => {
    if (gameState !== 'reeling') return;

    let fishTarget = 50;
    let changeTimer = 0;

    const interval = setInterval(() => {
      // 1. Move fish smoothly towards random target
      changeTimer += 1;
      if (changeTimer > 20) {
        fishTarget = Math.max(10, Math.min(90, fishTarget + (Math.random() - 0.5) * 50));
        changeTimer = 0;
      }
      setFishPos((prev) => prev + (fishTarget - prev) * 0.08);

      // 2. Move player green bar with physics/inertia
      setBarPos((prev) => {
        const vel = isHoldingRef.current ? 2.8 : -2.4;
        return Math.max(10, Math.min(90, prev + vel));
      });

      // 3. Check if fish is within green bar
      setBarPos((currentBar) => {
        setFishPos((currentFish) => {
          const isInside = Math.abs(currentBar - currentFish) < 14;
          setProgress((p) => {
            const next = isInside ? p + 0.8 : p - 0.6;
            if (next >= 100) {
              setGameState('success');
              sound.playHarvest();
              setTimeout(() => {
                const rand = Math.random();
                let caught = 'ikan';
                if (sceneId === 'ocean') {
                  caught = rand > 0.88 ? 'mutiara_laut' : rand > 0.62 ? 'ikan_tuna' : rand > 0.32 ? 'ikan_pari' : 'ikan_badut';
                } else {
                  caught = rand > 0.9 ? 'ikan_legendaris' : rand > 0.6 ? 'ikan_nila' : rand > 0.3 ? 'ikan_lele' : 'ikan';
                }
                onCatch(caught);
              }, 800);
            } else if (next <= 0) {
              setGameState('failed');
              sound.playHit();
            }
            return Math.max(0, Math.min(100, next));
          });
          return currentFish;
        });
        return currentBar;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameState, onCatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-stone-900 border-2 border-sky-600 rounded-3xl p-6 shadow-2xl max-w-xs w-full text-center flex flex-col items-center gap-4"
      >
        <h3 className="text-lg font-bold text-sky-300">🎣 Memancing di Danau</h3>

        {gameState === 'waiting' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="text-4xl animate-bounce">🌊</div>
            <p className="text-xs text-stone-300">Menunggu umpan disambar ikan...</p>
            <p className="text-[11px] text-stone-500">Bersiap saat tanda seru (!) muncul!</p>
          </div>
        )}

        {gameState === 'hooked' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="text-5xl font-black text-amber-400 animate-ping">❗</div>
            <p className="text-sm font-bold text-amber-300">Umpan Disambar!</p>
            <button
              onClick={() => {
                sound.playClick();
                setGameState('reeling');
              }}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-lg active:scale-95 transition"
            >
              TARIK JORAN!
            </button>
          </div>
        )}

        {gameState === 'reeling' && (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Fishing Reel Bar */}
            <div className="flex items-center gap-4 w-full justify-center">
              {/* Vertical Water Column */}
              <div
                className="relative w-14 h-64 bg-stone-950 border-2 border-sky-700/80 rounded-2xl overflow-hidden cursor-pointer select-none"
                onMouseDown={() => { isHoldingRef.current = true; }}
                onMouseUp={() => { isHoldingRef.current = false; }}
                onTouchStart={() => { isHoldingRef.current = true; }}
                onTouchEnd={() => { isHoldingRef.current = false; }}
              >
                {/* Green Catch Bar */}
                <div
                  className="absolute left-0 right-0 h-16 bg-emerald-500/40 border-y-2 border-emerald-400 pointer-events-none transition-all duration-75"
                  style={{ bottom: `${barPos - 8}%` }}
                />

                {/* Fish Icon */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-2xl transition-all duration-75"
                  style={{ bottom: `${fishPos}%` }}
                >
                  🐟
                </div>
              </div>

              {/* Progress Gauge */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-stone-400 font-bold">PROGRES</span>
                <div className="w-4 h-64 bg-stone-950 rounded-full border border-stone-700 overflow-hidden flex flex-col justify-end p-0.5">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-amber-400 rounded-full transition-all duration-100"
                    style={{ height: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reel Control Button for Mobile */}
            <button
              onMouseDown={() => { isHoldingRef.current = true; }}
              onMouseUp={() => { isHoldingRef.current = false; }}
              onTouchStart={() => { isHoldingRef.current = true; }}
              onTouchEnd={() => { isHoldingRef.current = false; }}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm shadow-lg transition"
            >
              TAHAN UNTUK MENARIK
            </button>
          </div>
        )}

        {gameState === 'success' && (
          <div className="py-6 flex flex-col items-center gap-2">
            <div className="text-5xl animate-bounce">🎉</div>
            <p className="text-base font-bold text-emerald-400">IKAN BERHASIL DITANGKAP!</p>
          </div>
        )}

        {gameState === 'failed' && (
          <div className="py-6 flex flex-col items-center gap-2">
            <div className="text-5xl">💨</div>
            <p className="text-base font-bold text-rose-400">Ikan Lepas!</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-semibold"
        >
          Tutup
        </button>
      </motion.div>
    </div>
  );
};
