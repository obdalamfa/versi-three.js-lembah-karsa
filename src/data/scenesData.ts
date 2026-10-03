// Map Layouts and Scene Definitions for Lembah Karsa 3D
import { SceneDef } from '../types/game';

// Tile Legend Constants
export const TILES = {
  GRASS: 0,
  DIRT: 1,
  WATER: 2,
  PATH: 3,
  WOOD_FLOOR: 4,
  WALL: 5,
  FENCE: 6,
  ROCK: 7,
  TREE: 8,
  DOOR: 9,
  BED: 10,
  TABLE: 11,
  COUNTER: 12,
  STOVE: 13,
  SHELF: 14,
  WELL: 15,
  SHIPPING_BIN: 16,
  CAVE_WALL: 17,
  SAND: 18,
  DOCK: 19,
  TOMB: 20,
  CLOUD: 21,
  ORE_COPPER: 22,
  ORE_IRON: 23,
  ORE_GOLD: 24,
  ORE_MITHRIL: 25,
  CRYSTAL: 26,
  STAIRS_DOWN: 27,
  STAIRS_UP: 28,
  ANVIL: 29,
  SHRINE: 30,
  LAVA: 31,
  PALM_TREE: 32,
  MOAI_STATUE: 33,
  MAGLEV_RAIL: 34,
  CORAL_REEF: 35,
  JEWEL_CREST: 36,
  WATERFALL: 37,
  LAB_CONSOLE: 38,
  LIFE_POD: 39,
  DEEP_WATER: 40,
};

const G = TILES.GRASS;
const D = TILES.DIRT;
const W = TILES.WATER;
const P = TILES.PATH;
const F = TILES.WOOD_FLOOR;
const L = TILES.WALL;
const FC = TILES.FENCE;
const R = TILES.ROCK;
const T = TILES.TREE;
const DR = TILES.DOOR;
const BD = TILES.BED;
const TB = TILES.TABLE;
const CT = TILES.COUNTER;
const ST = TILES.STOVE;
const SH = TILES.SHELF;
const WL = TILES.WELL;
const SB = TILES.SHIPPING_BIN;
const CW = TILES.CAVE_WALL;
const SD = TILES.SAND;
const DK = TILES.DOCK;
const TM = TILES.TOMB;
const CD = TILES.CLOUD;
const OC = TILES.ORE_COPPER;
const OI = TILES.ORE_IRON;
const OG = TILES.ORE_GOLD;
const OM = TILES.ORE_MITHRIL;
const CR = TILES.CRYSTAL;
const STD = TILES.STAIRS_DOWN;
const STU = TILES.STAIRS_UP;
const AV = TILES.ANVIL;
const SN = TILES.SHRINE;
const LV = TILES.LAVA;
const PL = TILES.PALM_TREE;
const MO = TILES.MOAI_STATUE;
const MR = TILES.MAGLEV_RAIL;
const CL = TILES.CORAL_REEF;
const JC = TILES.JEWEL_CREST;
const WF = TILES.WATERFALL;
const LC = TILES.LAB_CONSOLE;
const LP = TILES.LIFE_POD;
const DW = TILES.DEEP_WATER;

// Helper to create empty grid
function createGrid(w: number, h: number, fill: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

// 1. Farm: Kebun Paman Arsa (32x24)
function buildFarm(): SceneDef {
  const w = 32, h = 24;
  const grid = createGrid(w, h, G);

  // Border trees
  for (let x = 0; x < w; x++) { grid[0][x] = T; grid[h - 1][x] = T; }
  for (let y = 0; y < h; y++) { grid[y][0] = T; grid[y][w - 1] = T; }

  // House footprint (top-left)
  for (let y = 2; y <= 6; y++) {
    for (let x = 4; x <= 10; x++) {
      grid[y][x] = (y === 2 || y === 6 || x === 4 || x === 10) ? L : F;
    }
  }
  grid[6][7] = DR; // Door to house

  // Greenhouse footprint (top-right)
  for (let y = 2; y <= 6; y++) {
    for (let x = 22; x <= 28; x++) {
      grid[y][x] = (y === 2 || y === 6 || x === 22 || x === 28) ? L : F;
    }
  }
  grid[6][25] = DR; // Door to greenhouse

  // Well & Shipping Bin near house
  grid[7][4] = WL;
  grid[7][10] = SB;

  // Farm dirt plots (center & south)
  for (let y = 10; y <= 19; y++) {
    for (let x = 5; x <= 14; x++) {
      grid[y][x] = D;
    }
  }
  for (let y = 10; y <= 19; y++) {
    for (let x = 18; x <= 27; x++) {
      grid[y][x] = D;
    }
  }

  // Paths connecting areas
  for (let y = 7; y <= 22; y++) grid[y][15] = P;
  for (let y = 7; y <= 22; y++) grid[y][16] = P;
  for (let x = 7; x <= 25; x++) grid[8][x] = P;

  // Fences around animal pasture (bottom center)
  for (let x = 14; x <= 17; x++) {
    grid[20][x] = P;
  }

  // East Portal to Town
  grid[12][w - 1] = P;
  grid[13][w - 1] = P;

  // South Portal to Beach
  grid[h - 1][15] = P;
  grid[h - 1][16] = P;

  // West Maglev Station to Dr Hope's Lab (Innocent Life)
  grid[8][2] = MR; grid[8][3] = MR;

  return {
    id: 'farm',
    name: 'Kebun Paman Arsa',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 7, y: 6, targetScene: 'house', targetX: 7, targetY: 9, label: 'Masuk Rumah' },
      { x: 25, y: 6, targetScene: 'greenhouse', targetX: 7, targetY: 10, label: 'Rumah Kaca' },
      { x: w - 1, y: 12, targetScene: 'town', targetX: 1, targetY: 12, label: 'Ke Desa Karsa' },
      { x: w - 1, y: 13, targetScene: 'town', targetX: 1, targetY: 13, label: 'Ke Desa Karsa' },
      { x: 15, y: h - 1, targetScene: 'beach', targetX: 15, targetY: 1, label: 'Ke Pantai Selatan' },
      { x: 16, y: h - 1, targetScene: 'beach', targetX: 16, targetY: 1, label: 'Ke Pantai Selatan' },
      { x: 2, y: 8, targetScene: 'lab_hope', targetX: 15, targetY: 13, label: 'Rel Maglev ke Lab Dr. Hope' },
    ],
  };
}

// 2. Town: Desa Karsa (36x28)
function buildTown(): SceneDef {
  const w = 36, h = 28;
  const grid = createGrid(w, h, G);

  // Border trees
  for (let x = 0; x < w; x++) { grid[0][x] = T; grid[h - 1][x] = T; }
  for (let y = 0; y < h; y++) { grid[y][0] = T; grid[y][w - 1] = T; }

  // Main Town Square Cobblestone Plaza (center)
  for (let y = 10; y <= 18; y++) {
    for (let x = 12; x <= 24; x++) {
      grid[y][x] = P;
    }
  }

  // Central Fountain
  grid[13][17] = W; grid[13][18] = W; grid[13][19] = W;
  grid[14][17] = W; grid[14][18] = W; grid[14][19] = W;
  grid[15][17] = W; grid[15][18] = W; grid[15][19] = W;

  // Shop Bu Sari (NW: x: 3..10, y: 3..8)
  for (let y = 3; y <= 8; y++) {
    for (let x = 3; x <= 10; x++) {
      grid[y][x] = (y === 3 || y === 8 || x === 3 || x === 10) ? L : F;
    }
  }
  grid[8][6] = DR;

  // Clinic Pak Raka (NE: x: 25..32, y: 3..8)
  for (let y = 3; y <= 8; y++) {
    for (let x = 25; x <= 32; x++) {
      grid[y][x] = (y === 3 || y === 8 || x === 25 || x === 32) ? L : F;
    }
  }
  grid[8][28] = DR;

  // Smithy Bengkel Budi (SW: x: 3..10, y: 20..25)
  for (let y = 20; y <= 25; y++) {
    for (let x = 3; x <= 10; x++) {
      grid[y][x] = (y === 20 || y === 25 || x === 3 || x === 10) ? L : F;
    }
  }
  grid[20][7] = DR;

  // Studio Maya (SE: x: 25..32, y: 20..25)
  for (let y = 20; y <= 25; y++) {
    for (let x = 25; x <= 32; x++) {
      grid[y][x] = (y === 20 || y === 25 || x === 25 || x === 32) ? L : F;
    }
  }
  grid[20][28] = DR;

  // Path Network
  for (let x = 0; x <= w - 1; x++) { grid[14][x] = P; grid[15][x] = P; }
  for (let y = 0; y <= h - 1; y++) { grid[y][18] = P; grid[y][19] = P; }

  // Exits: West (Farm), North (Mountain/Dungeon), East (Lake), South (Cemetery)
  return {
    id: 'town',
    name: 'Desa Karsa',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 0, y: 14, targetScene: 'farm', targetX: 30, targetY: 12, label: 'Ke Kebun' },
      { x: 0, y: 15, targetScene: 'farm', targetX: 30, targetY: 13, label: 'Ke Kebun' },
      { x: 6, y: 8, targetScene: 'shop', targetX: 7, targetY: 9, label: 'Warung Bu Sari' },
      { x: 28, y: 8, targetScene: 'clinic', targetX: 7, targetY: 9, label: 'Klinik Pak Raka' },
      { x: 7, y: 20, targetScene: 'smith', targetX: 7, targetY: 9, label: 'Bengkel Budi' },
      { x: 28, y: 20, targetScene: 'studio', targetX: 7, targetY: 9, label: 'Studio Maya' },
      { x: 18, y: 0, targetScene: 'mountain', targetX: 16, targetY: 22, label: 'Ke Lereng Gunung' },
      { x: 19, y: 0, targetScene: 'mountain', targetX: 17, targetY: 22, label: 'Ke Lereng Gunung' },
      { x: w - 1, y: 14, targetScene: 'lake', targetX: 1, targetY: 14, label: 'Ke Danau Karsa' },
      { x: w - 1, y: 15, targetScene: 'lake', targetX: 1, targetY: 15, label: 'Ke Danau Karsa' },
      { x: 18, y: h - 1, targetScene: 'cemetery', targetX: 14, targetY: 1, label: 'Ke Kuburan Tua' },
      { x: 19, y: h - 1, targetScene: 'cemetery', targetX: 15, targetY: 1, label: 'Ke Kuburan Tua' },
    ],
  };
}

// 3. House: Rumah Kamu (16x12)
function buildHouse(): SceneDef {
  const w = 16, h = 12;
  const grid = createGrid(w, h, F);

  // Outer Walls
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }

  grid[h - 1][7] = DR; // Door exit to farm

  // Furniture
  grid[1][1] = BD; grid[1][2] = BD; // Bed
  grid[1][13] = ST; // Cooking Stove
  grid[1][14] = SH; // Fridge / Shelf
  grid[5][7] = TB; grid[5][8] = TB; // Dining Table
  grid[6][7] = TB; grid[6][8] = TB;

  return {
    id: 'house',
    name: 'Rumah Kamu',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 7, y: h - 1, targetScene: 'farm', targetX: 7, targetY: 7, label: 'Keluar ke Kebun' },
    ],
  };
}

// 4. Greenhouse: Rumah Kaca (16x13)
function buildGreenhouse(): SceneDef {
  const w = 16, h = 13;
  const grid = createGrid(w, h, F);

  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }
  grid[h - 1][7] = DR;

  // 4 high-yield greenhouse tilled soil beds
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 6; x++) grid[y][x] = D;
    for (let x = 9; x <= 13; x++) grid[y][x] = D;
  }
  for (let y = 7; y <= 9; y++) {
    for (let x = 2; x <= 6; x++) grid[y][x] = D;
    for (let x = 9; x <= 13; x++) grid[y][x] = D;
  }

  return {
    id: 'greenhouse',
    name: 'Rumah Kaca Tropis',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 7, y: h - 1, targetScene: 'farm', targetX: 25, targetY: 7, label: 'Keluar ke Kebun' },
    ],
  };
}

// 5. Lake: Danau Karsa (30x24)
function buildLake(): SceneDef {
  const w = 30, h = 24;
  const grid = createGrid(w, h, G);

  // Large lake in center-east
  for (let y = 4; y <= 19; y++) {
    for (let x = 9; x <= 26; x++) {
      grid[y][x] = W;
    }
  }

  // Wooden Fishing Docks extending into water
  for (let x = 7; x <= 13; x++) { grid[11][x] = DK; grid[12][x] = DK; }
  for (let y = 14; y <= 18; y++) { grid[y][18] = DK; grid[y][19] = DK; }

  // Trees and flowers around shoreline
  grid[2][5] = T; grid[2][15] = T; grid[2][25] = T;
  grid[21][5] = T; grid[21][12] = T; grid[21][25] = T;

  // West path to town
  for (let x = 0; x <= 7; x++) { grid[11][x] = P; grid[12][x] = P; }

  return {
    id: 'lake',
    name: 'Danau Karsa',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 0, y: 11, targetScene: 'town', targetX: 34, targetY: 14, label: 'Ke Desa Karsa' },
      { x: 0, y: 12, targetScene: 'town', targetX: 34, targetY: 15, label: 'Ke Desa Karsa' },
    ],
  };
}

// 6. Mountain: Lereng Gunung & Dungeon Entrance (32x24)
function buildMountain(): SceneDef {
  const w = 32, h = 24;
  const grid = createGrid(w, h, R);

  // Rock cliffs & mountain paths
  for (let y = 16; y <= 23; y++) {
    for (let x = 0; x < w; x++) grid[y][x] = G;
  }

  // Path leading up the mountain
  for (let y = 4; y <= 23; y++) { grid[y][15] = P; grid[y][16] = P; }

  // Ores scattered on mountain slope
  grid[8][8] = OC; grid[10][6] = OC;
  grid[6][22] = OI; grid[9][24] = OI;
  grid[4][10] = OG; grid[3][20] = OM;

  // Dungeon Cave Entrance (Top center)
  for (let y = 1; y <= 4; y++) {
    for (let x = 13; x <= 18; x++) grid[y][x] = CW;
  }
  grid[4][15] = STD; grid[4][16] = STD;

  // Mystic Naga Cave Portal (Top East)
  grid[3][27] = DR;

  return {
    id: 'mountain',
    name: 'Lereng Gunung & Goa',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 15, y: 23, targetScene: 'town', targetX: 18, targetY: 1, label: 'Ke Desa Karsa' },
      { x: 16, y: 23, targetScene: 'town', targetX: 19, targetY: 1, label: 'Ke Desa Karsa' },
      { x: 15, y: 4, targetScene: 'dungeon', targetX: 10, targetY: 14, label: 'Masuk Dungeon Lantai 1' },
      { x: 16, y: 4, targetScene: 'dungeon', targetX: 10, targetY: 14, label: 'Masuk Dungeon Lantai 1' },
      { x: 27, y: 3, targetScene: 'naga_cave', targetX: 8, targetY: 16, label: 'Gua Sang Hyang Naga' },
      { x: 4, y: 6, targetScene: 'dungeon_forest', targetX: 23, targetY: 12, label: 'Gua Rahasia ke Reruntuhan Hutan' },
    ],
  };
}

// 7. Beach: Pantai Selatan (32x22)
function buildBeach(): SceneDef {
  const w = 32, h = 22;
  const grid = createGrid(w, h, SD);

  // Top grass edge
  for (let x = 0; x < w; x++) { grid[0][x] = G; grid[1][x] = G; }

  // Southern Ocean Water
  for (let y = 12; y < h; y++) {
    for (let x = 0; x < w; x++) grid[y][x] = W;
  }

  // Long wooden dock
  for (let y = 8; y <= 16; y++) { grid[y][15] = DK; grid[y][16] = DK; }

  // Palm trees along beach
  grid[4][5] = PL; grid[5][10] = PL; grid[4][25] = PL;

  // Swarga portal boat at the end of dock
  grid[16][15] = SN; grid[16][16] = SN;

  // Eastern Pier to Deep Ocean (Innocent Life)
  for (let x = 24; x < w; x++) { grid[14][x] = DK; grid[15][x] = DK; }

  return {
    id: 'beach',
    name: 'Pantai Selatan',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 15, y: 0, targetScene: 'farm', targetX: 15, targetY: 22, label: 'Ke Kebun Paman Arsa' },
      { x: 16, y: 0, targetScene: 'farm', targetX: 16, targetY: 22, label: 'Ke Kebun Paman Arsa' },
      { x: 15, y: 16, targetScene: 'swarga', targetX: 12, targetY: 18, label: 'Perahu Mistis ke Swarga' },
      { x: w - 1, y: 14, targetScene: 'ocean', targetX: 2, targetY: 14, label: 'Berlayar ke Samudra Karang Tropis' },
      { x: w - 1, y: 15, targetScene: 'ocean', targetX: 2, targetY: 15, label: 'Berlayar ke Samudra Karang Tropis' },
    ],
  };
}

// 8. Cemetery: Kuburan Tua (24x20)
function buildCemetery(): SceneDef {
  const w = 24, h = 20;
  const grid = createGrid(w, h, G);

  // Old stone walls & tombstones
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }
  grid[0][12] = P; // North entrance from town

  // Cobblestone path
  for (let y = 0; y <= 16; y++) grid[y][12] = P;

  // Tombstones grid
  for (let y = 3; y <= 15; y += 3) {
    for (let x = 4; x <= 9; x += 2) grid[y][x] = TM;
    for (let x = 15; x <= 20; x += 2) grid[y][x] = TM;
  }

  // Ancient Banyan Tree & Shrine in South
  grid[17][12] = SN;

  return {
    id: 'cemetery',
    name: 'Kuburan Tua Karsa',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 12, y: 0, targetScene: 'town', targetX: 18, targetY: 26, label: 'Kembali ke Desa Karsa' },
    ],
  };
}

// 9. Naga Cave: Gua Sang Hyang Naga (20x18)
function buildNagaCave(): SceneDef {
  const w = 20, h = 18;
  const grid = createGrid(w, h, CW);

  // Carved cave interior
  for (let y = 2; y <= 15; y++) {
    for (let x = 3; x <= 16; x++) grid[y][x] = R;
  }

  // Sacred Spring & Crystals
  for (let y = 4; y <= 8; y++) {
    for (let x = 7; x <= 12; x++) grid[y][x] = W;
  }
  grid[3][9] = CR; grid[3][10] = CR;
  grid[9][9] = SN; // Dragon altar

  grid[16][9] = DR; grid[16][10] = DR;

  return {
    id: 'naga_cave',
    name: 'Gua Sang Hyang Naga',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 9, y: 16, targetScene: 'mountain', targetX: 27, targetY: 4, label: 'Keluar ke Lereng Gunung' },
      { x: 10, y: 16, targetScene: 'mountain', targetX: 27, targetY: 4, label: 'Keluar ke Lereng Gunung' },
    ],
  };
}

// 10. Swarga: Dunia Langit (24x20)
function buildSwarga(): SceneDef {
  const w = 24, h = 20;
  const grid = createGrid(w, h, CD);

  // Floating Island in golden clouds
  for (let y = 3; y <= 16; y++) {
    for (let x = 4; x <= 19; x++) grid[y][x] = P;
  }

  // Golden Sacred Lotus Lake
  for (let y = 7; y <= 12; y++) {
    for (let x = 8; x <= 15; x++) grid[y][x] = W;
  }
  grid[9][11] = SN; grid[9][12] = SN;

  grid[18][12] = DK;

  return {
    id: 'swarga',
    name: 'Swarga Dunia Langit',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 12, y: 18, targetScene: 'beach', targetX: 15, targetY: 15, label: 'Kembali ke Pantai' },
    ],
  };
}

// 11. Shop: Warung Bu Sari (16x11)
function buildShop(): SceneDef {
  const w = 16, h = 11;
  const grid = createGrid(w, h, F);
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }
  grid[h - 1][7] = DR;

  // Shop counters and shelves
  for (let x = 2; x <= 13; x++) grid[1][x] = SH;
  for (let x = 3; x <= 12; x++) grid[4][x] = CT;

  return {
    id: 'shop',
    name: 'Warung Bu Sari',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 7, y: h - 1, targetScene: 'town', targetX: 6, targetY: 9, label: 'Keluar ke Desa' },
    ],
  };
}

// 12. Smith: Bengkel Budi (16x11)
function buildSmith(): SceneDef {
  const w = 16, h = 11;
  const grid = createGrid(w, h, F);
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }
  grid[h - 1][7] = DR;

  grid[1][4] = AV; grid[1][5] = ST; // Anvil and Forge
  grid[1][10] = SH; grid[1][11] = SH;

  return {
    id: 'smith',
    name: 'Bengkel Budi',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 7, y: h - 1, targetScene: 'town', targetX: 7, targetY: 21, label: 'Keluar ke Desa' },
    ],
  };
}

// 13. Clinic: Klinik Pak Raka (16x11)
function buildClinic(): SceneDef {
  const w = 16, h = 11;
  const grid = createGrid(w, h, F);
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }
  grid[h - 1][7] = DR;

  grid[1][2] = BD; grid[1][3] = BD; // Clinic recovery beds
  grid[1][12] = SH; grid[1][13] = TB;

  return {
    id: 'clinic',
    name: 'Klinik Pak Raka',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 7, y: h - 1, targetScene: 'town', targetX: 28, targetY: 9, label: 'Keluar ke Desa' },
    ],
  };
}

// 14. Studio: Studio Maya (16x11)
function buildStudio(): SceneDef {
  const w = 16, h = 11;
  const grid = createGrid(w, h, F);
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }
  grid[h - 1][7] = DR;

  grid[1][3] = TB; grid[1][4] = TB;
  grid[1][11] = SH; grid[1][12] = SH;

  return {
    id: 'studio',
    name: 'Studio Maya',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 7, y: h - 1, targetScene: 'town', targetX: 28, targetY: 21, label: 'Keluar ke Desa' },
    ],
  };
}

// 15. Procedural Dungeon Generator (Floors 1-13)
export function generateDungeonFloor(floor: number): SceneDef {
  const w = 24, h = 20;
  const grid = createGrid(w, h, CW);

  // Clear out rooms and corridors
  for (let y = 2; y <= h - 3; y++) {
    for (let x = 2; x <= w - 3; x++) {
      grid[y][x] = R;
    }
  }

  // Pillar obstacles
  for (let y = 4; y <= h - 5; y += 4) {
    for (let x = 4; x <= w - 5; x += 4) {
      grid[y][x] = CW;
      grid[y][x + 1] = CW;
    }
  }

  // Stairs Up (Entrance)
  grid[h - 3][w / 2] = STU;

  // Stairs Down (Exit to next floor)
  if (floor < 13) {
    grid[3][w / 2] = STD;
  } else {
    // Floor 13: Bhutakala Boss Altar & Legendary Sacred Spring
    grid[3][w / 2] = SN;
    grid[4][w / 2 - 1] = W; grid[4][w / 2] = W; grid[4][w / 2 + 1] = W;
    grid[5][w / 2 - 1] = W; grid[5][w / 2] = W; grid[5][w / 2 + 1] = W;
  }

  // Scatter ores depending on depth
  const oreTypes = [OC, OI, OG, OM, CR];
  const maxOreIdx = Math.min(oreTypes.length - 1, Math.floor((floor - 1) / 3));

  for (let i = 0; i < 8 + floor; i++) {
    const ox = 3 + Math.floor(Math.random() * (w - 6));
    const oy = 3 + Math.floor(Math.random() * (h - 6));
    if (grid[oy][ox] === R) {
      const selectedOre = oreTypes[Math.floor(Math.random() * (maxOreIdx + 1))];
      grid[oy][ox] = selectedOre;
    }
  }

  const portals = [
    {
      x: Math.floor(w / 2),
      y: h - 3,
      targetScene: floor === 1 ? 'mountain' : 'dungeon',
      targetX: floor === 1 ? 15 : Math.floor(w / 2),
      targetY: floor === 1 ? 5 : 4,
      label: floor === 1 ? 'Keluar ke Gunung' : `Naik ke Lantai ${floor - 1}`,
    },
  ];

  if (floor < 13) {
    portals.push({
      x: Math.floor(w / 2),
      y: 3,
      targetScene: 'dungeon',
      targetX: Math.floor(w / 2),
      targetY: h - 4,
      label: `Turun ke Lantai ${floor + 1}`,
    });
  }

  return {
    id: 'dungeon',
    name: floor === 13 ? `Dungeon Lt. 13 - Sarang Bhutakala` : `Dungeon Lereng Gunung Lt. ${floor}`,
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals,
  };
}

export const SCENES: Record<string, SceneDef> = {
  farm: buildFarm(),
  town: buildTown(),
  house: buildHouse(),
  greenhouse: buildGreenhouse(),
  lake: buildLake(),
  mountain: buildMountain(),
  beach: buildBeach(),
  cemetery: buildCemetery(),
  naga_cave: buildNagaCave(),
  swarga: buildSwarga(),
  shop: buildShop(),
  smith: buildSmith(),
  clinic: buildClinic(),
  studio: buildStudio(),
  ocean: buildOcean(),
  dungeon_water: buildDungeonWater(),
  dungeon_fire: buildDungeonFire(),
  dungeon_forest: buildDungeonForest(),
  lab_hope: buildLabHope(),
};

// 16. Ocean: Samudra Karang Tropis & Teluk Paskah (36x28) - Harvest Moon Innocent Life
function buildOcean(): SceneDef {
  const w = 36, h = 28;
  const grid = createGrid(w, h, DW);

  // Northern & Central shallow reef waters
  for (let y = 6; y <= 24; y++) {
    for (let x = 4; x <= 32; x++) {
      grid[y][x] = W;
    }
  }

  // Western & Southern Tropical Sandy Beach Coast
  for (let y = 10; y <= 20; y++) {
    for (let x = 0; x <= 6; x++) {
      grid[y][x] = SD;
    }
  }
  for (let x = 0; x <= 14; x++) {
    grid[25][x] = SD; grid[26][x] = SD; grid[27][x] = SD;
  }

  // Tropical Palm Trees along the sandy shore
  grid[11][1] = PL; grid[15][2] = PL; grid[19][1] = PL;
  grid[26][4] = PL; grid[26][10] = PL;

  // Wooden Boardwalk & Long Ocean Pier
  for (let x = 6; x <= 22; x++) {
    grid[14][x] = DK; grid[15][x] = DK;
  }
  for (let y = 8; y <= 16; y++) {
    grid[y][22] = DK; grid[y][23] = DK;
  }

  // Easter Island Offshore Islets with Moai Statues (Innocent Life iconic!)
  grid[6][12] = SD; grid[6][13] = SD; grid[7][12] = SD; grid[7][13] = SD;
  grid[6][12] = MO; grid[7][13] = MO;

  grid[6][28] = SD; grid[6][29] = SD; grid[7][28] = SD; grid[7][29] = SD;
  grid[6][28] = MO;

  grid[22][28] = SD; grid[22][29] = SD; grid[23][28] = SD; grid[23][29] = SD;
  grid[22][29] = MO;

  // Submerged Coral Reef Formations in shallow waters
  grid[9][8] = CL; grid[9][16] = CL; grid[11][18] = CL;
  grid[18][12] = CL; grid[20][16] = CL; grid[17][26] = CL;
  grid[12][30] = CL;

  // Sunken Water Temple Ruins Entrance (at the end of northern boardwalk)
  for (let x = 16; x <= 20; x++) {
    grid[4][x] = CW; grid[5][x] = P;
  }
  grid[5][18] = DR; // Entrance to Water Ruins!
  grid[5][17] = JC; // Glowing water crest beacon

  return {
    id: 'ocean',
    name: 'Samudra Karang Teluk Paskah (Innocent Life)',
    width: w,
    height: h,
    layout: grid,
    indoor: false,
    portals: [
      { x: 0, y: 14, targetScene: 'beach', targetX: 29, targetY: 14, label: 'Kembali ke Pantai Selatan' },
      { x: 0, y: 15, targetScene: 'beach', targetX: 29, targetY: 15, label: 'Kembali ke Pantai Selatan' },
      { x: 18, y: 5, targetScene: 'dungeon_water', targetX: 14, targetY: 21, label: 'Kuil Air Kuno (Water Ruins)' },
      { x: 23, y: 8, targetScene: 'swarga', targetX: 12, targetY: 18, label: 'Perahu Layar ke Swarga' },
    ],
  };
}

// 17. Water Ruins: Reruntuhan Kuil Air Kuno (28x24) - Harvest Moon Innocent Life
function buildDungeonWater(): SceneDef {
  const w = 28, h = 24;
  const grid = createGrid(w, h, CW);

  // Carved ancient stone halls
  for (let y = 2; y <= 21; y++) {
    for (let x = 3; x <= 24; x++) {
      grid[y][x] = P;
    }
  }

  // Flooded subterranean waterways
  for (let y = 6; y <= 17; y++) {
    for (let x = 6; x <= 11; x++) grid[y][x] = W;
    for (let x = 16; x <= 21; x++) grid[y][x] = W;
  }

  // Waterfalls cascading from North Wall
  grid[2][8] = WF; grid[2][9] = WF;
  grid[2][18] = WF; grid[2][19] = WF;

  // Stone bridges across water
  for (let x = 5; x <= 12; x++) grid[11][x] = P;
  for (let x = 15; x <= 22; x++) grid[11][x] = P;

  // Central Elevated Altar with Water Spirit Jewel Crest
  grid[11][13] = P; grid[11][14] = P;
  grid[10][13] = JC; grid[10][14] = SN;

  // Precious Aquamarine and Mithril Ores
  grid[5][4] = OM; grid[16][4] = OM;
  grid[5][23] = CR; grid[16][23] = CR;
  grid[8][14] = CR;

  // Ancient Moai Relic in Sanctum
  grid[4][13] = MO; grid[4][14] = MO;

  // Passage descending to Fire Volcano Ruins
  grid[3][13] = STD; grid[3][14] = STD;

  // Entrance exit to Ocean
  grid[21][13] = DR; grid[21][14] = DR;

  return {
    id: 'dungeon_water',
    name: 'Reruntuhan Kuil Air (Water Spirit Ruins)',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 13, y: 21, targetScene: 'ocean', targetX: 18, targetY: 6, label: 'Keluar ke Samudra Tropis' },
      { x: 14, y: 21, targetScene: 'ocean', targetX: 18, targetY: 6, label: 'Keluar ke Samudra Tropis' },
      { x: 13, y: 3, targetScene: 'dungeon_fire', targetX: 14, targetY: 20, label: 'Turun ke Reruntuhan Magma Api' },
      { x: 14, y: 3, targetScene: 'dungeon_fire', targetX: 14, targetY: 20, label: 'Turun ke Reruntuhan Magma Api' },
    ],
  };
}

// 18. Fire Ruins: Reruntuhan Magma Vulkanik (28x24) - Harvest Moon Innocent Life
function buildDungeonFire(): SceneDef {
  const w = 28, h = 24;
  const grid = createGrid(w, h, CW);

  // Volcanic cavern ground
  for (let y = 2; y <= 21; y++) {
    for (let x = 3; x <= 24; x++) {
      grid[y][x] = R;
    }
  }

  // Molten glowing lava rivers
  for (let y = 5; y <= 18; y++) {
    grid[y][7] = LV; grid[y][8] = LV;
    grid[y][19] = LV; grid[y][20] = LV;
  }
  for (let x = 8; x <= 19; x++) {
    grid[13][x] = LV; grid[14][x] = LV;
  }

  // Obsidian bridges crossing the lava
  grid[10][7] = P; grid[10][8] = P;
  grid[10][19] = P; grid[10][20] = P;
  grid[13][13] = P; grid[13][14] = P; grid[14][13] = P; grid[14][14] = P;

  // Center Island with Fire Spirit Jewel Crest
  grid[8][13] = JC; grid[8][14] = SN;

  // Volcanic Gold, Ruby, & Crystal Ores
  grid[4][5] = OG; grid[18][5] = OG;
  grid[4][22] = CR; grid[18][22] = CR;
  grid[9][13] = OM;

  // Stairs Up (to Water Ruins) & Stairs Down (to Forest Ziggurat)
  grid[21][14] = STU;
  grid[3][14] = STD;

  return {
    id: 'dungeon_fire',
    name: 'Reruntuhan Magma Api (Fire Spirit Volcano)',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 14, y: 21, targetScene: 'dungeon_water', targetX: 13, targetY: 4, label: 'Naik ke Reruntuhan Kuil Air' },
      { x: 14, y: 3, targetScene: 'dungeon_forest', targetX: 14, targetY: 20, label: 'Ke Reruntuhan Hutan Kuno' },
    ],
  };
}

// 19. Forest Ruins: Reruntuhan Hutan Kuno & Ziggurat (28x24) - Harvest Moon Innocent Life
function buildDungeonForest(): SceneDef {
  const w = 28, h = 24;
  const grid = createGrid(w, h, CW);

  // Overgrown high-tech stone ziggurat
  for (let y = 2; y <= 21; y++) {
    for (let x = 3; x <= 24; x++) {
      grid[y][x] = P;
    }
  }

  // Lush overgrown patches with ancient roots & trees
  for (let y = 4; y <= 8; y++) {
    grid[y][5] = T; grid[y][6] = G;
    grid[y][21] = T; grid[y][22] = G;
  }
  for (let y = 14; y <= 18; y++) {
    grid[y][5] = G; grid[y][6] = T;
    grid[y][21] = G; grid[y][22] = T;
  }

  // High-Tech Automated Maglev Rails crisscrossing the ancient ruins
  for (let y = 4; y <= 19; y++) {
    grid[y][10] = MR;
  }
  for (let x = 10; x <= 18; x++) {
    grid[16][x] = MR;
  }

  // Earth Spirit Jewel Crest Altar
  grid[8][14] = JC; grid[8][15] = SN;

  // Ancient Moai Relics
  grid[4][14] = MO; grid[4][15] = MO;

  // Copper, Iron & Crystal Ores
  grid[6][13] = OC; grid[6][16] = OI;
  grid[18][14] = CR;

  // Exit portals
  grid[21][14] = STU; // Back to Fire Ruins
  grid[3][14] = DR;  // To Dr Hope's Lab!
  grid[12][24] = DR; // Secret path to Mountain

  return {
    id: 'dungeon_forest',
    name: 'Reruntuhan Hutan Kuno (Forest Spirit Ziggurat)',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 14, y: 21, targetScene: 'dungeon_fire', targetX: 14, targetY: 4, label: 'Kembali ke Reruntuhan Api' },
      { x: 14, y: 3, targetScene: 'lab_hope', targetX: 10, targetY: 13, label: 'Masuk ke Lab Dr. Hope' },
      { x: 24, y: 12, targetScene: 'mountain', targetX: 4, targetY: 6, label: 'Jalan Rahasia ke Lereng Gunung' },
    ],
  };
}

// 20. Lab Dr. Hope: Laboratorium Penelitian Pulau Paskah (20x16) - Harvest Moon Innocent Life
function buildLabHope(): SceneDef {
  const w = 20, h = 16;
  const grid = createGrid(w, h, F);

  // Outer Sci-Fi Laboratory Walls
  for (let x = 0; x < w; x++) { grid[0][x] = L; grid[h - 1][x] = L; }
  for (let y = 0; y < h; y++) { grid[y][0] = L; grid[y][w - 1] = L; }

  // Life Regeneration & Diagnostic Capsule Pod (Android charging pod!)
  grid[3][3] = LP; grid[3][4] = LP;

  // Holographic Island Map & Research Console
  grid[3][9] = LC; grid[3][10] = LC; grid[3][11] = LC;

  // Computer Servers & Sci-Fi Shelves
  for (let x = 14; x <= 18; x++) grid[1][x] = SH;

  // Automated Maglev Rail Dispatcher Line connecting out to farm
  for (let y = 8; y <= 14; y++) {
    grid[y][15] = MR; grid[y][16] = MR;
  }

  // Lab Work Tables
  grid[8][5] = TB; grid[8][6] = TB;
  grid[9][5] = TB; grid[9][6] = TB;

  // Exit Doors
  grid[h - 1][10] = DR; // To Forest Ruins
  grid[14][15] = DR; // Automated Maglev Express to Farm!

  return {
    id: 'lab_hope',
    name: 'Laboratorium Dr. Hope (Innocent Life)',
    width: w,
    height: h,
    layout: grid,
    indoor: true,
    portals: [
      { x: 10, y: h - 1, targetScene: 'dungeon_forest', targetX: 14, targetY: 4, label: 'Ke Reruntuhan Hutan Kuno' },
      { x: 15, y: 14, targetScene: 'farm', targetX: 3, targetY: 8, label: 'Kereta Maglev Cepat ke Kebun' },
    ],
  };
}
