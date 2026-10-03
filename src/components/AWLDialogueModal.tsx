// ─── HARVEST MOON: A WONDERFUL LIFE 3D - VILLAGER DIALOGUE MODAL ───
import React, { useState } from 'react';
import { VillagerState, InventoryItem } from '../types/awlTypes';
import { Heart, Gift, Sparkles, X } from 'lucide-react';

interface AWLDialogueModalProps {
  villager: VillagerState;
  inventory: Record<string, InventoryItem>;
  onClose: () => void;
  onGiveGift: (itemId: string) => void;
  onPropose: () => void;
  hasBlueFeather: boolean;
}

export const AWLDialogueModal: React.FC<AWLDialogueModalProps> = ({
  villager,
  inventory,
  onClose,
  onGiveGift,
  onPropose,
  hasBlueFeather,
}) => {
  const [showGiftSelector, setShowGiftSelector] = useState(false);

  // Scripted dialogues based on villager personality and heart level
  const getDialogueText = () => {
    if (villager.id === 'celia') {
      if (villager.hearts >= 4) {
        return 'Setiap kali melihatmu datang melintasi jembatan sungai, hatiku terasa sangat berbunga-bunga... Maukah kau menghabiskan masa depan bersama di lembah ini?';
      } else if (villager.hearts >= 2) {
        return 'Halo! Ladang Vesta hari ini sangat subur. Bagaimana dengan tanaman tomatmu di seberang sana? Jika butuh bibit baru, mampirlah ke rumah kaca kami ya!';
      }
      return 'Selamat pagi petani baru! Senang rasanya memiliki tetangga muda yang merawat tanah peninggalan ayahnya dengan penuh kasih sayang.';
    }

    if (villager.id === 'nami') {
      if (villager.hearts >= 4) {
        return 'Aku selalu berpikir lembah ini hanyalah tempat singgah sementaraku... tapi sejak mengenalmu, aku mulai merasa ingin menetap selamanya di sini.';
      } else if (villager.hearts >= 2) {
        return 'Angin di pesisir pantai hari ini sangat sejuk. Aku suka suasana tenang di lembah ini, tidak bising seperti kota tempat asalku.';
      }
      return '...Ada apa? Aku sedang menikmati kesendirian dan mencatat sesuatu di buku harianku.';
    }

    if (villager.id === 'muffy') {
      if (villager.hearts >= 4) {
        return 'Hihi! Kau tahu tidak? Setiap malam di Blue Bar aku selalu menatap ke arah peternakanmu dan berharap kau mampir berkunjung untuk menemaniku!';
      } else if (villager.hearts >= 2) {
        return 'Pekerjaan di kebun pasti melelahkan ya? Kalau haus, datanglah ke Blue Bar nanti malam, Griffin punya racikan jus segar yang manis!';
      }
      return 'Halo petani tampan! Selamat datang di Forget-Me-Not Valley. Jangan lupa luangkan waktu bersantai di barmu yang nyaman ya!';
    }

    if (villager.id === 'takakura') {
      return 'Ayahmu adalah pria yang luar biasa. Melihat caramu merawat sapi Betsy dan mencangkul tanah membuatku bangga. Setiap jam 5 sore, aku akan mengambil hasil panenmu di kotak pengiriman!';
    }

    if (villager.id === 'carter') {
      return 'Ah! Rekan penggali mudaku! Situs purba di gua utara menyimpan banyak rahasia peradaban kuno lembah. Gunakan sekopmu di parit galian untuk menemukan fosil dan artefak emas!';
    }

    if (villager.id === 'vesta') {
      return 'Hahaha! Semangat bertani yang luar biasa! Tanaman membutuhkan dua hal: air segar dan cinta dari petaninya. Jangan ragu bertanya padaku soal bibit sayur!';
    }

    return 'Selamat datang di lembah! Suasana damai di sini adalah surga sejati bagi siapa pun yang mencintai alam.';
  };

  const giftableItems = Object.values(inventory).filter(
    (item) => item.category !== 'tool' && item.count > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-stone-950 border-2 border-amber-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4">
        {/* Header with portrait and hearts */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-950 border-2 border-amber-600/70 flex items-center justify-center text-3xl shadow-inner">
              {villager.portraitEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-amber-200 tracking-tight">{villager.name}</h3>
                {villager.isMarriageCandidate && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300 font-bold">
                    Kandidat Pasangan 💍
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400">{villager.role} • {villager.locationLabel}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Heart Affection Meter */}
        <div className="flex items-center justify-between bg-stone-900/80 px-4 py-2 rounded-2xl border border-stone-800">
          <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Kasih Sayang & Persahabatan:
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg transition-transform ${
                  i < villager.hearts
                    ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : 'text-stone-700'
                }`}
              >
                ♥
              </span>
            ))}
          </div>
        </div>

        {/* Main Dialogue Speech Box */}
        <div className="bg-amber-950/20 border border-amber-900/60 rounded-2xl p-4 text-stone-200 text-sm leading-relaxed min-h-[90px] font-medium shadow-inner italic">
          "{getDialogueText()}"
        </div>

        {/* Gift Selector Sub-panel */}
        {showGiftSelector && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Pilih Hadiah dari Tasmu:
            </span>
            {giftableItems.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2 text-center">
                Tasmu kosong dari barang yang bisa dihadiahkan (Panen hasil kebun, susu, atau fosil).
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {giftableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onGiveGift(item.id);
                      setShowGiftSelector(false);
                    }}
                    className="p-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500 text-left flex items-center gap-2 transition hover:bg-stone-900"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">Sisa: {item.count}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={() => setShowGiftSelector((prev) => !prev)}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
          >
            <Gift className="w-4 h-4" /> {showGiftSelector ? 'Batal Beri Hadiah' : 'Beri Hadiah'}
          </button>

          {villager.isMarriageCandidate && villager.hearts >= 4 && (
            <button
              onClick={onPropose}
              disabled={!hasBlueFeather}
              className={`py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                hasBlueFeather
                  ? 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse'
                  : 'bg-stone-900 text-stone-500 border border-stone-800 cursor-not-allowed'
              }`}
              title={hasBlueFeather ? 'Lamar dengan Bulu Biru!' : 'Butuh Bulu Biru (Beli dari Van)'}
            >
              <Sparkles className="w-4 h-4 text-cyan-300" /> Lamar (Bulu Biru)
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs transition border border-stone-800"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
