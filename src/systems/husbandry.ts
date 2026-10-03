// Animal Husbandry Simulation System
import { AnimalCare } from '../types/game';

export interface HusbandryReport {
  hungry: string[];
  sick: string[];
  ready: string[];
}

export const INITIAL_ANIMALS: Record<string, AnimalCare> = {
  sapi_betsy: {
    id: 'sapi_betsy',
    name: 'Betsy',
    type: 'sapi',
    speciesLabel: 'Sapi Perah',
    kenyang: 85,
    air: 90,
    bersih: 95,
    produk_t: 0,
    produk_siap: true,
    lalai: 0,
    sakit: false,
    sembuh_t: 0,
    hari_makan: 1,
    hari_minum: 1,
    hari_bersih: 1,
    hearts: 4,
    x: 12,
    y: 14,
  },
  ayam_kuning: {
    id: 'ayam_kuning',
    name: 'Si Kuning',
    type: 'ayam',
    speciesLabel: 'Ayam Kampung',
    kenyang: 80,
    air: 85,
    bersih: 90,
    produk_t: 0,
    produk_siap: true,
    lalai: 0,
    sakit: false,
    sembuh_t: 0,
    hari_makan: 1,
    hari_minum: 1,
    hari_bersih: 1,
    hearts: 3,
    x: 15,
    y: 13,
  },
  bebek_donald: {
    id: 'bebek_donald',
    name: 'Bebek Karsa',
    type: 'bebek',
    speciesLabel: 'Bebek Petelur',
    kenyang: 75,
    air: 80,
    bersih: 85,
    produk_t: 1,
    produk_siap: false,
    lalai: 0,
    sakit: false,
    sembuh_t: 0,
    hari_makan: 1,
    hari_minum: 1,
    hari_bersih: 1,
    hearts: 3,
    x: 16,
    y: 15,
  },
  kambing_jenggot: {
    id: 'kambing_jenggot',
    name: 'Si Jenggot',
    type: 'kambing',
    speciesLabel: 'Kambing Etawa',
    kenyang: 85,
    air: 85,
    bersih: 90,
    produk_t: 1,
    produk_siap: false,
    lalai: 0,
    sakit: false,
    sembuh_t: 0,
    hari_makan: 1,
    hari_minum: 1,
    hari_bersih: 1,
    hearts: 3,
    x: 13,
    y: 16,
  },
  domba_shaun: {
    id: 'domba_shaun',
    name: 'Shaun',
    type: 'domba',
    speciesLabel: 'Domba Wol',
    kenyang: 80,
    air: 80,
    bersih: 85,
    produk_t: 2,
    produk_siap: false,
    lalai: 0,
    sakit: false,
    sembuh_t: 0,
    hari_makan: 1,
    hari_minum: 1,
    hari_bersih: 1,
    hearts: 2,
    x: 14,
    y: 17,
  },
};

export function tickAnimalsDaily(animals: Record<string, AnimalCare>, currentDay: number): {
  updatedAnimals: Record<string, AnimalCare>;
  report: HusbandryReport;
} {
  const updated: Record<string, AnimalCare> = {};
  const report: HusbandryReport = { hungry: [], sick: [], ready: [] };

  Object.values(animals).forEach((animal) => {
    const a = { ...animal };

    // Daily decay: hunger -45, water -55, cleanliness -30
    a.kenyang = Math.max(0, a.kenyang - 45);
    a.air = Math.max(0, a.air - 55);
    a.bersih = Math.max(0, a.bersih - 30);

    // Check neglect
    if (a.kenyang === 0 || a.air === 0) {
      a.lalai += 1;
      report.hungry.push(a.name);
    } else {
      a.lalai = Math.max(0, a.lalai - 1);
    }

    // Neglect turns into illness after 3 days
    if (a.lalai >= 3 && !a.sakit) {
      a.sakit = true;
      a.sembuh_t = 0;
      a.hearts = Math.max(0, a.hearts - 1);
      report.sick.push(a.name);
    }

    if (a.sakit) {
      if (a.kenyang >= 60 && a.air >= 60 && a.bersih >= 60) {
        a.sembuh_t += 1;
        if (a.sembuh_t >= 2) {
          a.sakit = false;
          a.lalai = 0;
          a.sembuh_t = 0;
        }
      }
    } else {
      // Production progress if well-cared for
      if (a.kenyang >= 40 && a.air >= 30 && a.bersih >= 25) {
        a.produk_t += 1;
        const cycle = a.type === 'domba' ? 4 : a.type === 'kambing' || a.type === 'bebek' ? 2 : 1;
        if (a.produk_t >= cycle && !a.produk_siap) {
          a.produk_siap = true;
          a.produk_t = 0;
          report.ready.push(a.name);
        }
      }
    }

    updated[a.id] = a;
  });

  return { updatedAnimals: updated, report };
}
