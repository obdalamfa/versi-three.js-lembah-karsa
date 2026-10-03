// Main Game Application for Lembah Karsa 3D
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, ToolType, MonsterEntity, ItemDef, SoilTile, Season, Weather, PS2VisualSettings } from './types/game';
import { GameRenderer3D } from './engine/GameRenderer3D';
import { HUD } from './components/HUD';
import { ActionPieMenu, PieAction } from './components/ActionPieMenu';
import { DialogueBox } from './components/DialogueBox';
import { FishingMiniGame } from './components/FishingMiniGame';
import { CookingPanel } from './components/CookingPanel';
import { ShopModal } from './components/ShopModal';
import { SmithModal } from './components/SmithModal';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import { TabModals } from './components/TabModals';
import { PS2SaveOverlay } from './components/PS2SaveOverlay';
import { sound } from './systems/sound';
import { createInitialMotives, tickMotives } from './systems/motives';
import { INITIAL_ANIMALS, tickAnimalsDaily } from './systems/husbandry';
import { tickSoilDaily } from './systems/farming';
import { CROPS, ITEMS, NPCS, INITIAL_QUESTS, Recipe } from './data/gameData';
import { SCENES, TILES } from './data/scenesData';

const SAVE_KEY = 'LEMBAH_KARSA_SAVE_V1';

const DEFAULT_PS2_SETTINGS: PS2VisualSettings = {
  enabled: true,
  bloomGlow: true,
  crtScanlines: true,
  gsDither: true,
  celOutlines: true,
  colorWarmth: 0.8,
  vignette: true,
  dualShockPrompts: true,
};

const DEFAULT_STATE: GameState = {
  player: {
    name: 'Petani Karsa',
    x: 15,
    y: 14,
    scene: 'farm',
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    gold: 500,
    level: 1,
    exp: 0,
    appearance: {
      name: 'Petani Karsa',
      skinIndex: 0,
      hairIndex: 0,
      shirtIndex: 0,
      pantsIndex: 0,
      hatIndex: 0,
    },
    activeTool: 'cangkul',
    toolTiers: {
      cangkul: 'Kayu',
      siram: 'Kayu',
      tanam: 'Kayu',
      sabit: 'Kayu',
      kapak: 'Kayu',
      beliung: 'Kayu',
      pedang: 'Kayu',
      pancing: 'Kayu',
      tangan: 'Kayu',
    },
  },
  time: {
    day: 1,
    season: 'Semi',
    year: 1,
    hour: 6,
    minute: 0,
    weather: 'Cerah',
    paused: false,
  },
  inventory: {
    lobak_seed: 5,
    wortel_seed: 3,
    stroberi_seed: 2,
    pakan: 8,
    kayu: 10,
    batu: 10,
  },
  shippingBin: {},
  soil: {
    farm_12_14: { x: 12, y: 14, tilled: true, watered: false, age: 0, kering: 0 },
    farm_13_14: { x: 13, y: 14, tilled: true, watered: false, age: 0, kering: 0 },
    farm_14_14: { x: 14, y: 14, tilled: true, watered: false, age: 0, kering: 0 },
  },
  animals: INITIAL_ANIMALS,
  motives: createInitialMotives(),
  npcs: NPCS,
  quests: INITIAL_QUESTS,
  stats: {
    cropsHarvested: 0,
    monstersDefeated: 0,
    fishCaught: 0,
    oresMined: 0,
    goldEarned: 0,
    produceCollected: 0,
  },
  dungeonFloor: 1,
  ps2Settings: DEFAULT_PS2_SETTINGS,
};

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          ps2Settings: { ...DEFAULT_PS2_SETTINGS, ...(parsed.ps2Settings || {}) },
        };
      }
    } catch {}
    return DEFAULT_STATE;
  });

  const [monsters, setMonsters] = useState<MonsterEntity[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCharCreation, setShowCharCreation] = useState(false);
  const [showPS2Save, setShowPS2Save] = useState(false);

  // Modals & Popups State
  const [activeTabModal, setActiveTabModal] = useState<'tas' | 'kalender' | 'peta' | 'ternak' | 'motif' | 'misi' | 'warga' | 'pengaturan' | null>(null);
  const [pieMenu, setPieMenu] = useState<{ isOpen: boolean; title: string; subtitle?: string; actions: PieAction[] }>({
    isOpen: false,
    title: '',
    actions: [],
  });
  const [dialogue, setDialogue] = useState<{ isOpen: boolean; npcId: string | null; text: string }>({
    isOpen: false,
    npcId: null,
    text: '',
  });
  const [showFishing, setShowFishing] = useState(false);
  const [showCooking, setShowCooking] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSmith, setShowSmith] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; text: string; icon?: string }[]>([]);

  // 3D Canvas Mount Ref
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<GameRenderer3D | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const showToast = useCallback((text: string, icon = '✨') => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev.slice(-3), { id, text, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Initialize Monsters for current scene
  const refreshMonsters = useCallback((sceneId: string, floor = 1) => {
    if (sceneId === 'mountain') {
      setMonsters([
        { id: 'm1', type: 'kelelawar', name: 'Kelelawar Gua', x: 8, y: 8, hp: 35, maxHp: 35, atk: 6, def: 2, speed: 1.2, color: '#7c3aed', exp: 15, drops: [{ itemId: 'bijih_tembaga', chance: 0.6 }] },
        { id: 'm2', type: 'tikus', name: 'Tikus Gunung', x: 22, y: 12, hp: 45, maxHp: 45, atk: 8, def: 3, speed: 1.0, color: '#9ca3af', exp: 20, drops: [{ itemId: 'batu', chance: 0.8 }] },
      ]);
    } else if (sceneId === 'dungeon') {
      const isBossFloor = floor === 13;
      if (isBossFloor) {
        setMonsters([
          { id: 'boss_bhuta', type: 'bhutakala', name: 'Raja Bhutakala Swarga', x: 12, y: 8, hp: 500, maxHp: 500, atk: 25, def: 10, speed: 1.1, color: '#991b1b', exp: 300, isBoss: true, drops: [{ itemId: 'kristal_jiwa', chance: 1.0 }, { itemId: 'bijih_mithril', chance: 1.0 }] },
        ]);
      } else {
        const mobTypes = [
          { type: 'banaspati', name: 'Banaspati Api', color: '#ea580c', hp: 50 + floor * 10, atk: 8 + floor * 2, exp: 25 + floor * 5, drop: 'bijih_tembaga' },
          { type: 'kuntilanak', name: 'Arwah Gentayangan', color: '#e2e8f0', hp: 40 + floor * 10, atk: 10 + floor * 2, exp: 30 + floor * 5, drop: 'bijih_besi' },
          { type: 'genderuwo', name: 'Genderuwo Gua', color: '#3f3f46', hp: 70 + floor * 15, atk: 12 + floor * 2, exp: 40 + floor * 6, drop: 'bijih_emas' },
        ];
        const newMobs: MonsterEntity[] = [];
        for (let i = 0; i < 3 + Math.floor(floor / 2); i++) {
          const mType = mobTypes[i % mobTypes.length];
          newMobs.push({
            id: `dung_mob_${floor}_${i}`,
            type: mType.type,
            name: mType.name,
            x: 4 + Math.floor(Math.random() * 16),
            y: 4 + Math.floor(Math.random() * 12),
            hp: mType.hp,
            maxHp: mType.hp,
            atk: mType.atk,
            def: 3 + floor,
            speed: 1.0,
            color: mType.color,
            exp: mType.exp,
            drops: [{ itemId: mType.drop, chance: 0.75 }],
          });
        }
        setMonsters(newMobs);
      }
    } else if (sceneId === 'ocean') {
      setMonsters([
        { id: 'oc_m1', type: 'kepiting_karang', name: 'Kepiting Karang Tropis', x: 8, y: 16, hp: 45, maxHp: 45, atk: 7, def: 4, speed: 1.0, color: '#f43f5e', exp: 25, drops: [{ itemId: 'mutiara_laut', chance: 0.35 }, { itemId: 'ikan_badut', chance: 0.8 }] },
        { id: 'oc_m2', type: 'kepiting_karang', name: 'Kepiting Kristal Laut', x: 26, y: 12, hp: 55, maxHp: 55, atk: 9, def: 5, speed: 1.0, color: '#fb7185', exp: 35, drops: [{ itemId: 'batu_aquamarine', chance: 0.4 }] },
      ]);
    } else if (sceneId === 'dungeon_water') {
      setMonsters([
        { id: 'dw_m1', type: 'golem_air', name: 'Golem Kuil Air Purba', x: 8, y: 12, hp: 80, maxHp: 80, atk: 12, def: 6, speed: 0.9, color: '#0284c7', exp: 50, drops: [{ itemId: 'segel_air', chance: 0.25 }, { itemId: 'batu_aquamarine', chance: 0.8 }] },
        { id: 'dw_m2', type: 'golem_air', name: 'Automaton Air Penjaga', x: 19, y: 12, hp: 85, maxHp: 85, atk: 14, def: 6, speed: 0.9, color: '#0369a1', exp: 55, drops: [{ itemId: 'bijih_mithril', chance: 0.7 }] },
        { id: 'dw_m3', type: 'kepiting_karang', name: 'Kepiting Kristal Biru', x: 14, y: 8, hp: 50, maxHp: 50, atk: 8, def: 4, speed: 1.1, color: '#38bdf8', exp: 30, drops: [{ itemId: 'batu_aquamarine', chance: 0.6 }] },
      ]);
    } else if (sceneId === 'dungeon_fire') {
      setMonsters([
        { id: 'df_m1', type: 'salamander_api', name: 'Salamander Magma Lahar', x: 10, y: 10, hp: 95, maxHp: 95, atk: 15, def: 5, speed: 1.2, color: '#ea580c', exp: 60, drops: [{ itemId: 'batu_delima', chance: 0.7 }, { itemId: 'segel_api', chance: 0.25 }] },
        { id: 'df_m2', type: 'salamander_api', name: 'Kadal Api Vulkanik', x: 18, y: 10, hp: 90, maxHp: 90, atk: 14, def: 5, speed: 1.1, color: '#f97316', exp: 55, drops: [{ itemId: 'bijih_emas', chance: 0.8 }] },
        { id: 'df_m3', type: 'banaspati', name: 'Banaspati Kawah', x: 14, y: 16, hp: 70, maxHp: 70, atk: 16, def: 3, speed: 1.0, color: '#dc2626', exp: 50, drops: [{ itemId: 'batu_delima', chance: 0.5 }] },
      ]);
    } else if (sceneId === 'dungeon_forest') {
      setMonsters([
        { id: 'dfo_m1', type: 'mecha_drone', name: 'Drone Penjaga Ziggurat', x: 8, y: 10, hp: 70, maxHp: 70, atk: 13, def: 5, speed: 1.3, color: '#475569', exp: 50, drops: [{ itemId: 'chip_kuno', chance: 0.8 }, { itemId: 'segel_tanah', chance: 0.25 }] },
        { id: 'dfo_m2', type: 'mecha_drone', name: 'Drone Sensor Purba', x: 20, y: 10, hp: 75, maxHp: 75, atk: 14, def: 5, speed: 1.2, color: '#334155', exp: 55, drops: [{ itemId: 'chip_kuno', chance: 0.7 }] },
        { id: 'dfo_m3', type: 'genderuwo', name: 'Penjaga Lumut Purba', x: 14, y: 14, hp: 110, maxHp: 110, atk: 16, def: 7, speed: 0.9, color: '#166534', exp: 70, drops: [{ itemId: 'bijih_emas', chance: 0.9 }] },
      ]);
    } else {
      setMonsters([]);
    }
  }, []);

  // Save Game Helper (PS2 Memory Card Slot 1)
  const handleSaveGame = useCallback(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
      sound.playPS2Save();
      setShowPS2Save(true);
      setTimeout(() => setShowPS2Save(false), 2200);
      showToast('Data berhasil ditulis ke Memory Card (PS2) Slot 1!', '💾');
    } catch {
      showToast('Gagal menyimpan data ke Memory Card.', '⚠️');
    }
  }, [showToast]);

  // PS2 Graphic Settings Update Callback
  const handleUpdatePS2Settings = useCallback((newSettings: Partial<PS2VisualSettings>) => {
    setState((prev) => {
      const updated = { ...(prev.ps2Settings || DEFAULT_PS2_SETTINGS), ...newSettings };
      rendererRef.current?.updatePS2Settings(updated);
      return { ...prev, ps2Settings: updated };
    });
  }, []);

  // Next Day Transition Logic
  const handleNextDay = useCallback(() => {
    setState((prev) => {
      const nextDay = prev.time.day + 1;
      let nextSeason: Season = prev.time.season;
      let nextYear = prev.time.year;

      if (nextDay > 28) {
        const seasons: Season[] = ['Semi', 'Panas', 'Gugur', 'Dingin'];
        const currentIdx = seasons.indexOf(prev.time.season);
        nextSeason = seasons[(currentIdx + 1) % 4];
        if (nextSeason === 'Semi') nextYear += 1;
      }

      // Random weather (80% sunny, 15% rain, 5% snow/storm)
      const r = Math.random();
      const nextWeather: Weather = nextSeason === 'Dingin' && r > 0.6 ? 'Bersalju' : r > 0.85 ? 'Badai' : r > 0.7 ? 'Hujan' : 'Cerah';

      // 1. Tick Crops & Trees
      const { updatedSoil, report: cropReport } = tickSoilDaily(prev.soil, nextSeason);

      // Auto-water on rainy days!
      if (nextWeather === 'Hujan' || nextWeather === 'Badai') {
        Object.keys(updatedSoil).forEach((k) => {
          if (updatedSoil[k].tilled) updatedSoil[k].watered = true;
        });
      }

      // 2. Tick Animals
      const { updatedAnimals, report: animalReport } = tickAnimalsDaily(prev.animals, nextDay);

      // 3. Shipping Bin payout
      let shippingGold = 0;
      Object.entries(prev.shippingBin).forEach(([id, count]) => {
        const item = ITEMS[id];
        if (item && count > 0) {
          shippingGold += item.sellPrice * count;
        }
      });

      // 4. Restore Motives & Health after sleep
      const nextMotives = { ...prev.motives };
      nextMotives.energi = 100;
      nextMotives.nyaman = Math.min(100, nextMotives.nyaman + 40);
      nextMotives.asleep = false;

      // Toast summary
      setTimeout(() => {
        if (shippingGold > 0) {
          showToast(`Peti Pengiriman: Paman Arsa membayar +${shippingGold.toLocaleString('id-ID')} G!`, '💰');
        }
        if (cropReport.ready > 0) {
          showToast(`${cropReport.ready} tanaman kebun telah siap dipetik!`, '🌾');
        }
        if (animalReport.ready.length > 0) {
          showToast(`${animalReport.ready.join(', ')} menghasilkan susu/telur segar!`, '🥛');
        }
      }, 500);

      return {
        ...prev,
        player: {
          ...prev.player,
          x: 7,
          y: 7,
          scene: 'house',
          hp: prev.player.maxHp,
          energy: prev.player.maxEnergy,
          gold: prev.player.gold + shippingGold,
        },
        time: {
          ...prev.time,
          day: nextDay > 28 ? 1 : nextDay,
          season: nextSeason,
          year: nextYear,
          hour: 6,
          minute: 0,
          weather: nextWeather,
        },
        shippingBin: {},
        soil: updatedSoil,
        animals: updatedAnimals,
        motives: nextMotives,
      };
    });
  }, [showToast]);

  // Execute Action on target tile (tx, ty) or adjacent entities
  const handlePerformAction = useCallback((tx: number, ty: number) => {
    const s = stateRef.current;
    const { player, soil, inventory, npcs, animals, time } = s;
    const tool = player.activeTool;
    const soilKey = `${player.scene}_${tx}_${ty}`;
    const targetTile = soil[soilKey];
    const currentScene = SCENES[player.scene] || SCENES.farm;
    const tileType = currentScene.layout[ty]?.[tx];

    // 1. Check Animal Interactivity (Farm Scene)
    if (player.scene === 'farm') {
      const targetAnimal = Object.values(animals).find(
        (a) => Math.hypot(a.x - tx, a.y - ty) <= 1.2 || (Math.hypot(a.x - player.x, a.y - player.y) <= 1.8 && Math.hypot(a.x - tx, a.y - ty) <= 2.2)
      );

      if (targetAnimal) {
        sound.playClick();
        sound.playAnimalAmbient(targetAnimal.type);
        rendererRef.current?.triggerAnimalEmote(targetAnimal.id);
        const actions: PieAction[] = [
          {
            id: 'pet',
            label: 'Belai & Sayangi',
            icon: '❤️',
            color: 'bg-rose-950 border-rose-500 text-rose-200 hover:bg-rose-900',
            onSelect: () => {
              sound.playAnimalAmbient(targetAnimal.type);
              rendererRef.current?.triggerAnimalEmote(targetAnimal.id);
              setState((prev) => {
                const nextAnimals = { ...prev.animals };
                if (nextAnimals[targetAnimal.id]) {
                  nextAnimals[targetAnimal.id] = {
                    ...nextAnimals[targetAnimal.id],
                    hearts: Math.min(5, nextAnimals[targetAnimal.id].hearts + 1),
                  };
                }
                return {
                  ...prev,
                  player: { ...prev.player, exp: prev.player.exp + 10 },
                  motives: { ...prev.motives, senang: Math.min(100, prev.motives.senang + 15) },
                  animals: nextAnimals,
                };
              });
              showToast(`Kamu membelai ${targetAnimal.name} dengan penuh kasih sayang! (+1 ❤️)`, '💖');
            },
          },
          {
            id: 'brush',
            label: 'Sikat & Bersihkan',
            icon: '✨',
            color: 'bg-sky-950 border-sky-500 text-sky-200 hover:bg-sky-900',
            onSelect: () => {
              sound.playAnimalAmbient(targetAnimal.type);
              rendererRef.current?.triggerAnimalEmote(targetAnimal.id);
              setState((prev) => {
                const nextAnimals = { ...prev.animals };
                if (nextAnimals[targetAnimal.id]) {
                  nextAnimals[targetAnimal.id] = {
                    ...nextAnimals[targetAnimal.id],
                    bersih: 100,
                    hari_bersih: 1,
                    hearts: Math.min(5, nextAnimals[targetAnimal.id].hearts + 1),
                  };
                }
                return {
                  ...prev,
                  motives: { ...prev.motives, higiene: Math.min(100, prev.motives.higiene + 10) },
                  animals: nextAnimals,
                };
              });
              showToast(`Bulu ${targetAnimal.name} kini bersih berkilau! ✨`, '🧽');
            },
          },
          {
            id: 'feed',
            label: (inventory.pakan || inventory.jerami) ? 'Beri Pakan (-1)' : 'Pakan (Habis di Tas)',
            icon: '🌾',
            color: (inventory.pakan || inventory.jerami)
              ? 'bg-amber-950 border-amber-500 text-amber-200 hover:bg-amber-900'
              : 'bg-stone-900 border-stone-700 text-stone-500 cursor-not-allowed',
            onSelect: () => {
              const feedItem = inventory.pakan ? 'pakan' : inventory.jerami ? 'jerami' : null;
              if (!feedItem) {
                showToast('Kamu tidak punya Pakan atau Jerami! Beli di Warung Bu Sari.', '🌾');
                return;
              }
              sound.playAnimalAmbient(targetAnimal.type);
              rendererRef.current?.triggerAnimalEmote(targetAnimal.id);
              setState((prev) => {
                const nextInv = { ...prev.inventory };
                nextInv[feedItem] -= 1;
                if (nextInv[feedItem] <= 0) delete nextInv[feedItem];

                const nextAnimals = { ...prev.animals };
                if (nextAnimals[targetAnimal.id]) {
                  nextAnimals[targetAnimal.id] = {
                    ...nextAnimals[targetAnimal.id],
                    kenyang: 100,
                    hari_makan: 1,
                    lalai: 0,
                    hearts: Math.min(5, nextAnimals[targetAnimal.id].hearts + 1),
                  };
                }
                return {
                  ...prev,
                  inventory: nextInv,
                  animals: nextAnimals,
                  player: { ...prev.player, exp: prev.player.exp + 10 },
                };
              });
              showToast(`${targetAnimal.name} makan dengan lahap sampai kenyang!`, '🌾');
            },
          },
        ];

        // Produce Collection Action
        if (targetAnimal.produk_siap) {
          const produceItemId = targetAnimal.type === 'sapi'
            ? (targetAnimal.hearts >= 4 ? 'susu_emas' : 'susu_segar')
            : targetAnimal.type === 'kambing'
            ? 'susu_kambing'
            : targetAnimal.type === 'domba'
            ? (targetAnimal.hearts >= 4 ? 'bulu_emas' : 'bulu_domba')
            : targetAnimal.type === 'ayam'
            ? (targetAnimal.hearts >= 4 ? 'telur_emas' : 'telur_segar')
            : 'telur_bebek';

          const produceItem = ITEMS[produceItemId];

          actions.unshift({
            id: 'collect',
            label: `Ambil Hasil (${produceItem?.name || produceItemId})`,
            icon: '🥛',
            color: 'bg-emerald-950 border-emerald-400 text-emerald-200 font-bold hover:bg-emerald-900',
            onSelect: () => {
              sound.playLevelUp();
              rendererRef.current?.triggerHarvestCelebration(produceItemId);
              setState((prev) => {
                const nextInv = { ...prev.inventory };
                nextInv[produceItemId] = (nextInv[produceItemId] || 0) + 1;

                const nextAnimals = { ...prev.animals };
                if (nextAnimals[targetAnimal.id]) {
                  nextAnimals[targetAnimal.id] = {
                    ...nextAnimals[targetAnimal.id],
                    produk_siap: false,
                    produk_t: 0,
                  };
                }
                return {
                  ...prev,
                  inventory: nextInv,
                  animals: nextAnimals,
                  player: { ...prev.player, exp: prev.player.exp + 25 },
                  stats: { ...prev.stats, produceCollected: prev.stats.produceCollected + 1 },
                };
              });
              showToast(`Mendapatkan 1 ${produceItem?.name || produceItemId}! (+25 EXP)`, '✨');
            },
          });
        }

        setPieMenu({
          isOpen: true,
          title: `${targetAnimal.name} (${targetAnimal.speciesLabel})`,
          subtitle: `Hati: ${'❤️'.repeat(targetAnimal.hearts)} | Kenyang: ${targetAnimal.kenyang}% | Bersih: ${targetAnimal.bersih}%`,
          actions,
        });
        return;
      }
    }

    // 2. Check NPC Interactivity in current Scene
    const currentHour = time.hour;
    const targetNPC = Object.values(npcs).find((npc) => {
      const sched = npc.schedule[currentHour] || npc.schedule[12] || npc.schedule[6];
      if (sched && sched.scene === player.scene) {
        return Math.hypot(sched.x - tx, sched.y - ty) <= 1.2 || (Math.hypot(sched.x - player.x, sched.y - player.y) <= 1.8 && Math.hypot(sched.x - tx, sched.y - ty) <= 2.2);
      }
      return false;
    });

    if (targetNPC) {
      sound.playClick();
      const actions: PieAction[] = [
        {
          id: 'greet',
          label: 'Sapa Ramah (+5 Sosial)',
          icon: '👋',
          color: 'bg-emerald-950 border-emerald-500 text-emerald-200 hover:bg-emerald-900',
          onSelect: () => {
            sound.playClick();
            setState((prev) => ({
              ...prev,
              motives: { ...prev.motives, sosial: Math.min(100, prev.motives.sosial + 8) },
            }));
            const greetings = Array.isArray(targetNPC.dialogues.greeting) ? targetNPC.dialogues.greeting : [targetNPC.dialogues.greeting];
            showToast(`${targetNPC.name}: "${greetings[0]}"`, '💬');
          },
        },
        {
          id: 'talk',
          label: 'Ngobrol Santai (+15 Sosial, +1❤)',
          icon: '💬',
          color: 'bg-amber-950 border-amber-500 text-amber-200 hover:bg-amber-900',
          onSelect: () => {
            sound.playClick();
            const greetings = Array.isArray(targetNPC.dialogues.greeting) ? targetNPC.dialogues.greeting : [targetNPC.dialogues.greeting];
            setDialogue({
              isOpen: true,
              npcId: targetNPC.id,
              text: greetings[Math.floor(Math.random() * greetings.length)],
            });
            setState((prev) => {
              const nextNpcs = { ...prev.npcs };
              if (nextNpcs[targetNPC.id]) {
                nextNpcs[targetNPC.id] = {
                  ...nextNpcs[targetNPC.id],
                  hearts: Math.min(5, nextNpcs[targetNPC.id].hearts + 1),
                };
              }
              return {
                ...prev,
                npcs: nextNpcs,
                motives: { ...prev.motives, sosial: Math.min(100, prev.motives.sosial + 15) },
              };
            });
          },
        },
        {
          id: 'gift',
          label: 'Beri Hadiah (+20 Sosial, +2❤)',
          icon: '🎁',
          color: 'bg-rose-950 border-rose-500 text-rose-200 hover:bg-rose-900',
          onSelect: () => {
            sound.playClick();
            setDialogue({
              isOpen: true,
              npcId: targetNPC.id,
              text: 'Wah, kamu membawakanku sesuatu yang istimewa?',
            });
          },
        },
      ];

      // Role-specific quick access
      if (targetNPC.id === 'bu_sari') {
        actions.push({
          id: 'shop',
          label: 'Belanja di Warung',
          icon: '🛒',
          color: 'bg-amber-900 border-amber-400 text-amber-100 font-bold hover:bg-amber-800',
          onSelect: () => { sound.playClick(); setShowShop(true); },
        });
      } else if (targetNPC.id === 'budi') {
        actions.push({
          id: 'smith',
          label: 'Bengkel Tempa Perkakas',
          icon: '🔨',
          color: 'bg-orange-950 border-orange-500 text-orange-200 font-bold hover:bg-orange-900',
          onSelect: () => { sound.playClick(); setShowSmith(true); },
        });
      } else if (targetNPC.id === 'pak_raka') {
        actions.push({
          id: 'heal',
          label: 'Pemeriksaan Medis (+Full HP & Energi)',
          icon: '💊',
          color: 'bg-teal-950 border-teal-500 text-teal-200 font-bold hover:bg-teal-900',
          onSelect: () => {
            sound.playLevelUp();
            setState((prev) => ({
              ...prev,
              player: { ...prev.player, hp: prev.player.maxHp, energy: prev.player.maxEnergy },
            }));
            showToast('Pak Raka merawat staminamu hingga pulih prima!', '🏥');
          },
        });
      }

      setPieMenu({
        isOpen: true,
        title: `${targetNPC.name} - ${targetNPC.role}`,
        subtitle: `Kepribadian: ${targetNPC.personality} | Persahabatan: ${'❤️'.repeat(targetNPC.hearts)}`,
        actions,
      });
      return;
    }

    // 3. Check Interaction with Special Props & Furniture
    if (tileType === TILES.BED) {
      sound.playClick();
      setPieMenu({
        isOpen: true,
        title: 'Kasur Empuk',
        subtitle: 'Tidur nyenyak untuk memulihkan energi & mulai hari baru',
        actions: [
          {
            id: 'sleep',
            label: 'Tidur Sampai Pagi (06:00)',
            icon: '🛏️',
            color: 'bg-indigo-950 border-indigo-500 text-indigo-200',
            onSelect: () => handleNextDay(),
          },
          {
            id: 'rest',
            label: 'Rebahan Sejenak (+35 Nyaman, +20 Energi)',
            icon: '😴',
            color: 'bg-purple-950 border-purple-500 text-purple-200',
            onSelect: () => {
              sound.playClick();
              setState((prev) => ({
                ...prev,
                player: { ...prev.player, energy: Math.min(prev.player.maxEnergy, prev.player.energy + 20) },
                motives: { ...prev.motives, nyaman: Math.min(100, prev.motives.nyaman + 35) },
              }));
              showToast('Rebahan sejenak di kasur empuk membuat badan segar kembali!', '💤');
            },
          },
        ],
      });
      return;
    }

    if (tileType === TILES.STOVE) {
      sound.playClick();
      setPieMenu({
        isOpen: true,
        title: 'Kompor Dapur & Perapian',
        subtitle: 'Masak hidangan lezat atau seduh kopi segar',
        actions: [
          {
            id: 'cook',
            label: 'Masak Hidangan (Buka Dapur)',
            icon: '🍳',
            color: 'bg-amber-950 border-amber-500 text-amber-200',
            onSelect: () => setShowCooking(true),
          },
          {
            id: 'coffee',
            label: 'Seduh Kopi Panas (+25 Energi, +8 Senang)',
            icon: '☕',
            color: 'bg-stone-900 border-amber-700 text-amber-300',
            onSelect: () => {
              sound.playWater();
              setState((prev) => ({
                ...prev,
                player: { ...prev.player, energy: Math.min(prev.player.maxEnergy, prev.player.energy + 25) },
                motives: {
                  ...prev.motives,
                  senang: Math.min(100, prev.motives.senang + 8),
                  energi: Math.min(100, prev.motives.energi + 25),
                },
              }));
              showToast('Aroma kopi hitam hangat membangkitkan semangatmu!', '☕');
            },
          },
        ],
      });
      return;
    }

    if (tileType === TILES.TABLE) {
      sound.playClick();
      setPieMenu({
        isOpen: true,
        title: 'Meja Makan Kayu Jati',
        subtitle: 'Makan bersama atau duduk santai menikmati suasana',
        actions: [
          {
            id: 'eat',
            label: 'Makan Santai (+45 Lapar, +12 Nyaman)',
            icon: '🍲',
            color: 'bg-amber-950 border-amber-500 text-amber-200',
            onSelect: () => {
              sound.playClick();
              setState((prev) => ({
                ...prev,
                motives: {
                  ...prev.motives,
                  lapar: Math.min(100, prev.motives.lapar + 45),
                  nyaman: Math.min(100, prev.motives.nyaman + 12),
                },
              }));
              showToast('Menikmati santapan di meja makan yang nyaman!', '🍽️');
            },
          },
          {
            id: 'sit',
            label: 'Duduk Berbincang (+30 Sosial)',
            icon: '🪑',
            color: 'bg-stone-900 border-stone-600 text-stone-200',
            onSelect: () => {
              sound.playClick();
              setState((prev) => ({
                ...prev,
                motives: { ...prev.motives, sosial: Math.min(100, prev.motives.sosial + 30) },
              }));
              showToast('Duduk santai menenangkan pikiran...', '🪑');
            },
          },
        ],
      });
      return;
    }

    if (tileType === TILES.COUNTER) {
      sound.playWater();
      setState((prev) => ({
        ...prev,
        motives: { ...prev.motives, higiene: Math.min(100, prev.motives.higiene + 30) },
      }));
      showToast('Mencuci tangan & wajah hingga segar bersih! (+30 Higiene)', '🧼');
      return;
    }

    if (tileType === TILES.SHELF) {
      sound.playClick();
      setActiveTabModal('tas');
      showToast('Membuka lemari penyimpanan...', '🗄️');
      return;
    }

    if (tileType === TILES.SHIPPING_BIN) {
      sound.playClick();
      setActiveTabModal('tas');
      showToast('Pilih hasil panen dari tas untuk dimasukkan ke Peti Pengiriman! (Hasil cair setiap jam 06:00)', '📦');
      return;
    }

    if (tileType === TILES.WELL) {
      sound.playWater();
      setState((prev) => ({
        ...prev,
        motives: {
          ...prev.motives,
          higiene: Math.min(100, prev.motives.higiene + 20),
          nyaman: Math.min(100, prev.motives.nyaman + 10),
        },
      }));
      showToast('Ember penyiram terisi air sumur segar penuh! (+20 Higiene)', '💧');
      return;
    }

    if (tileType === TILES.SHRINE) {
      sound.playLevelUp();
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, energy: Math.min(prev.player.maxEnergy, prev.player.energy + 20), exp: prev.player.exp + 20 },
        motives: { ...prev.motives, senang: Math.min(100, prev.motives.senang + 30) },
      }));
      showToast('Dewi Karsa melimpahkan berkah kesuburan dan ketenangan jiwa! ✨', '⛩️');
      return;
    }

    if (tileType === TILES.TOMB) {
      sound.playClick();
      setState((prev) => ({
        ...prev,
        motives: {
          ...prev.motives,
          senang: Math.min(100, prev.motives.senang + 15),
          sosial: Math.min(100, prev.motives.sosial + 10),
        },
      }));
      showToast('Berdoa dengan khidmat di hadapan makam leluhur Lembah Karsa.', '🕯️');
      return;
    }

    if (tileType === TILES.ANVIL) {
      sound.playClick();
      setShowSmith(true);
      return;
    }

    if (tileType === TILES.LIFE_POD) {
      sound.playLevelUp();
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, hp: prev.player.maxHp, energy: prev.player.maxEnergy },
        motives: {
          ...prev.motives,
          energi: 100,
          nyaman: 100,
          higiene: 100,
        },
      }));
      showToast('Kapsul Life meregenerasi sistem androidmu! Stamina & energi pulih 100%! ⚡', '🔬');
      return;
    }

    if (tileType === TILES.LAB_CONSOLE) {
      sound.playClick();
      setPieMenu({
        isOpen: true,
        title: 'Terminal Riset Dr. Hope',
        subtitle: 'Sistem komputasi otomatisasi pertanian Pulau Paskah',
        actions: [
          {
            id: 'scan',
            label: 'Pindai Satelit Pulau (+25 EXP)',
            icon: '📡',
            color: 'bg-cyan-950 border-cyan-500 text-cyan-200',
            onSelect: () => {
              sound.playLevelUp();
              setState((prev) => ({
                ...prev,
                player: { ...prev.player, exp: prev.player.exp + 25 },
                motives: { ...prev.motives, senang: Math.min(100, prev.motives.senang + 20) },
              }));
              showToast('Satelit memetakan anomali energi di Kuil Air, Magma, dan Hutan!', '🛰️');
            },
          },
          {
            id: 'maglev',
            label: 'Status Maglev Rel Otomatis',
            icon: '🚄',
            color: 'bg-blue-950 border-blue-500 text-blue-200',
            onSelect: () => {
              sound.playClick();
              showToast('Rel Maglev aktif menghubungkan Kebun dan Lab Dr. Hope!', '⚡');
            },
          },
        ],
      });
      return;
    }

    if (tileType === TILES.MOAI_STATUE) {
      sound.playClick();
      setState((prev) => ({
        ...prev,
        motives: {
          ...prev.motives,
          senang: Math.min(100, prev.motives.senang + 15),
          sosial: Math.min(100, prev.motives.sosial + 15),
        },
        player: { ...prev.player, exp: prev.player.exp + 10 },
      }));
      showToast('Mata batu Moai bersinar lembut... bisikan leluhur pulau Paskah menenteramkan jiwamu. 🗿', '✨');
      return;
    }

    if (tileType === TILES.JEWEL_CREST) {
      sound.playLevelUp();
      const crestName = player.scene === 'dungeon_fire' ? 'Segel Permata Api' : player.scene === 'dungeon_forest' ? 'Segel Permata Tanah' : 'Segel Permata Air';
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, exp: prev.player.exp + 35, energy: Math.min(prev.player.maxEnergy, prev.player.energy + 20) },
        motives: { ...prev.motives, senang: Math.min(100, prev.motives.senang + 25) },
      }));
      showToast(`${crestName} beresonansi dengan roh pulau! Kekuatanmu meningkat! (+35 EXP)`, '💎');
      return;
    }

    // 4. Check Portals
    const portal = currentScene.portals.find((p) => Math.abs(p.x - tx) <= 1 && Math.abs(p.y - ty) <= 1);
    if (portal && Math.abs(player.x - tx) <= 1 && Math.abs(player.y - ty) <= 1) {
      sound.playClick();
      setState((prev) => ({
        ...prev,
        player: { ...prev.player, scene: portal.targetScene, x: portal.targetX, y: portal.targetY },
        dungeonFloor: portal.targetScene === 'dungeon' ? (portal.label?.includes('Naik') ? Math.max(1, prev.dungeonFloor - 1) : portal.label?.includes('Turun') ? prev.dungeonFloor + 1 : 1) : 1,
      }));
      refreshMonsters(portal.targetScene, portal.targetScene === 'dungeon' ? stateRef.current.dungeonFloor : 1);
      return;
    }

    // 5. Trigger visual action animation (Story of Seasons AWL style)
    rendererRef.current?.triggerToolAction(tool, tx, ty);

    // Tool Logic
    if (tool === 'cangkul') {
      sound.playHoe();
      if (player.energy < 2) {
        showToast('Terlalu lelah! Makan makanan untuk isi energi.', '⚡');
        return;
      }

      setState((prev) => {
        const nextSoil = { ...prev.soil };
        const existing = nextSoil[soilKey] || { x: tx, y: ty, tilled: false, watered: false, age: 0, kering: 0 };
        existing.tilled = true;
        nextSoil[soilKey] = existing;

        return {
          ...prev,
          player: { ...prev.player, energy: Math.max(0, prev.player.energy - 2) },
          soil: nextSoil,
          quests: prev.quests.map((q) => q.id === 'q_farm_intro' ? { ...q, currentProgress: q.currentProgress + 1 } : q),
        };
      });
    } else if (tool === 'siram') {
      sound.playWater();
      if (player.energy < 1) {
        showToast('Energi habis!', '⚡');
        return;
      }

      setState((prev) => {
        const nextSoil = { ...prev.soil };
        if (nextSoil[soilKey]) {
          nextSoil[soilKey].watered = true;
          nextSoil[soilKey].kering = 0;
          nextSoil[soilKey].layu = false;
        }
        return {
          ...prev,
          player: { ...prev.player, energy: Math.max(0, prev.player.energy - 1) },
          soil: nextSoil,
        };
      });
    } else if (tool === 'tanam') {
      // Find available seeds in inventory
      const seedEntries = Object.entries(inventory).filter(([id, count]) => (id.endsWith('_seed') || id.includes('seed')) && count > 0);
      if (seedEntries.length === 0) {
        showToast('Tidak ada benih di tas! Beli di Warung Bu Sari.', '🌱');
        return;
      }

      // Pick seed or show pie menu if multiple
      const actions: PieAction[] = seedEntries.map(([seedId, count]) => {
        const cropId = seedId.replace('_seed', '');
        const cropSpec = CROPS[cropId];
        return {
          id: seedId,
          label: `${cropSpec?.name || cropId} (x${count})`,
          icon: '🌱',
          color: 'bg-stone-900 border-stone-700 text-stone-200 hover:border-amber-500',
          onSelect: () => {
            sound.playHarvest();
            setState((prev) => {
              const nextSoil = { ...prev.soil };
              const nextInv = { ...prev.inventory };
              nextInv[seedId] = (nextInv[seedId] || 1) - 1;
              if (nextInv[seedId] <= 0) delete nextInv[seedId];

              nextSoil[soilKey] = {
                x: tx,
                y: ty,
                tilled: true,
                watered: false,
                cropId,
                age: 0,
                kering: 0,
                isTree: cropSpec?.is_tree,
              };

              return {
                ...prev,
                soil: nextSoil,
                inventory: nextInv,
                quests: prev.quests.map((q) => q.id === 'q_farm_intro' ? { ...q, currentProgress: q.currentProgress + 1 } : q),
              };
            });
            showToast(`Menanam ${cropSpec?.name || cropId}!`, '🌱');
          },
        };
      });

      setPieMenu({
        isOpen: true,
        title: 'Pilih Benih untuk Ditanam',
        actions,
      });
    } else if (tool === 'sabit' || tool === 'tangan') {
      // Harvest crop if ready
      if (targetTile && targetTile.cropId && (targetTile.siap || targetTile.age >= (CROPS[targetTile.cropId]?.days || 3))) {
        const cropSpec = CROPS[targetTile.cropId];
        if (cropSpec) {
          sound.playHarvest();
          rendererRef.current?.triggerHarvestCelebration(cropSpec.id);
          const yieldCount = cropSpec.hasil || 1;

          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[cropSpec.id] = (nextInv[cropSpec.id] || 0) + yieldCount;

            const nextSoil = { ...prev.soil };
            if (cropSpec.is_tree || cropSpec.tumbuh_lagi > 0) {
              // Regrowth
              nextSoil[soilKey].siap = false;
              nextSoil[soilKey].buah_t = 0;
            } else {
              delete nextSoil[soilKey];
            }

            return {
              ...prev,
              inventory: nextInv,
              soil: nextSoil,
              player: { ...prev.player, exp: prev.player.exp + 15 },
              stats: { ...prev.stats, cropsHarvested: prev.stats.cropsHarvested + yieldCount },
              quests: prev.quests.map((q) => q.id === 'q_farm_intro' ? { ...q, currentProgress: q.currentProgress + 1 } : q),
            };
          });

          showToast(`Panen +${yieldCount} ${cropSpec.name}! (+15 EXP)`, '🌾');
        }
      }
    } else if (tool === 'beliung') {
      // Mining Ores & Rocks
      if (tileType === TILES.ORE_COPPER || tileType === TILES.ORE_IRON || tileType === TILES.ORE_GOLD || tileType === TILES.ORE_MITHRIL || tileType === TILES.CRYSTAL) {
        sound.playHit();
        const oreId = tileType === TILES.ORE_COPPER ? 'bijih_tembaga' : tileType === TILES.ORE_IRON ? 'bijih_besi' : tileType === TILES.ORE_GOLD ? 'bijih_emas' : tileType === TILES.ORE_MITHRIL ? 'bijih_mithril' : 'kristal_jiwa';
        const oreItem = ITEMS[oreId];

        setState((prev) => {
          const nextInv = { ...prev.inventory };
          nextInv[oreId] = (nextInv[oreId] || 0) + 1;

          return {
            ...prev,
            inventory: nextInv,
            player: { ...prev.player, exp: prev.player.exp + 20, energy: Math.max(0, prev.player.energy - 3) },
            stats: { ...prev.stats, oresMined: prev.stats.oresMined + 1 },
            quests: prev.quests.map((q) => q.targetId === oreId ? { ...q, currentProgress: q.currentProgress + 1 } : q),
          };
        });

        showToast(`Mendapatkan 1 ${oreItem?.name || oreId}! (+20 EXP)`, '⛏️');
      }
    } else if (tool === 'pancing') {
      // Check if water is nearby
      const hasWater =
        currentScene.layout[ty]?.[tx] === TILES.WATER ||
        currentScene.layout[ty]?.[tx] === TILES.DEEP_WATER ||
        currentScene.layout[player.y]?.[player.x] === TILES.DOCK;
      if (hasWater) {
        setShowFishing(true);
      } else {
        showToast('Menghadaplah ke danau, samudra, atau dermaga untuk memancing!', '🎣');
      }
    }
  }, [handleNextDay, refreshMonsters, showToast]);

  // Attack Action for sword against monsters
  const handleAttack = useCallback(() => {
    sound.playSwordSwing();
    rendererRef.current?.triggerToolAction('pedang');

    const { player } = stateRef.current;
    const tierBonus = player.toolTiers.pedang === 'Mithril' ? 40 : player.toolTiers.pedang === 'Emas' ? 25 : player.toolTiers.pedang === 'Besi' ? 15 : player.toolTiers.pedang === 'Tembaga' ? 8 : 0;
    const playerAtk = 15 + player.level * 4 + tierBonus;

    // Find monster within 2 tiles radius
    setMonsters((prevMobs) => {
      let hitAny = false;
      const nextMobs: MonsterEntity[] = [];

      prevMobs.forEach((mob) => {
        const dist = Math.hypot(mob.x - player.x, mob.y - player.y);
        if (dist <= 2.2) {
          hitAny = true;
          sound.playHit();
          const nextHp = mob.hp - playerAtk;

          if (nextHp <= 0) {
            // Monster defeated!
            sound.playLevelUp();
            showToast(`${mob.name} berhasil dikalahkan! (+${mob.exp} EXP)`, '⚔️');

            setState((prev) => {
              const nextInv = { ...prev.inventory };
              mob.drops.forEach((d) => {
                if (Math.random() <= d.chance) {
                  nextInv[d.itemId] = (nextInv[d.itemId] || 0) + 1;
                }
              });

              return {
                ...prev,
                inventory: nextInv,
                player: { ...prev.player, exp: prev.player.exp + mob.exp },
                stats: { ...prev.stats, monstersDefeated: prev.stats.monstersDefeated + 1 },
                quests: prev.quests.map((q) => q.type === 'monster' ? { ...q, currentProgress: q.currentProgress + 1 } : q),
              };
            });
          } else {
            nextMobs.push({ ...mob, hp: nextHp });
          }
        } else {
          nextMobs.push(mob);
        }
      });

      if (!hitAny) {
        showToast('Tebasan pedang di udara!', '⚔️');
      }

      return nextMobs;
    });
  }, [showToast]);

  // Mount Three.js Renderer
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const renderer = new GameRenderer3D(canvasContainerRef.current, {
      onTileClick: (tx, ty) => {
        // Move player towards clicked tile, and interact if adjacent
        const s = stateRef.current;
        const dist = Math.hypot(s.player.x - tx, s.player.y - ty);

        if (dist > 1.8) {
          // Walk to tile
          setState((prev) => ({ ...prev, player: { ...prev.player, x: tx, y: ty } }));
        } else {
          handlePerformAction(tx, ty);
        }
      },
      onTileHover: () => {},
      onEntityClick: (type, id) => {
        if (type === 'animal') {
          const animal = stateRef.current.animals[id];
          if (animal) {
            sound.playAnimalAmbient(animal.type);
            renderer.triggerAnimalEmote(animal.id);
            const quote = sound.getAnimalSoundQuote(animal.type);
            showToast(`${animal.name}: "${quote.text}"`, quote.icon);
          }
        }
      },
    });

    if (stateRef.current.ps2Settings) {
      renderer.updatePS2Settings(stateRef.current.ps2Settings);
    }

    rendererRef.current = renderer;

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [handlePerformAction, showToast]);

  // Keep 3D scene in sync with GameState & Monsters
  useEffect(() => {
    rendererRef.current?.renderScene(state, monsters);
    rendererRef.current?.updatePlayerPosition(state.player.x, state.player.y);
    if (state.ps2Settings) {
      rendererRef.current?.updatePS2Settings(state.ps2Settings);
    }
  }, [state, monsters]);

  // Sync BGM with current scene
  useEffect(() => {
    sound.setEnabled(soundEnabled);
    if (soundEnabled) {
      sound.playSceneBGM(state.player.scene);
    } else {
      sound.stopBGM();
    }
  }, [state.player.scene, soundEnabled]);

  // ─── ANIMAL AMBIENT PROXIMITY SOUND SYSTEM (Farm Scene) ───
  const prevNearAnimalsRef = useRef<Set<string>>(new Set());

  // 1. Approach Detection: Play animal greeting sound when player walks close to an animal in 'farm'
  useEffect(() => {
    if (!soundEnabled || state.player.scene !== 'farm') {
      prevNearAnimalsRef.current.clear();
      return;
    }

    const px = state.player.x;
    const py = state.player.y;
    const proximityRadius = 3.2; // tiles threshold for being near an animal
    const currentNear = new Set<string>();

    const animalsList = Object.values(state.animals);
    const nearby = animalsList.filter((a) => {
      const dist = Math.hypot(a.x - px, a.y - py);
      return dist <= proximityRadius;
    });

    nearby.forEach((a) => currentNear.add(a.id));

    // Find animals player has just approached
    const newlyApproached = nearby.filter((a) => !prevNearAnimalsRef.current.has(a.id));

    if (newlyApproached.length > 0) {
      // Pick closest newly approached animal
      newlyApproached.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
      const target = newlyApproached[0];

      const timer = window.setTimeout(() => {
        if (stateRef.current.player.scene === 'farm') {
          const played = sound.playAnimalAmbientWithCooldown(target.id, target.type, 7000);
          if (played) {
            rendererRef.current?.triggerAnimalEmote(target.id);
            const quote = sound.getAnimalSoundQuote(target.type);
            showToast(`${target.name}: "${quote.text}"`, quote.icon);
          }
        }
      }, 350);

      prevNearAnimalsRef.current = currentNear;
      return () => window.clearTimeout(timer);
    }

    prevNearAnimalsRef.current = currentNear;
  }, [state.player.x, state.player.y, state.player.scene, state.animals, soundEnabled, showToast]);

  // 2. Lingering Ambient Loop: Periodically play a random ambient noise while player stays near animals in 'farm'
  useEffect(() => {
    if (!soundEnabled || state.player.scene !== 'farm') return;

    let isCancelled = false;
    let timeoutId: number;

    const scheduleNextAmbient = () => {
      // Random interval between 4.5s and 8.0s
      const delayMs = 4500 + Math.random() * 3500;
      timeoutId = window.setTimeout(() => {
        if (isCancelled) return;

        const s = stateRef.current;
        if (s.player.scene === 'farm') {
          const px = s.player.x;
          const py = s.player.y;
          const nearby = Object.values(s.animals).filter((a) => Math.hypot(a.x - px, a.y - py) <= 3.6);

          if (nearby.length > 0) {
            // Pick a random nearby animal to make an ambient noise
            const randomAnimal = nearby[Math.floor(Math.random() * nearby.length)];
            const played = sound.playAnimalAmbientWithCooldown(randomAnimal.id, randomAnimal.type, 7500);
            if (played) {
              rendererRef.current?.triggerAnimalEmote(randomAnimal.id);
              const quote = sound.getAnimalSoundQuote(randomAnimal.type);
              showToast(`${randomAnimal.name}: "${quote.text}"`, quote.icon);
            }
          }
        }

        if (!isCancelled) {
          scheduleNextAmbient();
        }
      }, delayMs);
    };

    scheduleNextAmbient();

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [state.player.scene, soundEnabled, showToast]);

  // Keyboard Movement & Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialogue.isOpen || showCharCreation || showCooking || showShop || showSmith || showFishing || activeTabModal) return;

      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setState((prev) => {
          const currentScene = SCENES[prev.player.scene] || SCENES.farm;
          const nextX = Math.max(1, Math.min(currentScene.width - 2, prev.player.x + dx));
          const nextY = Math.max(1, Math.min(currentScene.height - 2, prev.player.y + dy));
          return {
            ...prev,
            player: { ...prev.player, x: nextX, y: nextY },
          };
        });
      }

      // Hotbar Number Keys 1-8 (Matching original Ursina bindings)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        const toolList: ToolType[] = ['cangkul', 'siram', 'tanam', 'sabit', 'kapak', 'beliung', 'pedang', 'pancing'];
        setState((prev) => ({ ...prev, player: { ...prev.player, activeTool: toolList[num - 1] } }));
        return;
      }

      // Action Keys (Ursina match)
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePerformAction(stateRef.current.player.x, stateRef.current.player.y);
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleAttack();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handlePerformAction(stateRef.current.player.x, stateRef.current.player.y);
      } else if (e.key === 't' || e.key === 'T') {
        // Sleep in house
        if (stateRef.current.player.scene === 'house') {
          handleNextDay();
          showToast('Tidur nyenyak hingga pagi...', '🛏️');
        } else {
          showToast('Kamu hanya bisa tidur di dalam Rumah!', '🏡');
        }
      } else if (e.key === 'F2' || e.key === 'c' || e.key === 'C') {
        setShowCharCreation((prev) => !prev);
      }

      // Panel Shortcuts (Ursina match)
      if (e.key === 'i' || e.key === 'I') {
        setActiveTabModal((prev) => (prev === 'tas' ? null : 'tas'));
      } else if (e.key === 'k' || e.key === 'K') {
        setActiveTabModal((prev) => (prev === 'kalender' ? null : 'kalender'));
      } else if (e.key === 'm' || e.key === 'M') {
        setActiveTabModal((prev) => (prev === 'peta' ? null : 'peta'));
      } else if (e.key === 'j' || e.key === 'J') {
        setActiveTabModal((prev) => (prev === 'misi' ? null : 'misi'));
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTabModal((prev) => (prev === 'warga' ? null : 'warga'));
      } else if (e.key === 'Escape') {
        setActiveTabModal(null);
        setDialogue({ isOpen: false, npcId: null, text: '' });
        setShowFishing(false);
        setShowCooking(false);
        setShowShop(false);
        setShowSmith(false);
        setPieMenu({ isOpen: false, title: '', actions: [] });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogue.isOpen, showCharCreation, showCooking, showShop, showSmith, showFishing, activeTabModal, handlePerformAction, handleAttack]);

  // Real-time In-game Clock Ticker (1 real second = 1 sim minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.time.paused) return prev;

        const nextMin = prev.time.minute + 1;
        let nextHour = prev.time.hour;

        if (nextMin >= 60) {
          nextHour += 1;
        }

        // Midnight auto-exhaustion check
        if (nextHour >= 24) {
          handleNextDay();
          return prev;
        }

        // Sims 8-Motive decay
        const nextMotives = tickMotives(prev.motives, 1);

        return {
          ...prev,
          time: {
            ...prev.time,
            hour: nextHour,
            minute: nextMin >= 60 ? 0 : nextMin,
          },
          motives: nextMotives,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleNextDay]);

  const currentSceneName = SCENES[state.player.scene]?.name || 'Lembah Karsa';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

      {/* Floating Notifications Toasts */}
      <div className="absolute top-20 right-4 z-40 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900/95 border border-amber-500/60 shadow-xl backdrop-blur-md text-xs font-bold text-stone-100 animate-fade-in"
          >
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Primary In-Game HUD */}
      <HUD
        state={state}
        activeTool={state.player.activeTool}
        onSelectTool={(t) => setState((prev) => ({ ...prev, player: { ...prev.player, activeTool: t } }))}
        onOpenTab={(tab) => setActiveTabModal(tab)}
        onActionClick={() => handlePerformAction(state.player.x, state.player.y)}
        onAttackClick={handleAttack}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sound.setEnabled(next);
        }}
        soundEnabled={soundEnabled}
        locationName={currentSceneName}
      />

      {/* Contextual Radial Pie Menu */}
      <ActionPieMenu
        isOpen={pieMenu.isOpen}
        title={pieMenu.title}
        subtitle={pieMenu.subtitle}
        actions={pieMenu.actions}
        onClose={() => setPieMenu({ isOpen: false, title: '', actions: [] })}
      />

      {/* Story & NPC Dialogue Modal */}
      <DialogueBox
        isOpen={dialogue.isOpen}
        npc={dialogue.npcId ? state.npcs[dialogue.npcId] : null}
        text={dialogue.text}
        inventory={state.inventory}
        onClose={() => setDialogue({ isOpen: false, npcId: null, text: '' })}
        onGiveGift={(itemId) => {
          if (!dialogue.npcId) return;
          const npc = state.npcs[dialogue.npcId];
          const isLoved = npc.lovedGifts.includes(itemId);
          const heartBoost = isLoved ? 2 : 1;

          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[itemId] = (nextInv[itemId] || 1) - 1;
            if (nextInv[itemId] <= 0) delete nextInv[itemId];

            const nextNpcs = { ...prev.npcs };
            nextNpcs[dialogue.npcId!] = {
              ...npc,
              hearts: Math.min(5, npc.hearts + heartBoost),
              giftedToday: true,
            };

            return { ...prev, inventory: nextInv, npcs: nextNpcs };
          });

          showToast(`${npc.name} menerima hadiahmu dengan gembira! (+${heartBoost} ♥)`, '🎁');
          setDialogue({
            isOpen: true,
            npcId: dialogue.npcId,
            text: isLoved ? npc.dialogues.giftLoved : npc.dialogues.giftLiked,
          });
        }}
      />

      {/* Fishing Mini-Game */}
      <FishingMiniGame
        isOpen={showFishing}
        sceneId={state.player.scene}
        onCatch={(fishId) => {
          setShowFishing(false);
          const fishItem = ITEMS[fishId];
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[fishId] = (nextInv[fishId] || 0) + 1;
            return {
              ...prev,
              inventory: nextInv,
              player: { ...prev.player, exp: prev.player.exp + 35 },
              stats: { ...prev.stats, fishCaught: prev.stats.fishCaught + 1 },
              quests: prev.quests.map((q) => q.type === 'fish' ? { ...q, currentProgress: q.currentProgress + 1 } : q),
            };
          });
          showToast(`Berhasil menangkap 1 ${fishItem?.name || fishId}! (+35 EXP)`, '🐟');
        }}
        onClose={() => setShowFishing(false)}
      />

      {/* Cooking Workshop Modal */}
      <CookingPanel
        isOpen={showCooking}
        inventory={state.inventory}
        playerEnergy={state.player.energy}
        onCook={(recipe: Recipe) => {
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            Object.entries(recipe.ingredients).forEach(([ingId, needed]) => {
              nextInv[ingId] = (nextInv[ingId] || needed) - needed;
              if (nextInv[ingId] <= 0) delete nextInv[ingId];
            });
            nextInv[recipe.outputId] = (nextInv[recipe.outputId] || 0) + recipe.outputCount;

            return {
              ...prev,
              inventory: nextInv,
              player: {
                ...prev.player,
                energy: Math.max(0, prev.player.energy - recipe.energyCost),
                exp: prev.player.exp + 25,
              },
              quests: prev.quests.map((q) => q.type === 'cook' ? { ...q, currentProgress: q.currentProgress + 1 } : q),
            };
          });
          showToast(`Selesai memasak ${recipe.name}! (+25 EXP)`, '🍲');
        }}
        onClose={() => setShowCooking(false)}
      />

      {/* Warung Bu Sari Shop Modal */}
      <ShopModal
        isOpen={showShop}
        playerGold={state.player.gold}
        inventory={state.inventory}
        onBuy={(item: ItemDef, count: number) => {
          const cost = (item.buyPrice || 10) * count;
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[item.id] = (nextInv[item.id] || 0) + count;
            return {
              ...prev,
              inventory: nextInv,
              player: { ...prev.player, gold: prev.player.gold - cost },
            };
          });
          showToast(`Membeli ${count}x ${item.name}!`, '🛍️');
        }}
        onSell={(item: ItemDef, count: number) => {
          const earnings = item.sellPrice * count;
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[item.id] = (nextInv[item.id] || count) - count;
            if (nextInv[item.id] <= 0) delete nextInv[item.id];
            return {
              ...prev,
              inventory: nextInv,
              player: { ...prev.player, gold: prev.player.gold + earnings },
              stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + earnings },
            };
          });
          showToast(`Menjual ${count}x ${item.name} seharga +${earnings} G!`, '💰');
        }}
        onClose={() => setShowShop(false)}
      />

      {/* Bengkel Pandai Budi Upgrade Modal */}
      <SmithModal
        isOpen={showSmith}
        playerGold={state.player.gold}
        inventory={state.inventory}
        toolTiers={state.player.toolTiers}
        onUpgradeTool={(tool, nextTier, gold, ore) => {
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[ore.id] = (nextInv[ore.id] || ore.count) - ore.count;
            if (nextInv[ore.id] <= 0) delete nextInv[ore.id];

            const nextTiers = { ...prev.player.toolTiers, [tool]: nextTier };
            return {
              ...prev,
              inventory: nextInv,
              player: {
                ...prev.player,
                gold: prev.player.gold - gold,
                toolTiers: nextTiers,
                exp: prev.player.exp + 100,
              },
            };
          });
          showToast(`Berhasil menempa upgrade ${tool} menjadi ${nextTier}! ✨`, '🔨');
        }}
        onClose={() => setShowSmith(false)}
      />

      {/* Character Creation Modal */}
      <CharacterCreationModal
        isOpen={showCharCreation}
        initialAppearance={state.player.appearance}
        onConfirm={(app) => {
          setShowCharCreation(false);
          setState((prev) => ({
            ...prev,
            player: { ...prev.player, name: app.name || 'Petani Karsa', appearance: app },
          }));
          showToast(`Selamat datang di Lembah Karsa, ${app.name || 'Petani'}!`, '🌾');
        }}
      />

      {/* Fullscreen Overlay Tabs */}
      <TabModals
        isOpen={activeTabModal !== null}
        activeTab={activeTabModal || 'tas'}
        state={state}
        onSelectTab={(t) => setActiveTabModal(t)}
        onEatItem={(itemId) => {
          const item = ITEMS[itemId];
          if (!item) return;
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[itemId] = (nextInv[itemId] || 1) - 1;
            if (nextInv[itemId] <= 0) delete nextInv[itemId];

            const nextMotives = { ...prev.motives };
            nextMotives.lapar = Math.min(100, nextMotives.lapar + (item.healHp ? item.healHp * 1.5 : 30));

            return {
              ...prev,
              inventory: nextInv,
              player: {
                ...prev.player,
                hp: Math.min(prev.player.maxHp, prev.player.hp + (item.healHp || 10)),
                energy: Math.min(prev.player.maxEnergy, prev.player.energy + (item.healEnergy || 15)),
              },
              motives: nextMotives,
            };
          });
          showToast(`Memakan ${item.name}, memulihkan vitalitas!`, '🍎');
        }}
        onShipItem={(itemId, count) => {
          const item = ITEMS[itemId];
          if (!item) return;
          setState((prev) => {
            const nextInv = { ...prev.inventory };
            nextInv[itemId] = (nextInv[itemId] || count) - count;
            if (nextInv[itemId] <= 0) delete nextInv[itemId];

            const nextBin = { ...prev.shippingBin };
            nextBin[itemId] = (nextBin[itemId] || 0) + count;

            return { ...prev, inventory: nextInv, shippingBin: nextBin };
          });
          showToast(`Memasukkan ${item.name} ke Peti Pengiriman!`, '📦');
        }}
        onClaimQuest={(qId) => {
          const quest = state.quests.find((q) => q.id === qId);
          if (!quest) return;
          setState((prev) => ({
            ...prev,
            player: {
              ...prev.player,
              gold: prev.player.gold + quest.rewardGold,
              exp: prev.player.exp + quest.rewardExp,
            },
            quests: prev.quests.map((q) => q.id === qId ? { ...q, completed: true } : q),
          }));
          showToast(`Klaim Hadiah: +${quest.rewardGold} G & +${quest.rewardExp} EXP!`, '🎉');
        }}
        onTeleport={(sceneId, x, y) => {
          setState((prev) => ({
            ...prev,
            player: { ...prev.player, scene: sceneId, x, y },
          }));
          refreshMonsters(sceneId);
        }}
        onSaveGame={handleSaveGame}
        onResetGame={() => {
          localStorage.removeItem(SAVE_KEY);
          setState(DEFAULT_STATE);
          setShowCharCreation(true);
        }}
        onUpdatePS2Settings={handleUpdatePS2Settings}
        onClose={() => setActiveTabModal(null)}
      />

      {/* PS2 Memory Card (8MB) Save Overlay */}
      <PS2SaveOverlay isOpen={showPS2Save} state={state} />
    </div>
  );
}
