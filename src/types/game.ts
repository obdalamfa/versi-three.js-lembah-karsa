// Global Type Definitions for Lembah Karsa 3D

export type Season = 'Semi' | 'Panas' | 'Gugur' | 'Dingin';
export type Weather = 'Cerah' | 'Hujan' | 'Badai' | 'Bersalju';
export type ToolType = 'cangkul' | 'siram' | 'tanam' | 'sabit' | 'kapak' | 'beliung' | 'pedang' | 'pancing' | 'tangan';
export type ToolTier = 'Kayu' | 'Tembaga' | 'Besi' | 'Emas' | 'Mithril';

export interface SoilTile {
  x: number;
  y: number;
  tilled: boolean;
  watered: boolean;
  cropId?: string;
  age: number;
  kering: number;
  layu?: boolean;
  mati?: boolean;
  siap?: boolean;
  buah_t?: number;
  petik?: number;
  isTree?: boolean;
}

export interface CropSpec {
  id: string;
  name: string;
  kind: 'sayur' | 'palawija' | 'padi' | 'pohon';
  days: number;
  sell: number;
  cost: number;
  seasons: Season[];
  air: 'tinggi' | 'sedang' | 'rendah';
  hasil: number;
  tumbuh_lagi: number;
  petik: number;
  is_tree?: boolean;
  panen_tiap?: number;
  musim_buah?: Season[];
  color: string;
  fruitColor: string;
  desc: string;
}

export interface ItemDef {
  id: string;
  name: string;
  category: 'crop' | 'seed' | 'tree_seed' | 'animal_product' | 'processed' | 'mineral' | 'forage' | 'fish' | 'tool' | 'misc';
  sellPrice: number;
  buyPrice?: number;
  icon: string;
  description: string;
  healHp?: number;
  healEnergy?: number;
  isShippable?: boolean;
}

export interface AnimalCare {
  id: string;
  name: string;
  type: string;
  speciesLabel: string;
  kenyang: number;
  air: number;
  bersih: number;
  produk_t: number;
  produk_siap: boolean;
  lalai: number;
  sakit: boolean;
  sembuh_t: number;
  hari_makan: number;
  hari_minum: number;
  hari_bersih: number;
  hearts: number;
  x: number;
  y: number;
}

export interface MotivesData {
  lapar: number;   // -100 to 100
  nyaman: number;
  higiene: number;
  kandung: number;
  energi: number;
  senang: number;
  sosial: number;
  ruang: number;
  asleep: boolean;
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  personality: string;
  hearts: number;
  talkedToday: boolean;
  giftedToday: boolean;
  birthday?: { season: Season; day: number };
  schedule: { [hour: number]: { scene: string; x: number; y: number } };
  dialogues: {
    greeting: string[];
    highHeart: string[];
    giftLoved: string;
    giftLiked: string;
    giftDisliked: string;
    night: string;
  };
  lovedGifts: string[];
  likedGifts: string[];
}

export type CalendarEventType = 'festival' | 'birthday' | 'season_change';

export interface CalendarEvent {
  id: string;
  title: string;
  season: Season;
  day: number;
  type: CalendarEventType;
  icon: string;
  locationName?: string;
  timeRange?: string;
  description: string;
  npcId?: string;
  rewardsOrGifts?: string[];
  tips?: string;
}

export interface UpcomingEvent extends CalendarEvent {
  daysUntil: number;
  isToday: boolean;
  isTomorrow: boolean;
  relativeYear: number;
}

export interface MonsterEntity {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  color: string;
  exp: number;
  drops: { itemId: string; chance: number }[];
  isBoss?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giver: string;
  rewardGold: number;
  rewardExp: number;
  rewardItem?: { id: string; count: number };
  completed: boolean;
  requiredProgress: number;
  currentProgress: number;
  type: 'crop' | 'fish' | 'mine' | 'monster' | 'talk' | 'cook';
  targetId?: string;
}

export interface PS2VisualSettings {
  enabled: boolean;          // Master PS2 visual mode toggle
  bloomGlow: boolean;        // Iconic Harvest Moon AWL / ICO dreamy diffuse bloom
  crtScanlines: boolean;     // 480i / 480p CRT scanlines and phosphor aperture
  gsDither: boolean;         // PlayStation 2 Graphics Synthesizer 16-bit Bayer dither
  celOutlines: boolean;      // Inverted-hull Dragon Quest VIII / Dark Cloud 2 toon silhouette
  colorWarmth: number;       // 0.0 to 1.0 (warm nostalgia color grading)
  vignette: boolean;         // Analog TV tube soft edge falloff
  dualShockPrompts: boolean; // Classic PS2 controller glyphs (✕, ◯, ▢, △, L1, R1)
}

export interface PlayerAppearance {
  name: string;
  skinIndex: number;
  hairIndex: number;
  shirtIndex: number;
  pantsIndex: number;
  hatIndex: number;
}

export interface GameState {
  player: {
    name: string;
    x: number;
    y: number;
    scene: string;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    gold: number;
    level: number;
    exp: number;
    appearance: PlayerAppearance;
    activeTool: ToolType;
    toolTiers: Record<ToolType, ToolTier>;
  };
  time: {
    day: number;
    season: Season;
    year: number;
    hour: number;
    minute: number;
    weather: Weather;
    paused: boolean;
  };
  inventory: Record<string, number>;
  shippingBin: Record<string, number>;
  soil: Record<string, SoilTile>; // key: `${scene}_${x}_${y}`
  animals: Record<string, AnimalCare>;
  motives: MotivesData;
  npcs: Record<string, NPCData>;
  quests: Quest[];
  stats: {
    cropsHarvested: number;
    monstersDefeated: number;
    fishCaught: number;
    oresMined: number;
    goldEarned: number;
    produceCollected: number;
  };
  dungeonFloor: number;
  ps2Settings?: PS2VisualSettings;
}

export interface ScenePortal {
  x: number;
  y: number;
  targetScene: string;
  targetX: number;
  targetY: number;
  label?: string;
}

export interface SceneDef {
  id: string;
  name: string;
  width: number;
  height: number;
  layout: number[][];
  indoor: boolean;
  portals: ScenePortal[];
  bgMusic?: string;
  ambientLight?: string;
}
