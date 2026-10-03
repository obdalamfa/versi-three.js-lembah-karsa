// The Sims 1 Inspired 8-Motive Simulation Engine
import { MotivesData } from '../types/game';

export type NumericMotiveKey = keyof Omit<MotivesData, 'asleep'>;

export const MOTIVE_KEYS: NumericMotiveKey[] = [
  'lapar', 'nyaman', 'higiene', 'kandung', 'energi', 'senang', 'sosial', 'ruang'
];

export const MOTIVE_NAMES: Record<keyof MotivesData, string> = {
  lapar: 'Lapar',
  nyaman: 'Kenyamanan',
  higiene: 'Higiene',
  kandung: 'Kamar Kecil',
  energi: 'Energi',
  senang: 'Kesenangan',
  sosial: 'Sosial',
  ruang: 'Ruangan',
  asleep: 'Tidur',
};

// Rates of decay per in-game minute
const HUNGER_BASE_RATE = 0.003;
const COMFORT_RATE = 0.025;
const HYGIENE_RATE = 0.015;
const BLADDER_RATE = 0.020;
const ENERGY_AWAKE_RATE = 0.022;
const ENERGY_SLEEP_GAIN = 0.12;
const FUN_RATE = 0.018;
const SOCIAL_RATE = 0.008;

export function createInitialMotives(): MotivesData {
  return {
    lapar: 70,
    nyaman: 80,
    higiene: 90,
    kandung: 85,
    energi: 90,
    senang: 65,
    sosial: 60,
    ruang: 75,
    asleep: false,
  };
}

export function tickMotives(motives: MotivesData, deltaSimMinutes: number): MotivesData {
  const m = { ...motives };

  if (m.asleep) {
    // Sleeping restores energy, slows bladder/hygiene, pauses fun
    m.energi = Math.min(100, m.energi + ENERGY_SLEEP_GAIN * deltaSimMinutes);
    m.higiene = Math.max(-100, m.higiene - HYGIENE_RATE * 0.4 * deltaSimMinutes);
    m.kandung = Math.max(-100, m.kandung - BLADDER_RATE * 0.5 * deltaSimMinutes);
    m.nyaman = Math.min(100, m.nyaman + 0.05 * deltaSimMinutes);
    m.lapar = Math.max(-100, m.lapar - 0.01 * deltaSimMinutes);
  } else {
    // Awake decay
    // Non-linear hunger decay: drops faster when full, slower when starving
    const hungerDecay = HUNGER_BASE_RATE * (100 + m.lapar) * deltaSimMinutes;
    m.lapar = Math.max(-100, m.lapar - hungerDecay);

    // Eating/fullness accelerates bladder
    const bladderCoupling = m.lapar > 0 ? 1.3 : 1.0;
    m.kandung = Math.max(-100, m.kandung - BLADDER_RATE * bladderCoupling * deltaSimMinutes);

    m.nyaman = Math.max(-100, m.nyaman - COMFORT_RATE * deltaSimMinutes);
    m.higiene = Math.max(-100, m.higiene - HYGIENE_RATE * deltaSimMinutes);
    m.energi = Math.max(-100, m.energi - ENERGY_AWAKE_RATE * deltaSimMinutes);
    m.senang = Math.max(-100, m.senang - FUN_RATE * deltaSimMinutes);
    m.sosial = Math.max(-100, m.sosial - SOCIAL_RATE * deltaSimMinutes);
  }

  return m;
}

export function calculateMood(motives: MotivesData): number {
  const sum =
    motives.lapar +
    motives.nyaman +
    motives.higiene +
    motives.kandung +
    motives.energi +
    motives.senang +
    motives.sosial +
    motives.ruang;
  return Math.round(sum / 8);
}

export function getMotiveColor(value: number): string {
  if (value > 40) return 'text-emerald-400 bg-emerald-500';
  if (value > -20) return 'text-amber-400 bg-amber-500';
  return 'text-rose-400 bg-rose-500';
}
