// ─── HARVEST MOON: A WONDERFUL LIFE 3D - HARVEST SPRITES MODAL ───
import React, { useState } from 'react';
import { Sparkles, X, Heart, Utensils, Sun } from 'lucide-react';

interface AWLHarvestSpritesModalProps {
  onClose: () => void;
  onReceiveSpriteBlessing: () => void;
  stamina: number;
}

export const AWLHarvestSpritesModal: React.FC<AWLHarvestSpritesModalProps> = ({
  onClose,
  onReceiveSpriteBlessing,
  stamina,
}) => {
  const [activeSprite, setActiveSprite] = useState<'nic' | 'nak' | 'flak'>('nak');

  const spriteData = {
    nic: {
      name: 'Nic',
      hatColor: 'text-blue-400',
      bgColor: 'bg-blue-950/80 border-blue-500',
      emoji: '🍄',
      title: 'Kurcaci Bertopi Biru (Ahli Cuaca & Ternak)',
      quote:
        'Lonceng di dekat lumbung adalah benda magis, petani muda! Saat matahari bersinar cerah, bunyikan agar sapi Betsy dan domba Shaun memakan rumput padang rumput gratis tanpa menghabiskan pakan fodder!',
    },
    nak: {
      name: 'Nak',
      hatColor: 'text-red-400',
      bgColor: 'bg-rose-950/80 border-rose-500',
      emoji: '🍓',
      title: 'Kurcaci Bertopi Merah (Pemimpin Roh Melati)',
      quote:
        'Selamat datang di pohon keramat kami! Jangan lupa, gadis-gadis lembah seperti Celia, Nami, dan Muffy sangat menyukai hadiah yang sesuai dengan sifat mereka. Jika kau menemukan Bulu Biru, sebuah kisah cinta abadi akan bermula!',
    },
    flak: {
      name: 'Flak',
      hatColor: 'text-amber-400',
      bgColor: 'bg-amber-950/80 border-amber-500',
      emoji: '✨',
      title: 'Kurcaci Bertopi Kuning (Koki & Hibrida)',
      quote:
        'Di rumah Takakura ada Tartan, tanaman berkepala dua! Berikan dua bibit sayur berbeda padanya, misalnya Tomat dan Melon, maka ia akan menciptakan varietas tanaman langka baru yang sangat mahal harganya di pasaran!',
    },
  };

  const current = spriteData[activeSprite];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg bg-stone-950 border-2 border-cyan-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-600 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🧚‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-cyan-200">Tiga Kurcaci Harvest Sprites</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold">
                  Roh Penjaga Lembah ✨
                </span>
              </div>
              <span className="text-xs text-stone-400">Pohon Keramat Mata Air Dewi • Forget-Me-Not Valley</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sprite Selector Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {(['nic', 'nak', 'flak'] as const).map((id) => {
            const s = spriteData[id];
            const isSel = activeSprite === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSprite(id)}
                className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 font-black text-xs transition ${
                  isSel
                    ? `${s.bgColor} shadow-lg scale-105`
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <span>{s.emoji}</span>
                <span className={s.hatColor}>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Speech Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-2 shadow-inner">
          <span className="text-xs font-bold text-stone-400">{current.title}</span>
          <p className="text-xs text-stone-200 leading-relaxed italic bg-stone-950 p-3 rounded-xl border border-stone-800/80">
            "{current.quote}"
          </p>
        </div>

        {/* Blessing Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={onReceiveSpriteBlessing}
            className="flex-1 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-xl active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Minta Berkah Roh Dewi (+20 Energi)
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs transition border border-stone-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
