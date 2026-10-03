// Farming & Crops System
import { SoilTile, Season } from '../types/game';
import { CROPS } from '../data/gameData';

export interface FarmReport {
  ready: number;
  wilted: number;
  dead: number;
}

export function tickSoilDaily(
  soil: Record<string, SoilTile>,
  season: Season
): { updatedSoil: Record<string, SoilTile>; report: FarmReport } {
  const updated: Record<string, SoilTile> = {};
  const report: FarmReport = { ready: 0, wilted: 0, dead: 0 };

  Object.entries(soil).forEach(([key, tile]) => {
    const t = { ...tile };

    if (!t.cropId) {
      // Empty tilled soil might dry out
      t.watered = false;
      updated[key] = t;
      return;
    }

    const crop = CROPS[t.cropId];
    if (!crop) {
      updated[key] = t;
      return;
    }

    const wasWatered = t.watered;
    t.watered = false; // Reset for next day

    if (t.mati) {
      updated[key] = t;
      return;
    }

    if (crop.is_tree) {
      // Tree logic
      const matureAge = crop.days;
      if (t.age < matureAge) {
        // Sapling phase: needs water
        if (!wasWatered) {
          t.kering = (t.kering || 0) + 1;
          if (t.kering > 4) {
            t.mati = true;
            report.dead++;
          } else if (t.kering > 2) {
            t.layu = true;
            report.wilted++;
          }
        } else {
          t.kering = 0;
          t.layu = false;
          t.age += 1;
          if (t.age >= matureAge) {
            t.siap = true;
            report.ready++;
          }
        }
      } else {
        // Mature tree: never dies of drought, fruits periodically in-season
        t.kering = 0;
        t.layu = false;
        const inFruitSeason = !crop.musim_buah?.length || crop.musim_buah.includes(season);
        if (inFruitSeason && !t.siap) {
          t.buah_t = (t.buah_t || 0) + 1;
          if (t.buah_t >= (crop.panen_tiap || 3)) {
            t.siap = true;
            t.buah_t = 0;
            report.ready++;
          }
        }
      }
    } else {
      // Regular crop
      if (!wasWatered) {
        t.kering = (t.kering || 0) + 1;
        const tolerance = crop.air === 'tinggi' ? 1 : crop.air === 'sedang' ? 2 : 3;
        if (t.kering > tolerance + 2) {
          t.mati = true;
          t.layu = false;
          report.dead++;
        } else if (t.kering > tolerance) {
          t.layu = true;
          report.wilted++;
        }
      } else {
        t.kering = 0;
        if (t.layu) {
          t.layu = false;
          // Recovering day: no growth today
        } else {
          const inSeason = crop.seasons.includes(season);
          t.age += inSeason ? 2 : 1; // Double growth speed in optimal season!
          if (t.age >= crop.days && !t.siap) {
            t.siap = true;
            report.ready++;
          }
        }
      }
    }

    updated[key] = t;
  });

  return { updatedSoil: updated, report };
}
