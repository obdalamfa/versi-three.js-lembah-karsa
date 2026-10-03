// ─── HARVEST MOON: A WONDERFUL LIFE 3D - TYPES ───

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rainy';

export type ToolType =
  | 'cangkul'      // Hoe
  | 'penyiram'     // Watering Can
  | 'benih'        // Seed Bag
  | 'pemerah'      // Milker
  | 'sikat'        // Animal Brush
  | 'gunting'      // Wool Shears
  | 'sabit'        // Sickle
  | 'pancingan'    // Fishing Rod
  | 'sekop'        // Archaeological Trowel
  | 'bulu_biru';   // Legendary Blue Feather for proposal!

export type CropId =
  | 'tomat'
  | 'semangka'
  | 'melon'
  | 'stroberi'
  | 'jagung'
  | 'gandum'
  | 'kentang'
  | 'ubi_manis';

export interface CropDefinition {
  id: CropId;
  name: string;
  season: Season[];
  growthDays: number;
  stages: number; // 0: seed, 1: sprout, 2: vegetative, 3: flowering, 4: harvest
  buyPrice: number;
  sellPrice: number;
  seedColor: string;
  fruitColor: string;
  leafColor: string;
  description: string;
}

export interface SoilTileState {
  x: number;
  z: number;
  tilled: boolean;
  watered: boolean;
  cropId: CropId | null;
  stage: number;      // 0 to 4
  daysGrown: number;
  isHarvestable: boolean;
}

export type AnimalType = 'sapi' | 'sapi_jersey' | 'domba' | 'kuda' | 'ayam' | 'anjing';

export interface AnimalState {
  id: string;
  name: string;
  type: AnimalType;
  speciesLabel: string;
  hearts: number;         // 0 to 5
  hunger: number;         // 0 to 100
  cleanliness: number;    // 0 to 100
  inPasture: boolean;
  hasProductToday: boolean;
  productQuality: 'B' | 'A' | 'S';
  daysSinceSheared?: number; // for sheep
  isWashed?: boolean;
  position: { x: number; z: number };
}

export interface VillagerState {
  id: string;
  name: string;
  role: string;
  locationLabel: string;
  hearts: number;         // 0 to 5
  dialogueHistory: number;
  isMarriageCandidate?: boolean;
  isMarried?: boolean;
  favoriteGifts: string[];
  dislikedGifts: string[];
  portraitEmoji: string;
  position: { x: number; z: number };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'tool' | 'seed' | 'produce' | 'animal_product' | 'fish' | 'relic' | 'cooked';
  count: number;
  sellPrice: number;
  icon: string;
  description: string;
}

export interface DigSiteRelic {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  sellPrice: number;
  icon: string;
  description: string;
}

export interface DigCell {
  x: number;
  y: number;
  dug: boolean;
  relic: DigSiteRelic | null;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'soup' | 'salad' | 'entree' | 'dessert';
  ingredients: string[]; // item IDs required
  sellPrice: number;
  energyRestore: number;
  icon: string;
  description: string;
}

export interface GameTime {
  day: number;          // 1 to 10 (AWL style 10-day seasons!)
  season: Season;
  year: number;
  hour: number;         // 6 to 24 (6 AM to 12 AM)
  minute: number;       // 0 to 59
  weather: Weather;
  paused: boolean;
}

export interface PlayerStats {
  stamina: number;      // 0 to 100
  maxStamina: number;
  fullness: number;     // 0 to 100
  gold: number;
  cropsHarvested: number;
  milkCollected: number;
  fishCaught: number;
  relicsFound: number;
  daysLived: number;
  isRidingHorse: boolean;
}

export interface AWLGameState {
  chapter: number;
  chapterTitle: string;
  time: GameTime;
  player: {
    x: number;
    z: number;
    rotation: number;
    activeTool: ToolType;
    activeSeed: CropId;
    heldItem: InventoryItem | null;
  };
  stats: PlayerStats;
  soil: Record<string, SoilTileState>; // key: "x_z"
  animals: Record<string, AnimalState>;
  villagers: Record<string, VillagerState>;
  inventory: Record<string, InventoryItem>;
  shippingBin: Record<string, number>; // itemId -> count
  shippingHistory: { day: number; season: Season; totalEarned: number }[];
  currentRecord: string; // track playing on gramophone
}
