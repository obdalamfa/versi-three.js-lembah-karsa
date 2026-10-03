// Contextual Action Pie Menu for clicking Objects / Animals / NPCs
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../systems/sound';

export interface PieAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  onSelect: () => void;
}

interface ActionPieMenuProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  actions: PieAction[];
  onClose: () => void;
}

export const ActionPieMenu: React.FC<ActionPieMenuProps> = ({
  isOpen,
  title,
  subtitle,
  actions,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="relative bg-stone-900 border border-amber-600/60 rounded-3xl p-5 shadow-2xl max-w-sm w-full text-center"
          >
            {/* Title */}
            <h3 className="text-lg font-bold text-amber-200">{title}</h3>
            {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {actions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => {
                    sound.playClick();
                    act.onSelect();
                    onClose();
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-md ${act.color}`}
                >
                  <span className="text-2xl">{act.icon}</span>
                  <span className="font-semibold text-xs tracking-wide">{act.label}</span>
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="mt-4 w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
            >
              Batal
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
