// ─── HARVEST MOON: A WONDERFUL LIFE 3D - FORGET-ME-NOT VALLEY THREE.JS ENGINE ───
import * as THREE from 'three';
import { AWLGameState, CropId, ToolType, Weather } from '../types/awlTypes';
import { CROPS } from '../data/awlData';

export interface World3DCallbacks {
  onTileClick: (x: number, z: number) => void;
  onTileHover: (x: number, z: number) => void;
  onAnimalClick: (animalId: string) => void;
  onVillagerClick: (villagerId: string) => void;
  onWellClick: () => void;
  onBarnBellClick: () => void;
  onDigSiteClick: () => void;
  onFishingPierClick: () => void;
}

export class AWLWorld3D {
  private container: HTMLElement;
  private callbacks: World3DCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock = new THREE.Clock();

  // Lighting & Sky
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;
  private skyMesh: THREE.Mesh;
  private starsParticles: THREE.Points;

  // Groups
  private terrainGroup: THREE.Group = new THREE.Group();
  private buildingsGroup: THREE.Group = new THREE.Group();
  private foliageGroup: THREE.Group = new THREE.Group();
  private soilGroup: THREE.Group = new THREE.Group();
  private cropMeshes: Map<string, THREE.Group> = new Map();
  private animalMeshes: Map<string, THREE.Group> = new Map();
  private villagerMeshes: Map<string, THREE.Group> = new Map();
  private fxGroup: THREE.Group = new THREE.Group();

  // Player & Horse
  private playerGroup: THREE.Group = new THREE.Group();
  private playerMesh: THREE.Group = new THREE.Group();
  private playerToolMesh: THREE.Mesh | null = null;
  private playerPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private playerTargetRotation = 0;
  private isRiding = false;

  // Animated elements
  private windmillSails: THREE.Group | null = null;
  private windmillSails2: THREE.Group | null = null;
  private riverMesh: THREE.Mesh | null = null;
  private chimneySmokeParticles: THREE.Points | null = null;
  private weatherParticles: THREE.Points | null = null;
  private activeFX: { mesh: THREE.Object3D; vel: THREE.Vector3; life: number; maxLife: number }[] = [];

  // Interaction & Raycasting
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2(-999, -999);
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private cursorMesh: THREE.Mesh;
  private cameraAngle = Math.PI / 4; // 45 deg default
  private cameraDistance = 14;
  private cameraHeight = 10;
  private isDraggingCamera = false;
  private previousMouseX = 0;

  private animFrameId: number | null = null;

  constructor(container: HTMLElement, callbacks: World3DCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd6e8f8, 0.015);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 300);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 3. Lighting
    this.hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x3f6212, 0.65);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffedd5, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    this.sunLight.position.set(25, 35, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 4. Sky Dome & Stars
    const skyGeo = new THREE.SphereGeometry(150, 16, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, side: THREE.BackSide });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 140;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 10;
      starPos[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    this.starsParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsParticles);

    // 5. Cursor Indicator
    const cursorGeo = new THREE.RingGeometry(0.38, 0.48, 16);
    cursorGeo.rotateX(-Math.PI / 2);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    this.cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    this.cursorMesh.position.y = 0.04;
    this.cursorMesh.visible = false;
    this.scene.add(this.cursorMesh);

    // 6. Add Core Scene Groups
    this.scene.add(this.terrainGroup);
    this.scene.add(this.buildingsGroup);
    this.scene.add(this.foliageGroup);
    this.scene.add(this.soilGroup);
    this.scene.add(this.playerGroup);
    this.scene.add(this.fxGroup);

    // 7. Build World Elements
    this.buildValleyTerrain();
    this.buildBuildings();
    this.buildTreesAndNature();
    this.buildPlayer();

    // 8. Event Listeners
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    // 9. Start Game Loop
    this.animate();
  }

  // ─── TERRAIN CREATION (Forget-Me-Not Valley) ───
  private buildValleyTerrain() {
    // Main Valley Floor
    const groundGeo = new THREE.PlaneGeometry(160, 160, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);

    // Sculpt natural elevations (hills on north, slope towards ocean in south)
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
      // High mountains to the North/Carter Dig Site
      if (z < -30) y += Math.min(18, Math.pow(Math.abs(z + 30) * 0.4, 1.4));
      // Hills to the West
      if (x < -35) y += Math.min(12, Math.pow(Math.abs(x + 35) * 0.35, 1.2));
      // River trench
      const riverDist = Math.abs(x - (Math.sin(z * 0.08) * 8 + 8));
      if (riverDist < 5 && z > -25) {
        y = Math.min(y, -0.6 - (5 - riverDist) * 0.25);
      }
      // Ocean slope to South
      if (z > 45) {
        y = Math.min(y, -0.8 - (z - 45) * 0.15);
      }
      pos.setY(i, y);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshLambertMaterial({ color: 0x65a30d });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    this.terrainGroup.add(groundMesh);

    // River Water Plane
    const riverGeo = new THREE.PlaneGeometry(14, 90, 16, 32);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    this.riverMesh = new THREE.Mesh(riverGeo, riverMat);
    this.riverMesh.position.set(8, -0.45, 15);
    this.riverMesh.receiveShadow = true;
    this.terrainGroup.add(this.riverMesh);

    // Ocean Water (South Beach)
    const oceanGeo = new THREE.PlaneGeometry(160, 50);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, -1.1, 65);
    this.terrainGroup.add(ocean);

    // Farm Pasture Wooden Fences
    this.buildPastureFences();

    // Wooden Bridge across the river
    this.buildWoodenBridge(8, -0.2, 5);
    this.buildWoodenBridge(8, -0.2, 25);

    // Fishing Pier at river
    this.buildFishingPier(13, -0.1, 15);
  }

  private buildPastureFences() {
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.1, 6);
    const railGeo = new THREE.BoxGeometry(2.1, 0.1, 0.08);

    // Enclosing the pasture around (-18 to -2, 4 to 18)
    const fenceCoords = [
      // Top line
      ...Array.from({ length: 8 }, (_, i) => ({ x: -16 + i * 2, z: 4, rot: 0 })),
      // Bottom line
      ...Array.from({ length: 8 }, (_, i) => ({ x: -16 + i * 2, z: 18, rot: 0 })),
      // Left line
      ...Array.from({ length: 7 }, (_, i) => ({ x: -16, z: 5 + i * 2, rot: Math.PI / 2 })),
      // Right line (leaving gate near -2, 11)
      ...Array.from({ length: 3 }, (_, i) => ({ x: -2, z: 5 + i * 2, rot: Math.PI / 2 })),
      ...Array.from({ length: 3 }, (_, i) => ({ x: -2, z: 13 + i * 2, rot: Math.PI / 2 })),
    ];

    fenceCoords.forEach((c) => {
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(c.x, 0.55, c.z);
      post.castShadow = true;
      this.terrainGroup.add(post);

      const rail1 = new THREE.Mesh(railGeo, fenceMat);
      rail1.position.set(c.x, 0.75, c.z);
      rail1.rotation.y = c.rot;
      this.terrainGroup.add(rail1);

      const rail2 = new THREE.Mesh(railGeo, fenceMat);
      rail2.position.set(c.x, 0.4, c.z);
      rail2.rotation.y = c.rot;
      this.terrainGroup.add(rail2);
    });
  }

  private buildWoodenBridge(x: number, y: number, z: number) {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(x, y, z);

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 2.5), woodMat);
    deck.receiveShadow = true;
    deck.castShadow = true;
    bridgeGroup.add(deck);

    // Railings
    const railMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    for (const dz of [-1.2, 1.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.12, 0.1), railMat);
      rail.position.set(0, 0.6, dz);
      bridgeGroup.add(rail);

      for (let px = -2.8; px <= 2.8; px += 1.4) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 5), railMat);
        post.position.set(px, 0.3, dz);
        bridgeGroup.add(post);
      }
    }
    this.terrainGroup.add(bridgeGroup);
  }

  private buildFishingPier(x: number, y: number, z: number) {
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.2, 2.2),
      new THREE.MeshLambertMaterial({ color: 0x78350f })
    );
    pier.position.set(x, y + 0.1, z);
    pier.name = 'fishing_pier';
    this.terrainGroup.add(pier);

    // Support pillars
    for (const [dx, dz] of [[-1.8, -0.8], [1.8, -0.8], [-1.8, 0.8], [1.8, 0.8]]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 1.2, 5),
        new THREE.MeshLambertMaterial({ color: 0x451a03 })
      );
      pillar.position.set(x + dx, y - 0.4, z + dz);
      this.terrainGroup.add(pillar);
    }
  }

  // ─── BUILDINGS & STRUCTURES ───
  private buildBuildings() {
    // 1. THE HOMESTEAD (Your Farmhouse at x: 2, z: -4)
    this.buildFarmhouse(2, 0, -4);

    // 2. THE BIG RED BARN (AWL Iconic Barn at x: -14, z: -2)
    this.buildBarn(-14, 0, -2);

    // 3. THE COOP (x: -5, z: 2)
    this.buildCoop(-5, 0, 2);

    // 4. FARM WATER WELL & WINDMILL (x: -2, z: -8)
    this.buildWaterWell(-2, 0, -8);
    this.buildWindmill(-8, 0, -10, false);

    // 5. TAKAKURA'S SHIPPING STORAGE (x: 6, z: 0)
    this.buildShippingDepot(6, 0, 0);

    // 6. VESTA'S GREENHOUSE & FARM (x: 24, z: -10)
    this.buildGreenhouse(24, 0, -10);
    this.buildWindmill(30, 0, -14, true);

    // 7. THE BLUE BAR (x: 22, z: 6)
    this.buildBlueBar(22, 0, 6);

    // 8. THE ARCHAEOLOGICAL DIG SITE (x: -22, z: -22)
    this.buildDigSite(-22, 0.5, -22);

    // 9. THE GODDESS SACRED SPRING (x: 0, z: -35)
    this.buildGoddessSpring(0, 0.5, -35);
  }

  private buildFarmhouse(x: number, y: number, z: number) {
    const house = new THREE.Group();
    house.position.set(x, y, z);

    // Walls (Warm cedar planks)
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 5), wallMat);
    walls.position.y = 1.6;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Shingle Roof (A-Frame)
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), roofMat);
    roof.position.y = 4.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // Front Porch & Door
    const porchMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const porch = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1.5), porchMat);
    porch.position.set(0, 0.1, 2.8);
    house.add(porch);

    const doorMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.1), doorMat);
    door.position.set(0, 1.1, 2.52);
    house.add(door);

    // Chimney with Smoke
    const chimMat = new THREE.MeshLambertMaterial({ color: 0x57534e });
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), chimMat);
    chimney.position.set(2.0, 2.6, -1.2);
    chimney.castShadow = true;
    house.add(chimney);

    // Chimney Smoke Particles
    const smokeGeo = new THREE.BufferGeometry();
    const smokeCount = 20;
    const smokePos = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount * 3; i += 3) {
      smokePos[i] = 2.0 + (Math.random() - 0.5) * 0.4;
      smokePos[i + 1] = 4.8 + (i / 3) * 0.35;
      smokePos[i + 2] = -1.2 + (Math.random() - 0.5) * 0.4;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({ color: 0xe7e5e4, size: 0.6, transparent: true, opacity: 0.6 });
    this.chimneySmokeParticles = new THREE.Points(smokeGeo, smokeMat);
    house.add(this.chimneySmokeParticles);

    // Porch Lantern (Warm glowing light)
    const lantern = new THREE.PointLight(0xfbbf24, 0.9, 8);
    lantern.position.set(1.2, 2.2, 2.7);
    house.add(lantern);

    this.buildingsGroup.add(house);
  }

  private buildBarn(x: number, y: number, z: number) {
    const barn = new THREE.Group();
    barn.position.set(x, y, z);

    // Main Barn Body (Classic AWL Red Barn)
    const barnMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
    const body = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 7.5), barnMat);
    body.position.y = 2.25;
    body.castShadow = true;
    body.receiveShadow = true;
    barn.add(body);

    // Barn Gambrel Roof
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x450a0a });
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 4.6, 9.2, 6), roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.position.y = 5.2;
    roof.castShadow = true;
    barn.add(roof);

    // Sliding Double Doors with White X Crosses
    const doorMat = new THREE.MeshLambertMaterial({ color: 0xfef2f2 });
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.1), doorMat);
    doorL.position.set(-1.0, 1.4, 3.8);
    barn.add(doorL);

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.1), doorMat);
    doorR.position.set(1.0, 1.4, 3.8);
    barn.add(doorR);

    // Silo on Side
    const siloMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 7.5, 12), siloMat);
    silo.position.set(5.8, 3.75, 0);
    silo.castShadow = true;
    barn.add(silo);

    const siloCap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.8, 12), new THREE.MeshLambertMaterial({ color: 0x44403c }));
    siloCap.position.set(5.8, 8.2, 0);
    barn.add(siloCap);

    // Pasture Bell (Rings to summon animals outside!)
    const bellPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    bellPost.position.set(-2.5, 1.25, 4.8);
    barn.add(bellPost);

    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 }));
    bell.position.set(-2.5, 2.3, 4.8);
    bell.name = 'pasture_bell';
    barn.add(bell);

    this.buildingsGroup.add(barn);
  }

  private buildCoop(x: number, y: number, z: number) {
    const coop = new THREE.Group();
    coop.position.set(x, y, z);

    const coopMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 3.5), coopMat);
    body.position.y = 1.2;
    body.castShadow = true;
    coop.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), new THREE.MeshLambertMaterial({ color: 0x854d0e }));
    roof.position.y = 2.8;
    roof.rotation.y = Math.PI / 4;
    coop.add(roof);

    this.buildingsGroup.add(coop);
  }

  private buildWaterWell(x: number, y: number, z: number) {
    const well = new THREE.Group();
    well.position.set(x, y, z);

    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 10), stoneMat);
    rim.position.y = 0.45;
    rim.castShadow = true;
    rim.name = 'water_well';
    well.add(rim);

    // Water surface
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    water.position.y = 0.55;
    well.add(water);

    // Roof & Posts
    for (const px of [-0.9, 0.9]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8), new THREE.MeshLambertMaterial({ color: 0x78350f }));
      post.position.set(px, 1.1, 0);
      well.add(post);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.8, 4), new THREE.MeshLambertMaterial({ color: 0x991b1b }));
    roof.position.y = 2.1;
    roof.rotation.y = Math.PI / 4;
    well.add(roof);

    this.buildingsGroup.add(well);
  }

  private buildWindmill(x: number, y: number, z: number, isVesta = false) {
    const windmill = new THREE.Group();
    windmill.position.set(x, y, z);

    const towerMat = new THREE.MeshLambertMaterial({ color: isVesta ? 0xfef08a : 0xf5f5f4 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 8, 10), towerMat);
    tower.position.y = 4.0;
    tower.castShadow = true;
    windmill.add(tower);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.8, 10), new THREE.MeshLambertMaterial({ color: 0x1e3a8a }));
    cap.position.y = 8.8;
    windmill.add(cap);

    // Windmill Sails / Blades
    const sails = new THREE.Group();
    sails.position.set(0, 7.8, 1.5);

    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xfef3c7, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 0.05), bladeMat);
      blade.position.y = 1.9;
      const bladeHolder = new THREE.Group();
      bladeHolder.rotation.z = (i * Math.PI) / 2;
      bladeHolder.add(blade);
      sails.add(bladeHolder);
    }
    windmill.add(sails);

    if (isVesta) this.windmillSails2 = sails;
    else this.windmillSails = sails;

    this.buildingsGroup.add(windmill);
  }

  private buildShippingDepot(x: number, y: number, z: number) {
    const depot = new THREE.Group();
    depot.position.set(x, y, z);

    // Wooden shed
    const shed = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 3.5), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    shed.position.y = 1.25;
    depot.add(shed);

    // Big Shipping Bin with hinged lid
    const bin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.2), new THREE.MeshLambertMaterial({ color: 0x15803d }));
    bin.position.set(0, 0.55, 2.1);
    bin.name = 'shipping_bin';
    bin.castShadow = true;
    depot.add(bin);

    this.buildingsGroup.add(depot);
  }

  private buildGreenhouse(x: number, y: number, z: number) {
    const gh = new THREE.Group();
    gh.position.set(x, y, z);

    // Translucent glass dome
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    });
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 4.2, 12), glassMat);
    dome.position.y = 2.1;
    gh.add(dome);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 12), glassMat);
    roof.position.y = 5.2;
    gh.add(roof);

    this.buildingsGroup.add(gh);
  }

  private buildBlueBar(x: number, y: number, z: number) {
    const bar = new THREE.Group();
    bar.position.set(x, y, z);

    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(7, 3.6, 6), stoneMat);
    b.position.y = 1.8;
    b.castShadow = true;
    bar.add(b);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 2.2, 4), new THREE.MeshLambertMaterial({ color: 0x1e3a8a }));
    roof.position.y = 4.4;
    roof.rotation.y = Math.PI / 4;
    bar.add(roof);

    // Blue Bar sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.1), new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
    sign.position.set(0, 2.6, 3.05);
    bar.add(sign);

    this.buildingsGroup.add(bar);
  }

  private buildDigSite(x: number, y: number, z: number) {
    const dig = new THREE.Group();
    dig.position.set(x, y, z);

    // Carter's Expedition Tent
    const tentMat = new THREE.MeshLambertMaterial({ color: 0xd97706, side: THREE.DoubleSide });
    const tent = new THREE.Mesh(new THREE.ConeGeometry(3.5, 3.0, 4), tentMat);
    tent.position.set(-2, 1.5, 0);
    tent.rotation.y = Math.PI / 4;
    dig.add(tent);

    // Excavation Trench Pit
    const pitGeo = new THREE.BoxGeometry(6, 0.4, 6);
    const pitMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.set(2.5, 0.1, 0);
    pit.name = 'dig_site_trench';
    dig.add(pit);

    // Ancient Stone Pillars
    for (const [px, pz] of [[0, -3.5], [5, -3.5], [5, 3.5]]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, 2.4, 6),
        new THREE.MeshLambertMaterial({ color: 0x78716c })
      );
      pillar.position.set(px, 1.2, pz);
      dig.add(pillar);
    }

    this.buildingsGroup.add(dig);
  }

  private buildGoddessSpring(x: number, y: number, z: number) {
    const spring = new THREE.Group();
    spring.position.set(x, y, z);

    // Sacred Pond
    const pond = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    pond.position.y = 0.15;
    spring.add(pond);

    // Giant Sacred Ancient Tree
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.8, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x451a03 })
    );
    trunk.position.set(0, 4, -4);
    spring.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(4.5, 1),
      new THREE.MeshLambertMaterial({ color: 0x15803d })
    );
    foliage.position.set(0, 8.5, -4);
    spring.add(foliage);

    // Glowing Spirit Particles
    const spiritLight = new THREE.PointLight(0xa7f3d0, 1.2, 14);
    spiritLight.position.set(0, 2.5, 0);
    spring.add(spiritLight);

    this.buildingsGroup.add(spring);
  }

  // ─── TREES & NATURE ───
  private buildTreesAndNature() {
    const treeCoords = [
      // Along north ridge
      { x: -10, z: -18 }, { x: -15, z: -25 }, { x: 5, z: -20 }, { x: 14, z: -22 },
      // Forest grove near Goddess spring
      { x: -6, z: -32 }, { x: 8, z: -36 }, { x: -12, z: -38 }, { x: 12, z: -30 },
      // Eastern valley edge
      { x: 34, z: 2 }, { x: 36, z: 12 }, { x: 32, z: 22 },
      // Farm boundary
      { x: -18, z: -10 }, { x: -22, z: 4 }, { x: -20, z: 16 },
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.8, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a2d0c });
    const leafGeo = new THREE.ConeGeometry(2.2, 4.2, 6);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x166534 });

    treeCoords.forEach((c) => {
      const tree = new THREE.Group();
      tree.position.set(c.x, 0, c.z);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      tree.add(trunk);

      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 4.2;
      leaf.castShadow = true;
      tree.add(leaf);

      this.foliageGroup.add(tree);
    });
  }

  // ─── PLAYER CHARACTER & MOUNT ───
  private buildPlayer() {
    this.playerMesh = new THREE.Group();

    // Body (Blue Overalls)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), bodyMat);
    body.position.y = 0.95;
    body.castShadow = true;
    this.playerMesh.add(body);

    // Shirt (Red Plaid / Red Under)
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.25, 0.38), shirtMat);
    shirt.position.y = 1.25;
    this.playerMesh.add(shirt);

    // Head & Straw Cap
    const headMat = new THREE.MeshLambertMaterial({ color: 0xfed7aa });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.playerMesh.add(head);

    // Straw Hat (AWL signature)
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 8), hatMat);
    brim.position.y = 1.72;
    this.playerMesh.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.28, 8), hatMat);
    crown.position.y = 1.86;
    this.playerMesh.add(crown);

    // Limbs
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), legMat);
    legL.position.set(-0.16, 0.3, 0);
    legL.name = 'player_leg_L';
    this.playerMesh.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), legMat);
    legR.position.set(0.16, 0.3, 0);
    legR.name = 'player_leg_R';
    this.playerMesh.add(legR);

    // Tool Hand Container
    const toolHand = new THREE.Group();
    toolHand.name = 'player_tool_hand';
    toolHand.position.set(0.38, 1.0, 0.25);
    this.playerMesh.add(toolHand);

    this.playerGroup.add(this.playerMesh);
  }

  // ─── 3D ANIMAL CREATION ───
  public syncAnimals(animals: AWLGameState['animals']) {
    Object.values(animals).forEach((animal) => {
      let mesh = this.animalMeshes.get(animal.id);
      if (!mesh) {
        mesh = this.createAnimalModel(animal.type);
        mesh.name = `animal_${animal.id}`;
        this.scene.add(mesh);
        this.animalMeshes.set(animal.id, mesh);
      }
      mesh.position.set(animal.position.x, 0, animal.position.z);
    });
  }

  private createAnimalModel(type: AWLGameState['animals'][string]['type']): THREE.Group {
    const group = new THREE.Group();

    if (type === 'sapi' || type === 'sapi_jersey') {
      // AWL Iconic Dairy Cow
      const isJersey = type === 'sapi_jersey';
      const bodyColor = isJersey ? 0x92400e : 0xf8fafc;
      const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.8), bodyMat);
      body.position.y = 0.95;
      body.castShadow = true;
      group.add(body);

      // Spots if Holstein
      if (!isJersey) {
        const spotMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
        const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.7), spotMat);
        spot1.position.set(0.35, 1.0, 0.2);
        group.add(spot1);
      }

      // Head & Big Chewing Pink Muzzle
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.7), bodyMat);
      head.position.set(0, 1.35, 1.0);
      head.name = 'cow_head';
      group.add(head);

      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.4), new THREE.MeshLambertMaterial({ color: 0xf472b6 }));
      muzzle.position.set(0, 1.15, 1.38);
      group.add(muzzle);

      // Brass Bell Collar
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), new THREE.MeshLambertMaterial({ color: 0x7f1d1d }));
      collar.position.set(0, 1.05, 0.75);
      group.add(collar);

      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }));
      bell.position.set(0, 0.85, 0.95);
      group.add(bell);

      // Legs
      for (const [lx, lz] of [[-0.45, 0.6], [0.45, 0.6], [-0.45, -0.6], [0.45, -0.6]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.6, 6), bodyMat);
        leg.position.set(lx, 0.3, lz);
        group.add(leg);
      }
    } else if (type === 'domba') {
      // AWL Fluffy Cloud Sheep
      const woolMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
      const sheepBody = new THREE.Group();
      sheepBody.name = 'sheep_wool_body';
      for (let i = 0; i < 6; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), woolMat);
        const px = ((i % 3) - 1) * 0.35;
        const pz = (Math.floor(i / 3) - 0.5) * 0.55;
        puff.position.set(px, 0.85, pz);
        sheepBody.add(puff);
      }
      group.add(sheepBody);

      // Face
      const face = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.45), new THREE.MeshLambertMaterial({ color: 0xfed7aa }));
      face.position.set(0, 0.95, 0.65);
      group.add(face);
    } else if (type === 'kuda') {
      // Horse
      const horseMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 2.0), horseMat);
      body.position.y = 1.25;
      body.castShadow = true;
      group.add(body);

      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.6), horseMat);
      neck.position.set(0, 1.9, 0.8);
      neck.rotation.x = -Math.PI / 6;
      group.add(neck);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.8), horseMat);
      head.position.set(0, 2.2, 1.15);
      group.add(head);

      // Legs
      for (const [lx, lz] of [[-0.35, 0.7], [0.35, 0.7], [-0.35, -0.7], [0.35, -0.7]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.85, 6), horseMat);
        leg.position.set(lx, 0.42, lz);
        group.add(leg);
      }
    } else if (type === 'ayam') {
      // Chicken
      const henMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), henMat);
      body.position.y = 0.32;
      group.add(body);

      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.15), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      comb.position.set(0, 0.52, 0.1);
      group.add(comb);
    } else {
      // Dog
      const dogMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.75), dogMat);
      body.position.y = 0.45;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), dogMat);
      head.position.set(0, 0.7, 0.35);
      group.add(head);
    }

    return group;
  }

  // ─── 3D SOIL & CROPS ───
  public syncSoilAndCrops(soil: AWLGameState['soil']) {
    // Clear and rebuild soil field
    while (this.soilGroup.children.length > 0) {
      this.soilGroup.remove(this.soilGroup.children[0]);
    }
    this.cropMeshes.clear();

    const drySoilMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const wetSoilMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.25, metalness: 0.1 });

    Object.values(soil).forEach((tile) => {
      const tileMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.12, 0.92),
        tile.watered ? wetSoilMat : drySoilMat
      );
      tileMesh.position.set(tile.x, 0.06, tile.z);
      tileMesh.receiveShadow = true;
      tileMesh.name = `soil_${tile.x}_${tile.z}`;
      this.soilGroup.add(tileMesh);

      // Crop Model
      if (tile.cropId) {
        const cropGroup = this.createCropModel(tile.cropId, tile.stage);
        cropGroup.position.set(tile.x, 0.12, tile.z);
        this.soilGroup.add(cropGroup);
        this.cropMeshes.set(`${tile.x}_${tile.z}`, cropGroup);
      }
    });
  }

  private createCropModel(cropId: CropId, stage: number): THREE.Group {
    const group = new THREE.Group();
    const def = CROPS[cropId];
    if (!def) return group;

    const leafMat = new THREE.MeshLambertMaterial({ color: def.leafColor });
    const fruitMat = new THREE.MeshLambertMaterial({ color: def.fruitColor });

    if (stage === 0) {
      // Seed mound & tiny green dot
      const dot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 4), leafMat);
      dot.position.y = 0.06;
      group.add(dot);
    } else if (stage === 1) {
      // Sprout
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25), leafMat);
      stem.position.y = 0.12;
      group.add(stem);

      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.12), leafMat);
      leaf.position.y = 0.25;
      group.add(leaf);
    } else if (stage === 2) {
      // Bushy vegetative
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), leafMat);
      bush.position.y = 0.35;
      group.add(bush);
    } else if (stage === 3) {
      // Flowering
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), leafMat);
      bush.position.y = 0.42;
      group.add(bush);

      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      flower.position.set(0.15, 0.65, 0.1);
      group.add(flower);
    } else {
      // Ripe Harvestable Fruit!
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), leafMat);
      bush.position.y = 0.45;
      group.add(bush);

      if (cropId === 'semangka') {
        const melon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), fruitMat);
        melon.position.set(0, 0.32, 0.2);
        group.add(melon);
      } else if (cropId === 'tomat' || cropId === 'stroberi') {
        for (const [fx, fy, fz] of [[-0.2, 0.55, 0.15], [0.2, 0.45, -0.15], [0, 0.65, 0.2]]) {
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), fruitMat);
          fruit.position.set(fx, fy, fz);
          group.add(fruit);
        }
      } else if (cropId === 'jagung' || cropId === 'gandum') {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.65), fruitMat);
        stalk.position.set(0, 0.6, 0);
        group.add(stalk);
      } else {
        const fruit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), fruitMat);
        fruit.position.set(0, 0.45, 0.15);
        group.add(fruit);
      }
    }

    return group;
  }

  // ─── 3D VILLAGERS ───
  public syncVillagers(villagers: AWLGameState['villagers']) {
    Object.values(villagers).forEach((v) => {
      let mesh = this.villagerMeshes.get(v.id);
      if (!mesh) {
        mesh = this.createVillagerModel(v.id);
        mesh.name = `villager_${v.id}`;
        this.scene.add(mesh);
        this.villagerMeshes.set(v.id, mesh);
      }
      mesh.position.set(v.position.x, 0, v.position.z);
    });
  }

  private createVillagerModel(id: string): THREE.Group {
    const group = new THREE.Group();

    let shirtColor = 0x22c55e;
    let hairColor = 0x78350f;
    if (id === 'celia') { shirtColor = 0x16a34a; hairColor = 0x451a03; } // Green apron & dark brown
    else if (id === 'nami') { shirtColor = 0x0284c7; hairColor = 0xb91c1c; } // Blue hoodie & red hair
    else if (id === 'muffy') { shirtColor = 0xef4444; hairColor = 0xfacc15; } // Red dress & blonde
    else if (id === 'takakura') { shirtColor = 0x78350f; hairColor = 0xd4d4d8; } // Brown vest & grey
    else if (id === 'carter') { shirtColor = 0xd97706; hairColor = 0x71717a; } // Khaki & explorer hat
    else if (id === 'vesta') { shirtColor = 0xca8a04; hairColor = 0x581c87; }

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.35), new THREE.MeshLambertMaterial({ color: shirtColor }));
    body.position.y = 0.95;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshLambertMaterial({ color: 0xfed7aa }));
    head.position.y = 1.55;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), new THREE.MeshLambertMaterial({ color: hairColor }));
    hair.position.set(0, 1.62, -0.04);
    group.add(hair);

    return group;
  }

  // ─── PLAYER POSITION & ROTATION ───
  public updatePlayer(x: number, z: number, rotation: number, isRiding: boolean, activeTool: ToolType) {
    this.playerPosition.set(x, isRiding ? 0.7 : 0, z);
    this.playerGroup.position.copy(this.playerPosition);
    this.playerTargetRotation = rotation;
    this.playerGroup.rotation.y = rotation;
    this.isRiding = isRiding;

    // Attach tool visual in hand
    const hand = this.playerMesh.getObjectByName('player_tool_hand') as THREE.Group;
    if (hand && this.playerToolMesh) {
      hand.remove(this.playerToolMesh);
      this.playerToolMesh = null;
    }
  }

  // ─── PARTICLE EFFECTS (Hearts, Water Droplets, Sparkles) ───
  public spawnHeartEmote(x: number, z: number) {
    const heartMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const heart = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), heartMat);
    heart.position.set(x, 1.8, z);
    this.fxGroup.add(heart);

    this.activeFX.push({
      mesh: heart,
      vel: new THREE.Vector3(0, 0.9, 0),
      life: 0,
      maxLife: 1.0,
    });
  }

  public spawnWaterSplash(x: number, z: number) {
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 6; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), waterMat);
      drop.position.set(x + (Math.random() - 0.5) * 0.4, 0.4, z + (Math.random() - 0.5) * 0.4);
      this.fxGroup.add(drop);
      this.activeFX.push({
        mesh: drop,
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8),
        life: 0,
        maxLife: 0.6,
      });
    }
  }

  public spawnHarvestCelebration(x: number, z: number) {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < 8; i++) {
      const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), starMat);
      star.position.set(x, 0.5, z);
      this.fxGroup.add(star);
      this.activeFX.push({
        mesh: star,
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.6 + Math.random() * 0.8, (Math.random() - 0.5) * 1.5),
        life: 0,
        maxLife: 0.8,
      });
    }
  }

  // ─── TIME & WEATHER LIGHTING CYCLE ───
  public updateEnvironment(hour: number, minute: number, weather: Weather) {
    const timeFrac = (hour + minute / 60) / 24;

    // Sun angle orbit
    const sunAngle = (timeFrac - 0.25) * Math.PI * 2;
    const sunDist = 55;
    this.sunLight.position.set(
      Math.cos(sunAngle) * sunDist,
      Math.sin(sunAngle) * sunDist,
      Math.sin(sunAngle * 0.5) * 20
    );

    const isDay = hour >= 6 && hour < 19;
    const isSunset = (hour >= 17 && hour < 19) || (hour >= 5 && hour < 7);

    if (weather === 'rainy') {
      this.scene.fog?.color.setHex(0x64748b);
      this.skyMesh.material = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.BackSide });
      this.hemiLight.intensity = 0.4;
      this.sunLight.intensity = 0.4;
      (this.starsParticles.material as THREE.PointsMaterial).opacity = 0;
    } else if (!isDay) {
      // Night (Deep Indigo, Twinkling Stars, Moon Glow)
      this.scene.fog?.color.setHex(0x0f172a);
      this.skyMesh.material = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.BackSide });
      this.hemiLight.intensity = 0.25;
      this.sunLight.intensity = 0.15;
      this.sunLight.color.setHex(0xa5b4fc);
      (this.starsParticles.material as THREE.PointsMaterial).opacity = 0.85;
    } else if (isSunset) {
      // Golden Hour (Amber & Crimson)
      this.scene.fog?.color.setHex(0xfdba74);
      this.skyMesh.material = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.BackSide });
      this.hemiLight.intensity = 0.65;
      this.sunLight.intensity = 1.2;
      this.sunLight.color.setHex(0xf97316);
      (this.starsParticles.material as THREE.PointsMaterial).opacity = 0;
    } else {
      // Crisp Sunny Morning/Afternoon
      this.scene.fog?.color.setHex(0xd6e8f8);
      this.skyMesh.material = new THREE.MeshBasicMaterial({ color: 0xbae6fd, side: THREE.BackSide });
      this.hemiLight.intensity = 0.7;
      this.sunLight.intensity = 1.35;
      this.sunLight.color.setHex(0xfef08a);
      (this.starsParticles.material as THREE.PointsMaterial).opacity = 0;
    }
  }

  // ─── POINTER & CAMERA INTERACTION ───
  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private getPointerGridCoords(e: PointerEvent): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      return { x: Math.round(hit.x), z: Math.round(hit.z) };
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button === 2) {
      // Right-click drag camera orbit
      this.isDraggingCamera = true;
      this.previousMouseX = e.clientX;
      return;
    }

    if (e.button === 0) {
      // Left-click interaction
      const coords = this.getPointerGridCoords(e);
      if (!coords) return;

      // Check if clicking special structures
      const hitObj = this.raycaster.intersectObjects(this.scene.children, true);
      for (const h of hitObj) {
        let cur: THREE.Object3D | null = h.object;
        while (cur) {
          if (cur.name === 'water_well') { this.callbacks.onWellClick(); return; }
          if (cur.name === 'pasture_bell') { this.callbacks.onBarnBellClick(); return; }
          if (cur.name === 'dig_site_trench') { this.callbacks.onDigSiteClick(); return; }
          if (cur.name === 'fishing_pier') { this.callbacks.onFishingPierClick(); return; }
          if (cur.name.startsWith('animal_')) {
            this.callbacks.onAnimalClick(cur.name.replace('animal_', ''));
            return;
          }
          if (cur.name.startsWith('villager_')) {
            this.callbacks.onVillagerClick(cur.name.replace('villager_', ''));
            return;
          }
          cur = cur.parent;
        }
      }

      this.callbacks.onTileClick(coords.x, coords.z);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.isDraggingCamera) {
      const deltaX = e.clientX - this.previousMouseX;
      this.cameraAngle -= deltaX * 0.008;
      this.previousMouseX = e.clientX;
      return;
    }

    const coords = this.getPointerGridCoords(e);
    if (coords) {
      this.cursorMesh.position.set(coords.x, 0.04, coords.z);
      this.cursorMesh.visible = true;
      this.callbacks.onTileHover(coords.x, coords.z);
    } else {
      this.cursorMesh.visible = false;
    }
  };

  private onPointerUp = () => {
    this.isDraggingCamera = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.cameraDistance = Math.max(7, Math.min(26, this.cameraDistance + e.deltaY * 0.015));
  };

  public rotateCamera(direction: 'left' | 'right') {
    this.cameraAngle += direction === 'left' ? -Math.PI / 4 : Math.PI / 4;
  }

  // ─── MAIN ANIMATION LOOP ───
  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Windmill Rotation
    if (this.windmillSails) this.windmillSails.rotation.z += dt * 0.8;
    if (this.windmillSails2) this.windmillSails2.rotation.z += dt * 1.1;

    // 2. Camera Smooth Follow
    const cx = this.playerPosition.x + Math.sin(this.cameraAngle) * this.cameraDistance;
    const cz = this.playerPosition.z + Math.cos(this.cameraAngle) * this.cameraDistance;
    const cy = this.playerPosition.y + this.cameraHeight;

    this.camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.1);
    this.camera.lookAt(this.playerPosition.x, this.playerPosition.y + 1.2, this.playerPosition.z);

    // 3. Animal Ambient Animations (Cow head grazing, tail wag, sheep chew)
    this.animalMeshes.forEach((mesh) => {
      const cowHead = mesh.getObjectByName('cow_head');
      if (cowHead) {
        cowHead.rotation.x = Math.sin(time * 0.8) * 0.08;
      }
    });

    // 4. Update FX Particles
    for (let i = this.activeFX.length - 1; i >= 0; i--) {
      const p = this.activeFX[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.multiplyScalar(0.97);

      if (p.life >= p.maxLife) {
        this.fxGroup.remove(p.mesh);
        this.activeFX.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
