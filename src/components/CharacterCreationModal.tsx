// Character Customizer & New Game Creator
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PlayerAppearance } from '../types/game';
import { sound } from '../systems/sound';
import { Sparkles, User, Palette, Check } from 'lucide-react';

interface CharacterCreationModalProps {
  isOpen: boolean;
  initialAppearance: PlayerAppearance;
  onConfirm: (appearance: PlayerAppearance) => void;
}

const SKIN_COLORS = ['#ffe1b4', '#f0c396', '#cd9b6e', '#a87048', '#825534', '#f8eee1'];
const HAIR_COLORS = ['#3a2612', '#1c160c', '#d2b262', '#bc3e2a', '#9b9491', '#e4ded7'];
const SHIRT_COLORS = ['#32b94b', '#c33232', '#3750c3', '#ebda34', '#7a37c6', '#da822d', '#eb73af', '#30cdc3'];
const PANTS_COLORS = ['#5880c3', '#735230', '#2d2837', '#807a87'];
const HATS = ['Topi Jerami Tani', 'Topi Petualang Karsa', 'Kopiah Desa', 'Ikat Kepala Biru', 'Tanpa Topi'];

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  initialAppearance,
  onConfirm,
}) => {
  const [appearance, setAppearance] = useState<PlayerAppearance>(initialAppearance);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-2 border-amber-600/80 rounded-3xl p-6 shadow-2xl max-w-lg w-full flex flex-col gap-5 text-stone-100"
      >
        {/* Header */}
        <div className="text-center">
          <span className="text-4xl animate-bounce inline-block">🌾</span>
          <h2 className="text-xl font-black text-amber-300 font-serif tracking-wider mt-1">
            LEMBAH KARSA 3D
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">Kustomisasi Karakter Petani & Petualang</p>
        </div>

        {/* Character Avatar Live Preview */}
        <div className="flex flex-col items-center justify-center bg-stone-950/80 border border-stone-800 rounded-2xl p-4">
          <div className="relative w-24 h-24 rounded-2xl bg-stone-900 border-2 border-amber-600/40 flex flex-col items-center justify-center shadow-inner overflow-hidden">
            {/* Live Visual representation */}
            <div
              className="w-10 h-10 rounded-full border-2 border-stone-950"
              style={{ backgroundColor: SKIN_COLORS[appearance.skinIndex % SKIN_COLORS.length] }}
            />
            <div
              className="w-12 h-6 rounded-t-lg -mt-1 border border-stone-950"
              style={{ backgroundColor: SHIRT_COLORS[appearance.shirtIndex % SHIRT_COLORS.length] }}
            />
            <div
              className="w-10 h-4 rounded-b -mt-0.5"
              style={{ backgroundColor: PANTS_COLORS[appearance.pantsIndex % PANTS_COLORS.length] }}
            />
          </div>
          <span className="text-xs font-bold text-amber-300 mt-2">{appearance.name || 'Petani Karsa'}</span>
          <span className="text-[10px] text-stone-400">{HATS[appearance.hatIndex % HATS.length]}</span>
        </div>

        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" /> Nama Petani:
          </label>
          <input
            type="text"
            value={appearance.name}
            onChange={(e) => setAppearance({ ...appearance, name: e.target.value })}
            maxLength={14}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-100 font-semibold focus:outline-none focus:border-amber-500 transition"
            placeholder="Masukkan nama..."
          />
        </div>

        {/* Customization Selectors */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Skin */}
          <div>
            <label className="text-[11px] font-bold text-stone-400 block mb-1">Warna Kulit:</label>
            <div className="flex items-center gap-1.5">
              {SKIN_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { sound.playClick(); setAppearance({ ...appearance, skinIndex: i }); }}
                  className={`w-6 h-6 rounded-full border-2 transition ${appearance.skinIndex === i ? 'border-amber-400 scale-110' : 'border-stone-700'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Hair */}
          <div>
            <label className="text-[11px] font-bold text-stone-400 block mb-1">Warna Rambut:</label>
            <div className="flex items-center gap-1.5">
              {HAIR_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { sound.playClick(); setAppearance({ ...appearance, hairIndex: i }); }}
                  className={`w-6 h-6 rounded-full border-2 transition ${appearance.hairIndex === i ? 'border-amber-400 scale-110' : 'border-stone-700'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Shirt */}
          <div>
            <label className="text-[11px] font-bold text-stone-400 block mb-1">Warna Baju:</label>
            <div className="flex items-center gap-1.5">
              {SHIRT_COLORS.slice(0, 5).map((c, i) => (
                <button
                  key={i}
                  onClick={() => { sound.playClick(); setAppearance({ ...appearance, shirtIndex: i }); }}
                  className={`w-6 h-6 rounded-md border-2 transition ${appearance.shirtIndex === i ? 'border-amber-400 scale-110' : 'border-stone-700'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Hat */}
          <div>
            <label className="text-[11px] font-bold text-stone-400 block mb-1">Topi / Penutup Kepala:</label>
            <select
              value={appearance.hatIndex}
              onChange={(e) => setAppearance({ ...appearance, hatIndex: Number(e.target.value) })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              {HATS.map((h, i) => (
                <option key={i} value={i}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={() => {
            sound.playHarvest();
            onConfirm(appearance);
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-stone-950 font-black text-sm tracking-wide shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          MULAI BERKEBUN & BERPETUALANG
        </button>
      </motion.div>
    </div>
  );
};
