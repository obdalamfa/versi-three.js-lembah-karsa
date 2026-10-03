// ─── HARVEST MOON: A WONDERFUL LIFE 3D - MAIN APPLICATION COMPONENT ───
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AWLWorld3D } from './engine/AWLWorld3D';
import { awlAudio } from './systems/awlAudio';
import { AWLHUD } from './components/AWLHUD';
import { AWLDialogueModal } from './components/AWLDialogueModal';
import { AWLBagModal } from './components/AWLBagModal';
import { AWLFarmManagementModal } from './components/AWLFarmManagementModal';
import { AWLDigSiteModal } from './components/AWLDigSiteModal';
import { AWLFishingModal } from './components/AWLFishingModal';
import { AWLCookingModal } from './components/AWLCookingModal';
import { AWLDiaryModal } from './components/AWLDiaryModal';
import { AWLShippingModal } from './components/AWLShippingModal';

import {
  AWLGameState,
  ToolType,
  CropId,
  Season,
  SoilTileState,
  Recipe,
  DigSiteRelic,
} from './types/awlTypes';
import {
  CROPS,
  INITIAL_ANIMALS,
  INITIAL_VILLAGERS,
  INITIAL_INVENTORY,
} from './data/awlData';

const SAVE_KEY = 'harvestmoon_awl_3d_save';

// Create 5x5 Initial Farm Soil Plot (-4 to 0, -4 to 0)
const createInitialSoil = (): Record<string, SoilTileState> => {
  const soil: Record<string, SoilTileState> = {};
  for (let x = -4; x <= 0; x++) {
    for (let z = -4; z <= 0; z++) {
      const key = `${x}_${z}`;
      // Give 3 pre-tilled starter plots with sprouts
      const isStartCrop = x === -2 && z === -2;
      soil[key] = {
        x,
        z,
        tilled: isStartCrop || (x >= -3 && z >= -3),
        watered: isStartCrop,
        cropId: isStartCrop ? 'tomat' : null,
        stage: isStartCrop ? 2 : 0,
        daysGrown: isStartCrop ? 2 : 0,
        isHarvestable: false,
      };
    }
  }
  return soil;
};

const DEFAULT_STATE: AWLGameState = {
  chapter: 1,
  chapterTitle: 'Bab 1: Awal Petualangan di Forget-Me-Not Valley',
  time: {
    day: 1,
    season: 'spring',
    year: 1,
    hour: 6,
    minute: 30,
    weather: 'sunny',
    paused: false,
  },
  player: {
    x: 0,
    z: 0,
    rotation: 0,
    activeTool: 'cangkul',
    activeSeed: 'benih_tomat' as unknown as CropId,
  },
  stats: {
    stamina: 100,
    maxStamina: 100,
    fullness: 90,
    gold: 500,
    cropsHarvested: 0,
    milkCollected: 0,
    fishCaught: 0,
    relicsFound: 0,
    daysLived: 1,
    isRidingHorse: false,
  },
  soil: createInitialSoil(),
  animals: INITIAL_ANIMALS,
  villagers: INITIAL_VILLAGERS,
  inventory: INITIAL_INVENTORY,
  shippingBin: {},
  shippingHistory: [],
  currentRecord: 'breeze',
};

export const App: React.FC = () => {
  const [state, setState] = useState<AWLGameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_STATE;
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<
    'bag' | 'animals' | 'cooking' | 'diary' | 'shipping' | 'digSite' | 'fishing' | null
  >(null);
  const [talkingVillagerId, setTalkingVillagerId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; text: string; icon?: string }[]>([]);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<AWLWorld3D | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const showToast = useCallback((text: string, icon = '✨') => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev.slice(-3), { id, text, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // ─── DAILY ADVANCEMENT & TAKAKURA SHIPPING ───
  const advanceToNextDay = useCallback(() => {
    setState((prev) => {
      const nextDay = prev.time.day + 1;
      let nextSeason: Season = prev.time.season;
      let nextYear = prev.time.year;

      if (nextDay > 10) {
        // AWL 10-day season cycle!
        const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
        const curIdx = seasons.indexOf(prev.time.season);
        nextSeason = seasons[(curIdx + 1) % 4];
        if (curIdx === 3) nextYear += 1;
      }

      const nextDayNum = nextDay > 10 ? 1 : nextDay;

      // 1. Calculate Shipping Bin revenue
      let totalEarned = 0;
      Object.entries(prev.shippingBin).forEach(([id, count]) => {
        const item = prev.inventory[id];
        const price = item?.sellPrice || 50;
        totalEarned += price * count;
      });

      // 2. Growth tick for crops
      const nextSoil: Record<string, SoilTileState> = {};
      Object.entries(prev.soil).forEach(([key, tile]) => {
        const t = { ...tile };
        if (t.cropId && t.watered) {
          t.daysGrown += 1;
          const def = CROPS[t.cropId];
          if (def) {
            // Stage progression
            const newStage = Math.min(4, Math.floor((t.daysGrown / def.growthDays) * 4));
            t.stage = newStage;
            t.isHarvestable = newStage === 4;
          }
        }
        // Soil dries up for new day
        t.watered = false;
        nextSoil[key] = t;
      });

      // 3. Animal daily tick
      const nextAnimals = { ...prev.animals };
      Object.entries(nextAnimals).forEach(([id, a]) => {
        nextAnimals[id] = {
          ...a,
          hasProductToday: true,
          hunger: Math.max(20, a.hunger - 30),
          cleanliness: Math.max(25, a.cleanliness - 20),
        };
      });

      showToast(
        `Selamat pagi! Hari ke-${nextDayNum} ${nextSeason.toUpperCase()}. Takakura menyetorkan ${totalEarned} G ke tabunganmu!`,
        '☀️'
      );
      awlAudio.playChimes([261, 329, 392, 523], 0.35);

      return {
        ...prev,
        time: {
          ...prev.time,
          day: nextDayNum,
          season: nextSeason,
          year: nextYear,
          hour: 6,
          minute: 0,
          weather: Math.random() < 0.25 ? 'rainy' : 'sunny',
        },
        stats: {
          ...prev.stats,
          stamina: prev.stats.maxStamina,
          fullness: 80,
          gold: prev.stats.gold + totalEarned,
          daysLived: prev.stats.daysLived + 1,
        },
        soil: nextSoil,
        animals: nextAnimals,
        shippingBin: {},
        shippingHistory: totalEarned > 0 ? [...prev.shippingHistory, { day: prev.time.day, season: prev.time.season, totalEarned }] : prev.shippingHistory,
      };
    });
  }, [showToast]);

  // ─── ACTIONS ON TILE / ENTITY ───
  const handlePerformAction = useCallback(() => {
    const s = stateRef.current;
    const { player, soil, stats, inventory, animals } = s;
    const tool = player.activeTool;

    // Check adjacent animals first
    const nearAnimal = Object.values(animals).find(
      (a) => Math.hypot(a.position.x - player.x, a.position.z - player.z) <= 2.2
    );

    if (nearAnimal) {
      if (tool === 'pemerah') {
        if (nearAnimal.type === 'sapi' || nearAnimal.type === 'sapi_jersey') {
          if (nearAnimal.hasProductToday) {
            awlAudio.playMilk();
            worldRef.current?.spawnHarvestCelebration(nearAnimal.position.x, nearAnimal.position.z);
            const milkId = nearAnimal.productQuality === 'S' ? 'susu_s' : nearAnimal.productQuality === 'A' ? 'susu_a' : 'susu_b';
            setState((prev) => ({
              ...prev,
              animals: {
                ...prev.animals,
                [nearAnimal.id]: { ...prev.animals[nearAnimal.id], hasProductToday: false },
              },
              inventory: {
                ...prev.inventory,
                [milkId]: {
                  id: milkId,
                  name: `Susu Segar (Grade ${nearAnimal.productQuality})`,
                  category: 'animal_product',
                  count: (prev.inventory[milkId]?.count || 0) + 1,
                  sellPrice: nearAnimal.productQuality === 'S' ? 150 : nearAnimal.productQuality === 'A' ? 115 : 80,
                  icon: '🥛',
                  description: 'Susu murni kental dan manis diperah langsung dari sapi lembah.',
                },
              },
              stats: { ...prev.stats, milkCollected: prev.stats.milkCollected + 1 },
            }));
            showToast(`Memerah 1 ${nearAnimal.name}! (+Susu Grade ${nearAnimal.productQuality})`, '🥛');
            return;
          } else {
            showToast(`${nearAnimal.name} sudah diperah hari ini. Tunggu besok pagi ya!`, '🐮');
            return;
          }
        }
      } else if (tool === 'sikat') {
        awlAudio.playShear();
        worldRef.current?.spawnHeartEmote(nearAnimal.position.x, nearAnimal.position.z);
        setState((prev) => ({
          ...prev,
          animals: {
            ...prev.animals,
            [nearAnimal.id]: {
              ...prev.animals[nearAnimal.id],
              cleanliness: 100,
              hearts: Math.min(5, prev.animals[nearAnimal.id].hearts + 1),
            },
          },
        }));
        showToast(`Menyikat bulu ${nearAnimal.name} hingga berkilau bersih! ✨`, '🪮');
        return;
      } else if (tool === 'gunting' && nearAnimal.type === 'domba') {
        if (nearAnimal.hasProductToday) {
          awlAudio.playShear();
          worldRef.current?.spawnHarvestCelebration(nearAnimal.position.x, nearAnimal.position.z);
          setState((prev) => ({
            ...prev,
            animals: {
              ...prev.animals,
              [nearAnimal.id]: { ...prev.animals[nearAnimal.id], hasProductToday: false },
            },
            inventory: {
              ...prev.inventory,
              wol_lembut: {
                id: 'wol_lembut',
                name: 'Wol Domba Lembut',
                category: 'animal_product',
                count: (prev.inventory.wol_lembut?.count || 0) + 1,
                sellPrice: 200,
                icon: '🧶',
                description: 'Gulungan bulu wol putih lembut dicukur dari domba Shaun.',
              },
            },
          }));
          showToast(`Berhasil mencukur bulu wol Shaun! (+200 G)`, '✂️');
          return;
        } else {
          showToast('Bulu Shaun belum cukup tebal untuk dicukur kembali.', '🐑');
          return;
        }
      }
    }

    // Target Soil Tile coordinates under/in front of player
    const tx = Math.round(player.x);
    const tz = Math.round(player.z);
    const tileKey = `${tx}_${tz}`;
    const targetSoil = soil[tileKey];

    if (tool === 'cangkul') {
      awlAudio.playHoe();
      worldRef.current?.spawnWaterSplash(tx, tz);
      setState((prev) => ({
        ...prev,
        stats: { ...prev.stats, stamina: Math.max(0, prev.stats.stamina - 2) },
        soil: {
          ...prev.soil,
          [tileKey]: {
            x: tx,
            z: tz,
            tilled: true,
            watered: prev.soil[tileKey]?.watered || false,
            cropId: prev.soil[tileKey]?.cropId || null,
            stage: prev.soil[tileKey]?.stage || 0,
            daysGrown: prev.soil[tileKey]?.daysGrown || 0,
            isHarvestable: prev.soil[tileKey]?.isHarvestable || false,
          },
        },
      }));
      showToast('Tanah berhasil dicangkul subur!', '⛏️');
    } else if (tool === 'penyiram') {
      if (targetSoil && targetSoil.tilled) {
        awlAudio.playWater();
        worldRef.current?.spawnWaterSplash(tx, tz);
        setState((prev) => ({
          ...prev,
          stats: { ...prev.stats, stamina: Math.max(0, prev.stats.stamina - 1) },
          soil: {
            ...prev.soil,
            [tileKey]: { ...targetSoil, watered: true },
          },
        }));
        showToast('Tanaman disiram air segar!', '💧');
      } else {
        showToast('Cangkul tanah terlebih dahulu sebelum menyiram.', '💧');
      }
    } else if (tool === 'benih') {
      if (targetSoil && targetSoil.tilled && !targetSoil.cropId) {
        const seedId = `benih_${player.activeSeed}`;
        const hasSeed = (inventory[seedId]?.count || 0) > 0;
        if (!hasSeed) {
          showToast(`Benih ${player.activeSeed} habis di tasmu! Beli di Vesta.`, '🌱');
          return;
        }
        awlAudio.playHarvest();
        setState((prev) => {
          const nextInv = { ...prev.inventory };
          nextInv[seedId].count -= 1;
          return {
            ...prev,
            inventory: nextInv,
            soil: {
              ...prev.soil,
              [tileKey]: {
                ...targetSoil,
                cropId: player.activeSeed,
                stage: 0,
                daysGrown: 0,
                isHarvestable: false,
              },
            },
          };
        });
        showToast(`Menanam bibit ${CROPS[player.activeSeed]?.name || player.activeSeed}!`, '🌱');
      }
    } else if (tool === 'sabit') {
      if (targetSoil && targetSoil.cropId && targetSoil.isHarvestable) {
        const cropDef = CROPS[targetSoil.cropId];
        awlAudio.playHarvest();
        worldRef.current?.spawnHarvestCelebration(tx, tz);
        setState((prev) => {
          const nextInv = { ...prev.inventory };
          const cId = targetSoil.cropId!;
          nextInv[cId] = {
            id: cId,
            name: cropDef?.name || cId,
            category: 'produce',
            count: (nextInv[cId]?.count || 0) + 1,
            sellPrice: cropDef?.sellPrice || 50,
            icon: '🍅',
            description: cropDef?.description || 'Hasil panen segar.',
          };

          return {
            ...prev,
            inventory: nextInv,
            stats: { ...prev.stats, cropsHarvested: prev.stats.cropsHarvested + 1 },
            soil: {
              ...prev.soil,
              [tileKey]: { ...targetSoil, cropId: null, stage: 0, daysGrown: 0, isHarvestable: false },
            },
          };
        });
        showToast(`Memanen 1 ${cropDef?.name || 'tanaman'} berkualitas!`, '🧺');
      }
    } else if (tool === 'pancingan') {
      setActiveModal('fishing');
    } else if (tool === 'sekop') {
      setActiveModal('digSite');
    }
  }, [showToast]);

  // ─── INITIALIZE 3D THREE.JS ENGINE ───
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const world = new AWLWorld3D(canvasContainerRef.current, {
      onTileClick: (tx, tz) => {
        // Move player towards clicked tile and perform action
        setState((prev) => {
          const angle = Math.atan2(tx - prev.player.x, tz - prev.player.z);
          return {
            ...prev,
            player: { ...prev.player, x: tx, z: tz, rotation: angle },
          };
        });
      },
      onTileHover: () => {},
      onAnimalClick: (animalId) => {
        const a = stateRef.current.animals[animalId];
        if (a) {
          if (a.type === 'sapi' || a.type === 'sapi_jersey') awlAudio.playCowMoo();
          else if (a.type === 'domba') awlAudio.playSheepBaa();
          else if (a.type === 'kuda') awlAudio.playHorseWhinny();
          else if (a.type === 'ayam') awlAudio.playChickenCluck();
          else awlAudio.playDogBark();
          world.spawnHeartEmote(a.position.x, a.position.z);
          showToast(`${a.name} menyapamu dengan senang!`, '❤️');
        }
      },
      onVillagerClick: (villagerId) => {
        awlAudio.playClick();
        setTalkingVillagerId(villagerId);
      },
      onWellClick: () => {
        awlAudio.playWater();
        showToast('Penyiram kuninganmu terisi penuh air sumur segar! 💧', '💧');
      },
      onBarnBellClick: () => {
        awlAudio.playPastureBell();
        setState((prev) => {
          const nextAnimals = { ...prev.animals };
          const willPasture = !Object.values(nextAnimals)[0].inPasture;
          Object.keys(nextAnimals).forEach((k) => {
            nextAnimals[k].inPasture = willPasture;
          });
          showToast(
            willPasture
              ? 'Lonceng berdentang! Semua hewan keluar ke padang rumput hijau.'
              : 'Lonceng berdentang! Semua hewan kembali aman ke dalam kandang.',
            '🔔'
          );
          return { ...prev, animals: nextAnimals };
        });
      },
      onDigSiteClick: () => {
        awlAudio.playClick();
        setActiveModal('digSite');
      },
      onFishingPierClick: () => {
        awlAudio.playClick();
        setActiveModal('fishing');
      },
    });

    worldRef.current = world;

    return () => {
      world.destroy();
      worldRef.current = null;
    };
  }, [showToast]);

  // Keep 3D scene in sync with GameState
  useEffect(() => {
    if (!worldRef.current) return;
    worldRef.current.updatePlayer(
      state.player.x,
      state.player.z,
      state.player.rotation,
      state.stats.isRidingHorse,
      state.player.activeTool
    );
    worldRef.current.syncSoilAndCrops(state.soil);
    worldRef.current.syncAnimals(state.animals);
    worldRef.current.syncVillagers(state.villagers);
    worldRef.current.updateEnvironment(state.time.hour, state.time.minute, state.time.weather);
  }, [state]);

  // ─── AMBIENT AUDIO TRACK SYNC ───
  useEffect(() => {
    awlAudio.setEnabled(soundEnabled);
    if (soundEnabled) {
      awlAudio.playTrack(state.currentRecord);
    } else {
      awlAudio.stopBGM();
    }
  }, [soundEnabled, state.currentRecord]);

  // ─── IN-GAME CLOCK TICKER (1 real second = 1 sim minute) ───
  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.time.paused) return prev;
        const nextMin = prev.time.minute + 1;
        let nextHour = prev.time.hour;

        if (nextMin >= 60) {
          nextHour += 1;
        }

        // Automatic 5:00 PM (17:00) Takakura shipping pickup
        if (prev.time.hour === 16 && nextHour === 17) {
          let binEarnings = 0;
          Object.entries(prev.shippingBin).forEach(([id, count]) => {
            const item = prev.inventory[id];
            binEarnings += (item?.sellPrice || 50) * count;
          });
          if (binEarnings > 0) {
            showToast(`Takakura telah mengangkut hasil panenmu! (+${binEarnings} G)`, '📦');
            awlAudio.playHarvest();
          }
        }

        // Midnight exhaustion pass-out!
        if (nextHour >= 24) {
          advanceToNextDay();
          return prev;
        }

        return {
          ...prev,
          time: {
            ...prev.time,
            hour: nextHour,
            minute: nextMin % 60,
          },
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [advanceToNextDay, showToast]);

  // ─── KEYBOARD SHORTCUTS & MOVEMENT ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModal || talkingVillagerId) return;

      let dx = 0, dz = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dz = -1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dz = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;

      if (dx !== 0 || dz !== 0) {
        e.preventDefault();
        setState((prev) => {
          const speed = prev.stats.isRidingHorse ? 1.8 : 1.0;
          const nextX = Math.max(-30, Math.min(35, prev.player.x + dx * speed));
          const nextZ = Math.max(-35, Math.min(45, prev.player.z + dz * speed));
          const angle = Math.atan2(dx, dz);
          return {
            ...prev,
            player: { ...prev.player, x: nextX, z: nextZ, rotation: angle },
          };
        });
        return;
      }

      // Hotbar Number Keys 1-9
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const tools: ToolType[] = ['cangkul', 'penyiram', 'benih', 'pemerah', 'sikat', 'gunting', 'sabit', 'pancingan', 'sekop'];
        setState((prev) => ({ ...prev, player: { ...prev.player, activeTool: tools[num - 1] } }));
        awlAudio.playClick();
        return;
      }

      // Action Keys
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePerformAction();
      } else if (e.key === 'q' || e.key === 'Q') {
        worldRef.current?.rotateCamera('left');
      } else if (e.key === 'e' || e.key === 'E') {
        worldRef.current?.rotateCamera('right');
      } else if (e.key === 'i' || e.key === 'I') {
        setActiveModal((prev) => (prev === 'bag' ? null : 'bag'));
      } else if (e.key === 'm' || e.key === 'M') {
        setActiveModal((prev) => (prev === 'cooking' ? null : 'cooking'));
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveModal((prev) => (prev === 'diary' ? null : 'diary'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, talkingVillagerId, handlePerformAction]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* 3D WebGL Canvas */}
      <div ref={canvasContainerRef} className="absolute inset-0 cursor-crosshair" />

      {/* Main HUD */}
      <AWLHUD
        state={state}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onSelectTool={(t) => {
          awlAudio.playClick();
          setState((prev) => ({ ...prev, player: { ...prev.player, activeTool: t } }));
        }}
        onSelectSeed={(c) => {
          awlAudio.playClick();
          setState((prev) => ({ ...prev, player: { ...prev.player, activeSeed: c } }));
        }}
        onPerformAction={handlePerformAction}
        onToggleHorseRide={() => {
          awlAudio.playHorseWhinny();
          setState((prev) => ({
            ...prev,
            stats: { ...prev.stats, isRidingHorse: !prev.stats.isRidingHorse },
          }));
        }}
        onRingPastureBell={() => {
          awlAudio.playPastureBell();
          setState((prev) => {
            const nextAnimals = { ...prev.animals };
            const willPasture = !Object.values(nextAnimals)[0].inPasture;
            Object.keys(nextAnimals).forEach((k) => {
              nextAnimals[k].inPasture = willPasture;
            });
            showToast(
              willPasture ? 'Lonceng berdentang! Hewan digiring ke padang rumput.' : 'Lonceng berdentang! Hewan masuk ke kandang.',
              '🔔'
            );
            return { ...prev, animals: nextAnimals };
          });
        }}
        onRotateCamera={(dir) => worldRef.current?.rotateCamera(dir)}
        onOpenModal={(modal) => {
          awlAudio.playClick();
          setActiveModal(modal);
        }}
      />

      {/* Villager Dialogue Modal */}
      {talkingVillagerId && state.villagers[talkingVillagerId] && (
        <AWLDialogueModal
          villager={state.villagers[talkingVillagerId]}
          inventory={state.inventory}
          hasBlueFeather={(state.inventory.bulu_biru?.count || 0) > 0}
          onClose={() => setTalkingVillagerId(null)}
          onGiveGift={(itemId) => {
            const item = state.inventory[itemId];
            const v = state.villagers[talkingVillagerId];
            if (!item || !v) return;

            const isFav = v.favoriteGifts.includes(itemId);
            const heartDelta = isFav ? 1 : 0.5;

            awlAudio.playHeartChime();
            worldRef.current?.spawnHeartEmote(v.position.x, v.position.z);

            setState((prev) => {
              const nextInv = { ...prev.inventory };
              nextInv[itemId].count -= 1;
              return {
                ...prev,
                inventory: nextInv,
                villagers: {
                  ...prev.villagers,
                  [v.id]: {
                    ...v,
                    hearts: Math.min(5, v.hearts + heartDelta),
                  },
                },
              };
            });

            showToast(
              isFav ? `${v.name} SANGAT MENYUKAI hadiah pemberianmu! (+❤️)` : `${v.name} berterima kasih atas hadiahmu!`,
              '🎁'
            );
          }}
          onPropose={() => {
            const v = state.villagers[talkingVillagerId];
            if (!v) return;
            awlAudio.playHeartChime();
            showToast(`💍 SELAMAT! ${v.name} menerima lamaran cintamu dengan penuh air mata bahagia!`, '💖');
            setState((prev) => ({
              ...prev,
              villagers: {
                ...prev.villagers,
                [v.id]: { ...v, isMarried: true, hearts: 5 },
              },
            }));
            setTalkingVillagerId(null);
          }}
        />
      )}

      {/* Bag & Inventory Modal */}
      {activeModal === 'bag' && (
        <AWLBagModal
          inventory={state.inventory}
          shippingBin={state.shippingBin}
          gold={state.stats.gold}
          onClose={() => setActiveModal(null)}
          onShipItem={(itemId, count) => {
            setState((prev) => {
              const nextInv = { ...prev.inventory };
              if (!nextInv[itemId] || nextInv[itemId].count < count) return prev;
              nextInv[itemId].count -= count;
              return {
                ...prev,
                inventory: nextInv,
                shippingBin: {
                  ...prev.shippingBin,
                  [itemId]: (prev.shippingBin[itemId] || 0) + count,
                },
              };
            });
            showToast('Dimasukkan ke kotak pengiriman Takakura! 📦', '📦');
            awlAudio.playClick();
          }}
          onEatItem={(itemId) => {
            const item = state.inventory[itemId];
            if (!item) return;
            awlAudio.playHarvest();
            setState((prev) => {
              const nextInv = { ...prev.inventory };
              nextInv[itemId].count -= 1;
              return {
                ...prev,
                inventory: nextInv,
                stats: {
                  ...prev.stats,
                  stamina: Math.min(prev.stats.maxStamina, prev.stats.stamina + 35),
                  fullness: Math.min(100, prev.stats.fullness + 30),
                },
              };
            });
            showToast(`Menikmati ${item.name}! (+35 Energi & Kenyang)`, '🍎');
          }}
        />
      )}

      {/* Livestock Farm Management Modal */}
      {activeModal === 'animals' && (
        <AWLFarmManagementModal
          animals={state.animals}
          fodderCount={state.inventory.pakan_ternak?.count || 0}
          onClose={() => setActiveModal(null)}
          onPetAnimal={(id) => {
            const a = state.animals[id];
            awlAudio.playHeartChime();
            worldRef.current?.spawnHeartEmote(a.position.x, a.position.z);
            setState((prev) => ({
              ...prev,
              animals: {
                ...prev.animals,
                [id]: { ...prev.animals[id], hearts: Math.min(5, prev.animals[id].hearts + 1) },
              },
            }));
            showToast(`Membelai ${a.name} dengan penuh kehangatan! (+❤️)`, '💖');
          }}
          onBrushAnimal={(id) => {
            const a = state.animals[id];
            awlAudio.playShear();
            worldRef.current?.spawnHeartEmote(a.position.x, a.position.z);
            setState((prev) => ({
              ...prev,
              animals: {
                ...prev.animals,
                [id]: { ...prev.animals[id], cleanliness: 100 },
              },
            }));
            showToast(`Bulu ${a.name} disikat bersih berkilau! ✨`, '🪮');
          }}
          onFeedAnimal={(id) => {
            setState((prev) => {
              const nextInv = { ...prev.inventory };
              if (!nextInv.pakan_ternak || nextInv.pakan_ternak.count <= 0) return prev;
              nextInv.pakan_ternak.count -= 1;
              return {
                ...prev,
                inventory: nextInv,
                animals: {
                  ...prev.animals,
                  [id]: { ...prev.animals[id], hunger: 100 },
                },
              };
            });
            showToast('Memberikan pakan rumput kering segar di palung! 🌾', '🌾');
          }}
          onMilkAnimal={(id) => {
            const a = state.animals[id];
            awlAudio.playMilk();
            worldRef.current?.spawnHarvestCelebration(a.position.x, a.position.z);
            const milkId = a.productQuality === 'S' ? 'susu_s' : a.productQuality === 'A' ? 'susu_a' : 'susu_b';
            setState((prev) => ({
              ...prev,
              animals: {
                ...prev.animals,
                [id]: { ...prev.animals[id], hasProductToday: false },
              },
              inventory: {
                ...prev.inventory,
                [milkId]: {
                  id: milkId,
                  name: `Susu Segar (Grade ${a.productQuality})`,
                  category: 'animal_product',
                  count: (prev.inventory[milkId]?.count || 0) + 1,
                  sellPrice: a.productQuality === 'S' ? 150 : 100,
                  icon: '🥛',
                  description: 'Susu segar bergizi tinggi.',
                },
              },
              stats: { ...prev.stats, milkCollected: prev.stats.milkCollected + 1 },
            }));
            showToast(`Memerah 1 Susu Grade ${a.productQuality} dari ${a.name}!`, '🥛');
          }}
          onShearAnimal={(id) => {
            const a = state.animals[id];
            awlAudio.playShear();
            worldRef.current?.spawnHarvestCelebration(a.position.x, a.position.z);
            setState((prev) => ({
              ...prev,
              animals: {
                ...prev.animals,
                [id]: { ...prev.animals[id], hasProductToday: false },
              },
              inventory: {
                ...prev.inventory,
                wol_lembut: {
                  id: 'wol_lembut',
                  name: 'Wol Domba Lembut',
                  category: 'animal_product',
                  count: (prev.inventory.wol_lembut?.count || 0) + 1,
                  sellPrice: 200,
                  icon: '🧶',
                  description: 'Wol tebal bermutu tinggi.',
                },
              },
            }));
            showToast(`Mencukur bulu wol Shaun! (+200 G)`, '✂️');
          }}
          onRingBell={() => {
            awlAudio.playPastureBell();
            setState((prev) => {
              const nextAnimals = { ...prev.animals };
              const willPasture = !Object.values(nextAnimals)[0].inPasture;
              Object.keys(nextAnimals).forEach((k) => {
                nextAnimals[k].inPasture = willPasture;
              });
              return { ...prev, animals: nextAnimals };
            });
          }}
        />
      )}

      {/* Archaeological Dig Site Minigame */}
      {activeModal === 'digSite' && (
        <AWLDigSiteModal
          stamina={state.stats.stamina}
          onClose={() => setActiveModal(null)}
          onRelicFound={(relic: DigSiteRelic) => {
            awlAudio.playHarvest();
            setState((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                stamina: Math.max(0, prev.stats.stamina - 5),
                relicsFound: prev.stats.relicsFound + 1,
              },
              inventory: {
                ...prev.inventory,
                [relic.id]: {
                  id: relic.id,
                  name: relic.name,
                  category: 'relic',
                  count: (prev.inventory[relic.id]?.count || 0) + 1,
                  sellPrice: relic.sellPrice,
                  icon: relic.icon,
                  description: relic.description,
                },
              },
            }));
            showToast(`Menemukan peninggalan purba: ${relic.name}!`, relic.icon);
          }}
        />
      )}

      {/* Fishing Minigame */}
      {activeModal === 'fishing' && (
        <AWLFishingModal
          onClose={() => setActiveModal(null)}
          onFishCaught={(fish) => {
            awlAudio.playHarvest();
            setState((prev) => ({
              ...prev,
              stats: { ...prev.stats, fishCaught: prev.stats.fishCaught + 1 },
              inventory: {
                ...prev.inventory,
                ikan_yamame: {
                  id: 'ikan_yamame',
                  name: fish.name,
                  category: 'produce',
                  count: (prev.inventory.ikan_yamame?.count || 0) + 1,
                  sellPrice: fish.price,
                  icon: fish.icon,
                  description: 'Ikan air tawar segar.',
                },
              },
            }));
            showToast(`Berhasil menangkap ${fish.name}!`, fish.icon);
          }}
        />
      )}

      {/* Cooking Modal */}
      {activeModal === 'cooking' && (
        <AWLCookingModal
          inventory={state.inventory}
          onClose={() => setActiveModal(null)}
          onCookRecipe={(recipe: Recipe) => {
            awlAudio.playHarvest();
            setState((prev) => {
              const nextInv = { ...prev.inventory };
              recipe.ingredients.forEach((ing) => {
                if (nextInv[ing] && nextInv[ing].count > 0) {
                  nextInv[ing].count -= 1;
                }
              });

              nextInv[recipe.id] = {
                id: recipe.id,
                name: recipe.name,
                category: 'cooked',
                count: (nextInv[recipe.id]?.count || 0) + 1,
                sellPrice: recipe.sellPrice,
                icon: recipe.icon,
                description: recipe.description,
              };

              return {
                ...prev,
                inventory: nextInv,
              };
            });
            showToast(`Berhasil memasak ${recipe.name}! (+${recipe.energyRestore} Energi)`, '🍳');
          }}
        />
      )}

      {/* Bedside Diary & Record Player Modal */}
      {activeModal === 'diary' && (
        <AWLDiaryModal
          state={state}
          onClose={() => setActiveModal(null)}
          onSaveGame={() => {
            try {
              localStorage.setItem(SAVE_KEY, JSON.stringify(state));
              awlAudio.playChimes([440, 554, 659, 880], 0.3);
              showToast('Perjalanan peternakanmu tercatat abadi di buku harian! 📖', '💾');
            } catch {
              showToast('Gagal menyimpan ke penyimpanan peramban.', '⚠️');
            }
          }}
          onSleepNextDay={() => {
            setActiveModal(null);
            advanceToNextDay();
          }}
          onSelectRecord={(trackId) => {
            setState((prev) => ({ ...prev, currentRecord: trackId }));
            awlAudio.playTrack(trackId);
            showToast(`Memutar piringan hitam di gramofon rumah... 🎵`, '💿');
          }}
        />
      )}

      {/* Takakura Shipping Ledger Modal */}
      {activeModal === 'shipping' && (
        <AWLShippingModal
          shippingBin={state.shippingBin}
          shippingHistory={state.shippingHistory}
          inventory={state.inventory}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Toast Notifications */}
      <div className="absolute top-20 right-5 z-40 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-stone-900/95 border-2 border-amber-600/70 text-amber-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-slideDown"
          >
            <span className="text-base">{toast.icon || '✨'}</span>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
