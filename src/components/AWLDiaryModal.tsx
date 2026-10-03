// ─── HARVEST MOON: A WONDERFUL LIFE 3D - BEDSIDE DIARY & RECORD PLAYER MODAL ───
import React from 'react';
import { AWLGameState } from '../types/awlTypes';
import { RECORD_TRACKS } from '../data/awlData';
import { Book, Disc, Moon, Save, X } from 'lucide-react';

interface AWLDiaryModalProps {
  state: AWLGameState;
  onClose: () => void;
  onSaveGame: () => void;
  onSleepNextDay: () => void;
  onSelectRecord: (trackId: string) => void;
}

export const AWLDiaryModal: React.FC<AWLDiaryModalProps> = ({
  state,
  onClose,
  onSaveGame,
  onSleepNextDay,
  onSelectRecord,
}) => {
  const { chapterTitle, stats, currentRecord } = state;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-stone-950 border-2 border-amber-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4 max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-2xl shadow-inner">
              📖
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-200">Buku Harian Petani & Gramofon</h2>
              <span className="text-xs text-stone-400">Kamar Tidur Rumah Forget-Me-Not Valley</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Chapter & Journey Milestones */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Book className="w-3.5 h-3.5" /> Bab Kehidupan Saat Ini:
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">Tahun {state.time.year}</span>
            </div>
            <h3 className="text-base font-black text-stone-100">{chapterTitle}</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Hari Dijalani</span>
                <span className="text-sm font-mono font-bold text-amber-300">{stats.daysLived} hari</span>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Hasil Panen</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{stats.cropsHarvested} bh</span>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Susu Diperah</span>
                <span className="text-sm font-mono font-bold text-sky-400">{stats.milkCollected} botol</span>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Fosil Purba</span>
                <span className="text-sm font-mono font-bold text-purple-400">{stats.relicsFound} buah</span>
              </div>
            </div>
          </div>

          {/* Gramophone Record Player */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Disc className="w-3.5 h-3.5 text-amber-400" /> Pemutar Piringan Hitam (Gramofon):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECORD_TRACKS.map((track) => {
                const isPlaying = currentRecord === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => onSelectRecord(track.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isPlaying
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-900'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span className={isPlaying ? 'animate-spin' : ''}>💿</span> {track.title}
                      </div>
                      <span className="text-[10px] text-stone-400">{track.mood}</span>
                    </div>
                    {isPlaying && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-bold">
                        Memutar
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save & Sleep Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onSaveGame}
              className="py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
            >
              <Save className="w-4 h-4" /> Catat di Buku Harian (Simpan)
            </button>

            <button
              onClick={onSleepNextDay}
              className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
            >
              <Moon className="w-4 h-4" /> Tidur Hingga Pagi (Jam 06:00)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
