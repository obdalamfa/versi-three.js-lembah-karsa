// 3D PS2-Era Stylized Cel-Shaded WebGL Renderer for Lembah Karsa
// Faithful recreation of PlayStation 2 / GameCube golden-era farming & RPG aesthetics:
// - Harvest Moon: A Wonderful Life / Save the Homeland (warm dreamy bloom & rustic life)
// - Dragon Quest VIII / Dark Cloud 2 (cel-shaded outlines, rich pastures, expressive rigs)
// - Contact blob shadows, animated shimmering water, wildflowers, lanterns & chimney smoke
// - Atmospheric ambient fireflies, floating sun motes, and seasonal falling petals

import * as THREE from 'three';
import { GameState, ToolType, MonsterEntity, SoilTile, CropSpec, PS2VisualSettings, NPCData, SceneDef } from '../types/game';
import { SCENES, generateDungeonFloor, TILES } from '../data/scenesData';
import { CROPS, ITEMS } from '../data/gameData';
import { PS2PostProcessor } from './PS2PostProcessor';

export interface RendererCallbacks {
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
  onEntityClick: (type: 'animal' | 'npc' | 'monster' | 'object', id: string) => void;
}

// ─── SHADERS ───
// PS2 Smooth Cel / Toon Shader
const SMOOTH_VERTEX_SHADER = `
  uniform float grs_time;
  uniform float grs_wind;
  uniform int sm_is_foliage;

  varying vec3 v_world_pos;
  varying vec3 v_world_normal;
  varying vec2 v_uv;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    
    // Wind sway logic for foliage/grass
    if (sm_is_foliage == 1) {
      float h = max(0.0, world.y - 0.12);
      float wave1 = sin(world.x * 0.65 + grs_time * 2.4) * cos(world.z * 0.55 + grs_time * 1.8);
      float wave2 = sin(world.x * 1.10 + grs_time * 3.3 + 1.2) * 0.35;
      world.x += (wave1 + wave2) * h * grs_wind;
      world.z += cos(world.x * 0.45 + grs_time * 1.5) * h * grs_wind * 0.5;
    }

    v_world_pos = world.xyz;
    v_world_normal = normalize(mat3(modelMatrix) * normal);
    v_uv = uv;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SMOOTH_FRAGMENT_SHADER = `
  uniform sampler2D sm_texture;
  uniform int sm_has_tex;
  uniform vec4 sm_color;
  uniform vec3 sm_sun_dir;
  uniform vec3 sm_sun_color;
  uniform vec3 sm_ambient;
  uniform float sm_rim_strength;
  uniform float sm_ao_strength;
  uniform float sm_ao_height;
  uniform float sm_saturation;

  varying vec3 v_world_pos;
  varying vec3 v_world_normal;
  varying vec2 v_uv;

  vec3 lift_saturation(vec3 c, float s) {
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    return mix(vec3(luma), c, s);
  }

  void main() {
    vec4 base = sm_color;
    if (sm_has_tex == 1) {
      vec4 texColor = texture2D(sm_texture, v_uv);
      base *= texColor;
    }
    if (base.a < 0.05) discard;

    vec3 N = normalize(v_world_normal);
    vec3 L = normalize(-sm_sun_dir);

    // Cel / Toon Stepped Diffuse
    float ndl = dot(N, L);
    float diff;
    if (ndl > 0.32) {
      diff = 1.0;
    } else if (ndl > -0.08) {
      diff = 0.64;
    } else {
      diff = 0.38;
    }

    // Camera view & rim edge darkening
    vec3 V = normalize(cameraPosition - v_world_pos);
    float ndv = max(0.0, dot(N, V));
    float edge = 1.0 - smoothstep(0.0, 0.20, ndv);
    float outline_darken = 1.0 - edge * 0.45;

    // Soft AO based on world height Y
    float ao = mix(1.0 - sm_ao_strength * 0.45, 1.0, clamp(v_world_pos.y / max(sm_ao_height, 0.01), 0.0, 1.0));

    vec3 lit = base.rgb * (sm_ambient + sm_sun_color * diff) * ao;
    lit *= outline_darken;
    lit = lift_saturation(lit, sm_saturation * 1.06);

    gl_FragColor = vec4(lit, base.a);
  }
`;

// PS2 Shimmering Water Shader (Dual scrolling waves, specular sun glint & shoreline foam)
const WATER_VERTEX_SHADER = `
  uniform float u_time;
  varying vec2 v_uv;
  varying vec3 v_world_pos;
  varying vec3 v_normal;

  void main() {
    v_uv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Subtle dual gentle wave ripple
    float wave = sin(world.x * 2.2 + u_time * 2.4) * cos(world.z * 1.8 + u_time * 1.9) * 0.035;
    world.y += wave;
    v_world_pos = world.xyz;
    v_normal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WATER_FRAGMENT_SHADER = `
  uniform float u_time;
  uniform vec3 u_sun_dir;
  varying vec2 v_uv;
  varying vec3 v_world_pos;
  varying vec3 v_normal;

  void main() {
    // Scrolling caustic ripples
    float wave1 = sin(v_uv.x * 20.0 + u_time * 1.8) * cos(v_uv.y * 20.0 + u_time * 1.4);
    float wave2 = cos(v_uv.x * 16.0 - u_time * 1.6) * sin(v_uv.y * 16.0 + u_time * 2.0);
    float foam = smoothstep(0.70, 0.98, wave1 + wave2 * 0.5);

    vec3 deepWater = vec3(0.09, 0.35, 0.70);
    vec3 shallowWater = vec3(0.20, 0.65, 0.88);
    vec3 col = mix(deepWater, shallowWater, wave1 * 0.35 + 0.5);

    // Specular sunlight gleam
    vec3 V = normalize(cameraPosition - v_world_pos);
    vec3 L = normalize(-u_sun_dir);
    vec3 H = normalize(L + V);
    float spec = pow(max(0.0, dot(v_normal, H)), 28.0) * 0.75;

    // Foam crest
    col = mix(col, vec3(0.92, 0.96, 1.0), foam * 0.6);
    col += vec3(spec);

    gl_FragColor = vec4(col, 0.84);
  }
`;

// PS2 Molten Magma / Lava Shader for Innocent Life Fire Ruins
const LAVA_VERTEX_SHADER = `
  uniform float u_time;
  varying vec2 v_uv;
  varying vec3 v_world_pos;
  varying vec3 v_normal;

  void main() {
    v_uv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Molten magma swell & thermal waves
    float wave = sin(world.x * 1.6 + u_time * 1.8) * cos(world.z * 1.4 + u_time * 1.5) * 0.038;
    world.y += wave;
    v_world_pos = world.xyz;
    v_normal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const LAVA_FRAGMENT_SHADER = `
  uniform float u_time;
  varying vec2 v_uv;
  varying vec3 v_world_pos;
  varying vec3 v_normal;

  void main() {
    // Flowing molten magma currents
    float flow1 = sin(v_uv.x * 14.0 + u_time * 0.9) * cos(v_uv.y * 14.0 - u_time * 0.7);
    float flow2 = cos(v_uv.x * 9.0 - u_time * 0.6) * sin(v_uv.y * 9.0 + u_time * 0.8);
    float heat = clamp(flow1 * 0.5 + flow2 * 0.5 + 0.5, 0.0, 1.0);

    vec3 darkCrust = vec3(0.16, 0.04, 0.02);
    vec3 redMagma = vec3(0.92, 0.18, 0.02);
    vec3 yellowCore = vec3(1.0, 0.84, 0.18);

    vec3 col = mix(darkCrust, redMagma, smoothstep(0.25, 0.65, heat));
    col = mix(col, yellowCore, smoothstep(0.70, 0.98, heat));

    // Pulsing thermal glow
    float pulse = 0.92 + 0.08 * sin(u_time * 3.2);
    col *= pulse;

    gl_FragColor = vec4(col, 0.96);
  }
`;

// PS2 Animated Subterranean Waterfall Shader
const WATERFALL_VERTEX_SHADER = `
  uniform float u_time;
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WATERFALL_FRAGMENT_SHADER = `
  uniform float u_time;
  varying vec2 v_uv;
  void main() {
    float scroll = mod(v_uv.y * 3.5 - u_time * 3.2, 1.0);
    float ripple = sin(v_uv.x * 14.0 + scroll * 10.0);
    vec3 waterColor = mix(vec3(0.18, 0.68, 0.92), vec3(0.92, 0.97, 1.0), smoothstep(0.28, 0.78, ripple));
    gl_FragColor = vec4(waterColor, 0.85);
  }
`;

export type PlayerAnimAction =
  | 'idle'
  | 'walk'
  | 'hoe'
  | 'water'
  | 'harvest'
  | 'axe'
  | 'pickaxe'
  | 'sword'
  | 'fish_cast'
  | 'fish_wait'
  | 'fish_bite'
  | 'fish_catch'
  | 'pet'
  | 'eat'
  | 'sleep';

export class GameRenderer3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private postProcessor: PS2PostProcessor;
  private ps2Settings: PS2VisualSettings | null = null;
  private animFrameId: number | null = null;
  private callbacks: RendererCallbacks;

  // Global Shader Uniforms
  private globalUniforms = {
    sm_sun_dir: { value: new THREE.Vector3(-0.5, -0.8, -0.4).normalize() },
    sm_sun_color: { value: new THREE.Vector3(1.05, 1.02, 0.92) },
    sm_ambient: { value: new THREE.Vector3(0.48, 0.46, 0.50) },
    sm_rim_strength: { value: 0.55 },
    sm_ao_strength: { value: 0.32 },
    sm_ao_height: { value: 1.6 },
    sm_saturation: { value: 1.0 },
    grs_time: { value: 0.0 },
    grs_wind: { value: 0.08 },
  };

  // Water & Fluid Materials
  private waterMaterial: THREE.ShaderMaterial;
  private lavaMaterial: THREE.ShaderMaterial;
  private waterfallMaterial: THREE.ShaderMaterial;

  // Textures
  private textures: Map<string, THREE.Texture> = new Map();

  // Scene Hierarchy Groups
  private terrainGroup = new THREE.Group();
  private objectGroup = new THREE.Group();
  private characterGroup = new THREE.Group();
  private cloudGroup = new THREE.Group();
  private fxGroup = new THREE.Group();
  private ambientParticleGroup = new THREE.Group();
  private weatherParticles: THREE.Points | null = null;
  private cursorMesh: THREE.Mesh;

  // Entities
  private playerMesh: THREE.Group = new THREE.Group();
  private playerShadow: THREE.Mesh | null = null;
  private npcMeshes: Map<string, THREE.Group> = new Map();
  private animalMeshes: Map<string, THREE.Group> = new Map();
  private monsterMeshes: Map<string, THREE.Group> = new Map();

  // Animation & Blinking States
  private currentAction: PlayerAnimAction = 'idle';
  private actionTimer = 0;
  private actionDuration = 0;
  private activeToolType: string = 'tangan';
  private walkBob = 0;
  private blinkTimer = 0;
  private isBlinking = false;

  // Action Particle Effects & Chimney Smoke
  private activeParticles: {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  private chimneySmokeList: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];
  private chimneySpawnTimer = 0;

  // Ambient Particles (Fireflies / Sunlight motes / Sakura petals)
  private ambientParticles: THREE.Points | null = null;
  private currentAmbientType: 'none' | 'pollen' | 'fireflies' | 'petals' | 'leaves' = 'none';

  // Raycaster for mouse picking
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Camera settings (pitch 34 deg, dist 18.5)
  private readonly CAM_PITCH_RAD = (34.0 * Math.PI) / 180;
  private readonly CAM_DIST = 18.5;
  private readonly CAM_LIFT = 0.5;
  private camCurrentLookAt = new THREE.Vector3(7, 0.5, 7);

  // Player position smoothing
  private playerTargetPos = new THREE.Vector3(7, 0, 7);
  private playerCurrentPos = new THREE.Vector3(7, 0, 7);
  private playerFacingAngle = 0;
  private clock = new THREE.Clock();

  constructor(container: HTMLElement, callbacks: RendererCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#5ba2eb');
    this.scene.fog = new THREE.FogExp2('#5ba2eb', 0.012);

    const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 120);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    // PS2 Post-Processor
    this.postProcessor = new PS2PostProcessor(this.renderer, container.clientWidth, container.clientHeight);

    // Water Material
    this.waterMaterial = new THREE.ShaderMaterial({
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0.0 },
        u_sun_dir: this.globalUniforms.sm_sun_dir,
      },
      transparent: true,
      depthWrite: false,
    });

    // Lava Material (Innocent Life Volcanic Ruin)
    this.lavaMaterial = new THREE.ShaderMaterial({
      vertexShader: LAVA_VERTEX_SHADER,
      fragmentShader: LAVA_FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0.0 },
      },
      transparent: false,
    });

    // Waterfall Material
    this.waterfallMaterial = new THREE.ShaderMaterial({
      vertexShader: WATERFALL_VERTEX_SHADER,
      fragmentShader: WATERFALL_FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Groups
    this.scene.add(this.terrainGroup);
    this.scene.add(this.objectGroup);
    this.scene.add(this.characterGroup);
    this.scene.add(this.cloudGroup);
    this.scene.add(this.fxGroup);
    this.scene.add(this.ambientParticleGroup);

    // Cursor Grid Highlight
    const cursorGeo = new THREE.PlaneGeometry(0.96, 0.96);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    this.cursorMesh.rotation.x = -Math.PI / 2;
    this.cursorMesh.position.y = 0.02;
    this.cursorMesh.visible = false;
    this.scene.add(this.cursorMesh);

    // Generate Procedural Textures & Clouds
    this.generateProceduralTextures();
    this.createClouds();

    // Event Listeners
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);

    // Start Animation Loop
    this.animate();
  }

  // ─── PROCEDURAL TEXTURES GENERATOR ───
  private generateProceduralTextures() {
    const createNoiseTex = (colorA: string, colorB: string, size = 64): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = colorA;
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = colorB;
      for (let i = 0; i < size * size * 0.25; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillRect(x, y, 1, 1);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    this.textures.set('grass_soft', createNoiseTex('#4a7c36', '#3e6a2d'));
    this.textures.set('dirt_soil', createNoiseTex('#5c3e21', '#462e17'));
    this.textures.set('dirt_wet', createNoiseTex('#2e1f13', '#1e140c'));
    this.textures.set('stone_path', createNoiseTex('#78716c', '#57534e'));
    this.textures.set('wood_plank', createNoiseTex('#78350f', '#5a270a'));
    this.textures.set('water_ripple', createNoiseTex('#2563eb', '#1d4ed8'));
    this.textures.set('sand_tropical', createNoiseTex('#e5c07b', '#d4aa5c'));
    this.textures.set('obsidian_rock', createNoiseTex('#26232d', '#18151f'));
    this.textures.set('ancient_stone', createNoiseTex('#64748b', '#475569'));

    // PS2 Soft Contact Blob Shadow Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d')!;
    const radGrad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGrad.addColorStop(0, 'rgba(12, 10, 22, 0.72)');
    radGrad.addColorStop(0.55, 'rgba(15, 12, 28, 0.38)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = radGrad;
    sCtx.fillRect(0, 0, 64, 64);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    this.textures.set('blob_shadow', shadowTex);
  }

  private getTexture(name: string): THREE.Texture | null {
    return this.textures.get(name) || null;
  }

  // ─── PROCEDURAL CLOUDS ───
  private createClouds() {
    const cloudMat = this.createSmoothMaterial('#ffffff', undefined, true, 0.85);
    for (let i = 0; i < 8; i++) {
      const cloudGroup = new THREE.Group();
      const numBlobs = 3 + Math.floor(Math.random() * 4);
      for (let b = 0; b < numBlobs; b++) {
        const blobGeo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.8, 1);
        const blobMesh = new THREE.Mesh(blobGeo, cloudMat);
        blobMesh.position.set(b * 1.8 - 2.5, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.2);
        cloudGroup.add(blobMesh);
      }
      cloudGroup.position.set((Math.random() - 0.5) * 80 + 15, 12 + Math.random() * 4, (Math.random() - 0.5) * 80 + 15);
      cloudGroup.scale.set(1.5, 0.6, 1.2);
      this.cloudGroup.add(cloudGroup);
    }
  }

  // Create Smooth Toon Shader Material
  private createSmoothMaterial(
    colorHex: string,
    texName?: string,
    transparent = false,
    opacity = 1.0,
    isFoliage = false
  ): THREE.ShaderMaterial {
    const tex = texName ? this.getTexture(texName) : null;
    const color = new THREE.Color(colorHex);

    return new THREE.ShaderMaterial({
      vertexShader: SMOOTH_VERTEX_SHADER,
      fragmentShader: SMOOTH_FRAGMENT_SHADER,
      uniforms: {
        sm_texture: { value: tex },
        sm_has_tex: { value: tex ? 1 : 0 },
        sm_color: { value: new THREE.Vector4(color.r, color.g, color.b, opacity) },
        sm_sun_dir: this.globalUniforms.sm_sun_dir,
        sm_sun_color: this.globalUniforms.sm_sun_color,
        sm_ambient: this.globalUniforms.sm_ambient,
        sm_rim_strength: this.globalUniforms.sm_rim_strength,
        sm_ao_strength: this.globalUniforms.sm_ao_strength,
        sm_ao_height: this.globalUniforms.sm_ao_height,
        sm_saturation: this.globalUniforms.sm_saturation,
        grs_time: this.globalUniforms.grs_time,
        grs_wind: this.globalUniforms.grs_wind,
        sm_is_foliage: { value: isFoliage ? 1 : 0 },
      },
      transparent: transparent || opacity < 1.0,
    });
  }

  // ─── PS2 INVERTED-HULL CEL OUTLINES (Dragon Quest VIII / Dark Cloud 2) ───
  private addCelOutline(group: THREE.Group, scale = 1.06, color = '#120d1c') {
    if (this.ps2Settings && !this.ps2Settings.celOutlines) return;

    const meshes: THREE.Mesh[] = [];
    group.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        !child.name.includes('shadow') &&
        !child.name.includes('outline') &&
        !child.name.includes('eye')
      ) {
        meshes.push(child);
      }
    });

    const outlineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      side: THREE.BackSide,
      depthWrite: true,
    });

    for (const m of meshes) {
      const outlineMesh = new THREE.Mesh(m.geometry, outlineMat);
      outlineMesh.name = `${m.name}_ps2_outline`;
      outlineMesh.scale.copy(m.scale).multiplyScalar(scale);
      outlineMesh.position.copy(m.position);
      outlineMesh.rotation.copy(m.rotation);
      m.parent?.add(outlineMesh);
    }
  }

  // ─── PS2 CONTACT BLOB SHADOW GENERATOR ───
  private createBlobShadow(radius = 0.42, opacity = 0.58): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
    const mat = new THREE.MeshBasicMaterial({
      map: this.getTexture('blob_shadow'),
      transparent: true,
      opacity: opacity,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(geo, mat);
    shadow.name = 'contact_blob_shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    return shadow;
  }

  // ─── PS2 SETTINGS UPDATE ───
  public updatePS2Settings(settings?: PS2VisualSettings) {
    if (!settings) return;
    this.ps2Settings = settings;
    this.postProcessor.updateSettings(settings);

    // Toggle outline visibility
    this.characterGroup.traverse((child) => {
      if (child.name.includes('_ps2_outline')) {
        child.visible = settings.celOutlines && settings.enabled;
      }
    });
  }

  // ─── SCENE RENDERER ───
  public renderScene(state: GameState, monsters: MonsterEntity[]) {
    const sceneDef = SCENES[state.player.scene] || SCENES.farm;

    if (state.ps2Settings) {
      this.updatePS2Settings(state.ps2Settings);
    }

    // Clear Previous Dynamic Groups
    this.clearGroup(this.terrainGroup);
    this.clearGroup(this.objectGroup);
    this.clearGroup(this.characterGroup);

    // 1. Build Terrain Tiles & Water
    this.buildTerrain(sceneDef, state);

    // 2. Build Objects, Crops, Props & Lanterns
    this.buildObjects(sceneDef, state);

    // 3. Build Characters (Player, NPCs, Animals, Mobs)
    this.buildCharacters(sceneDef, state, monsters);

    // 4. Update Time of Day Lighting & Weather
    this.updateLightingAndWeather(state, sceneDef);

    // Initial Camera Sync
    this.updateCameraPosition(state.player.x, state.player.y, true);
  }

  private clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material?.dispose();
      }
    }
  }

  // ─── TERRAIN BUILDER ───
  private buildTerrain(sceneDef: typeof SCENES['farm'], state: GameState) {
    const layout = sceneDef.id === 'dungeon' ? generateDungeonFloor(state.dungeonFloor).layout : sceneDef.layout;
    const h = layout.length;
    const w = layout[0]?.length || 0;

    const tileGeo = new THREE.BoxGeometry(1.0, 0.35, 1.0);
    const wallGeo = new THREE.BoxGeometry(1.0, 2.2, 1.0);
    const waterGeo = new THREE.BoxGeometry(1.0, 0.28, 1.0);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tileType = layout[y][x];
        const soilKey = `${sceneDef.id}_${x}_${y}`;
        const soilTile = state.soil[soilKey];

        let col = '#4a7c36';
        let tex = 'grass_soft';
        let isWall = false;
        let isWater = false;
        let isLava = false;
        let isDeepWater = false;

        if (soilTile?.tilled) {
          col = soilTile.watered ? '#3b2514' : '#5c3e21';
          tex = soilTile.watered ? 'dirt_wet' : 'dirt_soil';
        } else {
          switch (tileType) {
            case TILES.GRASS:
              col = sceneDef.id === 'dungeon_forest' ? '#15803d' : '#4a7c36';
              tex = 'grass_soft';
              break;
            case TILES.DIRT:
              col = '#5c3e21';
              tex = 'dirt_soil';
              break;
            case TILES.PATH:
              col = sceneDef.id === 'dungeon_fire' ? '#26232d' : sceneDef.id === 'dungeon_water' ? '#475569' : '#78716c';
              tex = sceneDef.id === 'dungeon_fire' ? 'obsidian_rock' : 'stone_path';
              break;
            case TILES.WATER:
              isWater = true;
              break;
            case TILES.DEEP_WATER:
              isDeepWater = true;
              break;
            case TILES.LAVA:
              isLava = true;
              break;
            case TILES.WOOD_FLOOR:
              col = sceneDef.id === 'lab_hope' ? '#1e293b' : '#78350f';
              tex = sceneDef.id === 'lab_hope' ? 'ancient_stone' : 'wood_plank';
              break;
            case TILES.DOCK:
              col = '#92400e';
              tex = 'wood_plank';
              break;
            case TILES.WALL:
            case TILES.CAVE_WALL:
              col = sceneDef.id === 'dungeon_fire' ? '#27100b' : sceneDef.id === 'dungeon_water' ? '#0f293a' : sceneDef.id === 'lab_hope' ? '#0f172a' : tileType === TILES.WALL ? '#5a270a' : '#334155';
              tex = 'ancient_stone';
              isWall = true;
              break;
            case TILES.SAND:
              col = '#e5c07b';
              tex = 'sand_tropical';
              break;
            case TILES.CLOUD:
              col = '#f8fafc';
              break;
            default:
              col = '#4a7c36';
              break;
          }
        }

        if (isLava) {
          // PS2 Molten Magma Tile (Innocent Life Fire Ruins)
          const lavaMesh = new THREE.Mesh(waterGeo, this.lavaMaterial);
          lavaMesh.position.set(x, -0.18, y);
          this.terrainGroup.add(lavaMesh);
        } else if (isDeepWater) {
          // Innocent Life Deep Sapphire Ocean Water
          const deepMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
          deepMesh.position.set(x, -0.24, y);
          this.terrainGroup.add(deepMesh);
        } else if (isWater) {
          // PS2 Shimmering Water Tile
          const waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
          waterMesh.position.set(x, -0.20, y);
          this.terrainGroup.add(waterMesh);
        } else {
          const mat = this.createSmoothMaterial(col, tex);
          const mesh = new THREE.Mesh(isWall ? wallGeo : tileGeo, mat);
          mesh.position.set(x, isWall ? 1.1 : -0.17, y);
          this.terrainGroup.add(mesh);
        }

        // Add 3D grass tufts & wildflowers on outdoor grass tiles
        if (!sceneDef.indoor && tileType === TILES.GRASS && !soilTile?.tilled) {
          const seed = (x * 17 + y * 31);
          if (seed % 4 === 0) {
            // Swaying Grass Tufts
            const bladeMat = this.createSmoothMaterial('#86efac', undefined, true, 0.95, true);
            const blade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), bladeMat);
            blade.position.set(x + ((x % 3) - 1) * 0.22, 0.18, y + ((y % 3) - 1) * 0.22);
            this.terrainGroup.add(blade);
          }
          if (seed % 11 === 0) {
            // PS2 Wildflowers: Daisies, Marigolds, Lavender, or Forest Mushrooms
            this.addWildFlora(x, y, seed % 4);
          }
        }
      }
    }
  }

  // ─── 3D WILDFLORA (PS2 RPG Details: Daisies, Poppies, Lavender, Mushrooms) ───
  private addWildFlora(x: number, y: number, variant: number) {
    const floraGroup = new THREE.Group();
    floraGroup.position.set(x + (Math.sin(x) * 0.25), 0, y + (Math.cos(y) * 0.25));

    if (variant === 0) {
      // White & Gold Daisy
      const stemMat = this.createSmoothMaterial('#4ade80', undefined, false, 1.0, true);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 4), stemMat);
      stem.position.y = 0.11;
      floraGroup.add(stem);

      const petalMat = this.createSmoothMaterial('#ffffff');
      const petals = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 6), petalMat);
      petals.position.y = 0.23;
      floraGroup.add(petals);

      const centerMat = this.createSmoothMaterial('#fbbf24');
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), centerMat);
      center.position.y = 0.25;
      floraGroup.add(center);
    } else if (variant === 1) {
      // Golden Marigold
      const stemMat = this.createSmoothMaterial('#22c55e', undefined, false, 1.0, true);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 4), stemMat);
      stem.position.y = 0.12;
      floraGroup.add(stem);

      const flowerMat = this.createSmoothMaterial('#f59e0b');
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), flowerMat);
      flower.position.y = 0.27;
      floraGroup.add(flower);
    } else if (variant === 2) {
      // Purple Bellflower / Lavender
      const stemMat = this.createSmoothMaterial('#16a34a', undefined, false, 1.0, true);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 4), stemMat);
      stem.position.y = 0.16;
      floraGroup.add(stem);

      const bloomMat = this.createSmoothMaterial('#a855f7');
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), bloomMat);
      bloom.position.y = 0.32;
      floraGroup.add(bloom);
    } else {
      // Red Forest Toadstool Mushroom
      const stalkMat = this.createSmoothMaterial('#f8fafc');
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.18, 6), stalkMat);
      stalk.position.y = 0.09;
      floraGroup.add(stalk);

      const capMat = this.createSmoothMaterial('#ef4444');
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 8), capMat);
      cap.position.y = 0.21;
      floraGroup.add(cap);
    }

    this.terrainGroup.add(floraGroup);
  }

  // ─── OBJECTS BUILDER ───
  private buildObjects(sceneDef: typeof SCENES['farm'], state: GameState) {
    const layout = sceneDef.id === 'dungeon' ? generateDungeonFloor(state.dungeonFloor).layout : sceneDef.layout;
    const h = layout.length;
    const w = layout[0]?.length || 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = layout[y][x];
        const soilKey = `${sceneDef.id}_${x}_${y}`;
        const soilTile = state.soil[soilKey];

        // 1. Crops & Fruit Trees
        if (soilTile?.cropId) {
          const crop = CROPS[soilTile.cropId];
          if (crop) this.addCropObject(x, y, crop, soilTile);
        }

        // 2. Scene Environment Objects
        switch (t) {
          case TILES.TREE:
            this.addTreeObject(x, y);
            break;
          case TILES.ROCK:
            this.addRockObject(x, y);
            break;
          case TILES.FENCE:
            this.addFenceObject(x, y);
            break;
          case TILES.SHIPPING_BIN:
            this.addShippingBinObject(x, y);
            break;
          case TILES.WELL:
            this.addWellObject(x, y);
            break;
          case TILES.BED:
            this.addBedObject(x, y);
            break;
          case TILES.STOVE:
            this.addStoveObject(x, y);
            break;
          case TILES.TABLE:
            this.addTableObject(x, y);
            break;
          case TILES.COUNTER:
            this.addCounterObject(x, y);
            break;
          case TILES.ANVIL:
            this.addAnvilObject(x, y);
            break;
          case TILES.SHRINE:
            this.addShrineObject(x, y);
            break;
          case TILES.TOMB:
            this.addTombObject(x, y);
            break;
          case TILES.ORE_COPPER:
            this.addOreObject(x, y, '#b45309');
            break;
          case TILES.ORE_IRON:
            this.addOreObject(x, y, '#94a3b8');
            break;
          case TILES.ORE_GOLD:
            this.addOreObject(x, y, '#fbbf24');
            break;
          case TILES.ORE_MITHRIL:
            this.addOreObject(x, y, '#38bdf8');
            break;
          case TILES.CRYSTAL:
            this.addCrystalObject(x, y);
            break;
          case TILES.STAIRS_DOWN:
            this.addStairsObject(x, y, true);
            break;
          case TILES.STAIRS_UP:
            this.addStairsObject(x, y, false);
            break;
          case TILES.PALM_TREE:
            this.addPalmTreeObject(x, y);
            break;
          case TILES.MOAI_STATUE:
            this.addMoaiStatueObject(x, y);
            break;
          case TILES.MAGLEV_RAIL:
            this.addMaglevRailObject(x, y);
            break;
          case TILES.CORAL_REEF:
            this.addCoralReefObject(x, y);
            break;
          case TILES.JEWEL_CREST:
            this.addJewelCrestObject(x, y, sceneDef.id);
            break;
          case TILES.WATERFALL:
            this.addWaterfallObject(x, y);
            break;
          case TILES.LAB_CONSOLE:
            this.addLabConsoleObject(x, y);
            break;
          case TILES.LIFE_POD:
            this.addLifePodObject(x, y);
            break;
        }

        // Add street lantern posts in Town or along Farm entrance
        if ((sceneDef.id === 'town' && (x === 6 || x === 18) && (y === 8 || y === 16)) ||
            (sceneDef.id === 'farm' && x === 16 && y === 10)) {
          this.addLanternPost(x, y);
        }
      }
    }
  }

  // ─── 3D PROPS BUILDERS (Enhanced PS2 Aesthetic) ───
  private addCropObject(x: number, y: number, crop: CropSpec, soil: SoilTile) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const progress = Math.min(1.0, soil.age / Math.max(crop.days || 3, 1));

    if (crop.is_tree) {
      // Fruit Tree
      const trunkH = 0.8 + progress * 1.5;
      const trunkMat = this.createSmoothMaterial('#78350f', 'wood_plank');
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, trunkH, 8), trunkMat);
      trunk.position.y = trunkH / 2;
      group.add(trunk);

      const leafR = 0.5 + progress * 0.8;
      const leafMat = this.createSmoothMaterial(crop.color || '#388e3c', undefined, false, 1.0, true);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(leafR, 1), leafMat);
      crown.position.y = trunkH + leafR * 0.6;
      group.add(crown);

      // Hanging Fruits
      if (soil.siap) {
        const fruitMat = this.createSmoothMaterial(crop.fruitColor || '#f59e0b', undefined, false, 1.0, true);
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), fruitMat);
          fruit.position.set(Math.cos(angle) * (leafR * 0.8), trunkH + leafR * 0.4, Math.sin(angle) * (leafR * 0.8));
          group.add(fruit);
        }
      }
    } else {
      // Field Crops
      if (progress < 0.35) {
        const sproutMat = this.createSmoothMaterial('#84cc16', undefined, false, 1.0, true);
        const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 5), sproutMat);
        sprout.position.y = 0.12;
        group.add(sprout);
      } else if (progress < 0.8) {
        const stalkMat = this.createSmoothMaterial('#4ade80', undefined, false, 1.0, true);
        const stalk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), stalkMat);
        stalk.position.y = 0.22;
        group.add(stalk);
      } else {
        const leafMat = this.createSmoothMaterial('#22c55e', undefined, false, 1.0, true);
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), leafMat);
        leaf.position.y = 0.25;
        group.add(leaf);

        // Ripe Produce
        const fruitMat = this.createSmoothMaterial(crop.fruitColor || '#ef4444');
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), fruitMat);
        fruit.position.y = 0.42;
        group.add(fruit);
      }
    }

    this.objectGroup.add(group);
  }

  private addTreeObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    // Tree Trunk
    const trunkH = 1.9;
    const trunkMat = this.createSmoothMaterial('#78350f', 'wood_plank');
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.36, trunkH, 8), trunkMat);
    trunk.position.y = trunkH / 2;
    group.add(trunk);

    // Foliage Clusters
    const leafMat = this.createSmoothMaterial('#43a047', undefined, false, 1.0, true);
    const leafMesh1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 1), leafMat);
    leafMesh1.position.y = trunkH + 0.65;
    group.add(leafMesh1);

    const leafMesh2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 1), leafMat);
    leafMesh2.position.set(0.35, trunkH + 1.25, -0.2);
    group.add(leafMesh2);

    // Tree base blob shadow
    const shadow = this.createBlobShadow(0.9, 0.65);
    group.add(shadow);

    this.addCelOutline(group, 1.04, '#152412');
    this.objectGroup.add(group);
  }

  private addLanternPost(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const woodMat = this.createSmoothMaterial('#5a2e12', 'wood_plank');
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6), woodMat);
    post.position.y = 1.1;
    group.add(post);

    const ironMat = this.createSmoothMaterial('#334155');
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), ironMat);
    arm.position.set(0.2, 2.0, 0);
    group.add(arm);

    // Glowing Lantern
    const glassMat = this.createSmoothMaterial('#fef08a', undefined, true, 0.9);
    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), glassMat);
    lantern.position.set(0.35, 1.85, 0);
    group.add(lantern);

    // Point Light Halo
    const haloMat = this.createSmoothMaterial('#f59e0b', undefined, true, 0.45);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), haloMat);
    halo.position.set(0.35, 1.85, 0);
    group.add(halo);

    const shadow = this.createBlobShadow(0.3, 0.45);
    group.add(shadow);

    this.objectGroup.add(group);
  }

  private addRockObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const rockMat = this.createSmoothMaterial('#64748b');
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), rockMat);
    rock.position.y = 0.35;
    group.add(rock);
    group.add(this.createBlobShadow(0.45, 0.5));
    this.addCelOutline(group, 1.05, '#1e293b');
    this.objectGroup.add(group);
  }

  private addFenceObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const mat = this.createSmoothMaterial('#854d0e', 'wood_plank');
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), mat);
    post.position.y = 0.35;
    group.add(post);
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.06), mat);
    rail1.position.y = 0.48;
    group.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.06), mat);
    rail2.position.y = 0.22;
    group.add(rail2);
    this.objectGroup.add(group);
  }

  private addShippingBinObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const mat = this.createSmoothMaterial('#92400e', 'wood_plank');
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.65, 0.88), mat);
    box.position.y = 0.32;
    group.add(box);

    const brassMat = this.createSmoothMaterial('#d97706');
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.06), brassMat);
    latch.position.set(0, 0.5, 0.45);
    group.add(latch);

    group.add(this.createBlobShadow(0.65, 0.55));
    this.addCelOutline(group, 1.05, '#2d1806');
    this.objectGroup.add(group);
  }

  private addWellObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const stoneMat = this.createSmoothMaterial('#64748b', 'stone_path');
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.5, 10), stoneMat);
    base.position.y = 0.25;
    group.add(base);

    const woodMat = this.createSmoothMaterial('#78350f', 'wood_plank');
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), woodMat);
    postL.position.set(-0.45, 0.7, 0);
    group.add(postL);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), woodMat);
    postR.position.set(0.45, 0.7, 0);
    group.add(postR);

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.45, 4), woodMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.35;
    group.add(roof);

    group.add(this.createBlobShadow(0.7, 0.55));
    this.addCelOutline(group, 1.04, '#1e293b');
    this.objectGroup.add(group);
  }

  private addBedObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const woodMat = this.createSmoothMaterial('#78350f', 'wood_plank');
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 1.4), woodMat);
    frame.position.y = 0.15;
    group.add(frame);
    const sheetMat = this.createSmoothMaterial('#38bdf8');
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.12, 1.1), sheetMat);
    sheet.position.set(0, 0.25, -0.1);
    group.add(sheet);
    this.objectGroup.add(group);
  }

  private addStoveObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const bodyMat = this.createSmoothMaterial('#334155');
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.75), bodyMat);
    body.position.y = 0.4;
    group.add(body);
    this.objectGroup.add(group);
  }

  private addTableObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const woodMat = this.createSmoothMaterial('#854d0e', 'wood_plank');
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), woodMat);
    top.position.y = 0.65;
    group.add(top);
    this.objectGroup.add(group);
  }

  private addCounterObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const mat = this.createSmoothMaterial('#78350f', 'wood_plank');
    const counter = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.85), mat);
    counter.position.y = 0.38;
    group.add(counter);
    this.objectGroup.add(group);
  }

  private addAnvilObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const metalMat = this.createSmoothMaterial('#475569');
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.45), metalMat);
    anvil.position.y = 0.35;
    group.add(anvil);
    this.objectGroup.add(group);
  }

  private addShrineObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const stoneMat = this.createSmoothMaterial('#94a3b8');
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), stoneMat);
    base.position.y = 0.3;
    group.add(base);
    this.objectGroup.add(group);
  }

  private addTombObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const stoneMat = this.createSmoothMaterial('#64748b');
    const tomb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.2), stoneMat);
    tomb.position.y = 0.38;
    group.add(tomb);
    this.objectGroup.add(group);
  }

  private addOreObject(x: number, y: number, colorHex: string) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const oreMat = this.createSmoothMaterial(colorHex);
    const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), oreMat);
    ore.position.y = 0.35;
    group.add(ore);
    group.add(this.createBlobShadow(0.38, 0.5));
    this.objectGroup.add(group);
  }

  private addCrystalObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const crysMat = this.createSmoothMaterial('#a855f7', undefined, true, 0.9);
    const crys = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crysMat);
    crys.position.y = 0.45;
    group.add(crys);
    group.add(this.createBlobShadow(0.38, 0.5));
    this.objectGroup.add(group);
  }

  private addStairsObject(x: number, y: number, isDown: boolean) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);
    const mat = this.createSmoothMaterial('#64748b');
    const stairs = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), mat);
    stairs.position.y = 0.12;
    group.add(stairs);
    this.objectGroup.add(group);
  }

  // ─── INNOCENT LIFE FUTURISTIC & TROPICAL PROPS ───

  // Tropical Palm Tree (Easter Island / Pantai Selatan)
  private addPalmTreeObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const trunkMat = this.createSmoothMaterial('#854d0e', 'wood_plank');
    const leafMatA = this.createSmoothMaterial('#15803d', undefined, false, 1.0, true);
    const leafMatB = this.createSmoothMaterial('#22c55e', undefined, false, 1.0, true);
    const coconutMat = this.createSmoothMaterial('#713f12');

    // Curved Segmented Trunk
    const trunkSegments = 4;
    let currY = 0;
    for (let i = 0; i < trunkSegments; i++) {
      const segH = 0.65;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.12 - i * 0.015, 0.16 - i * 0.015, segH, 7), trunkMat);
      seg.position.set(Math.sin(i * 0.35) * 0.12, currY + segH / 2, Math.cos(i * 0.25) * 0.08);
      seg.rotation.z = (Math.random() - 0.5) * 0.08;
      group.add(seg);
      currY += segH;
    }

    // Coconuts cluster
    for (let c = 0; c < 3; c++) {
      const angle = (c * Math.PI * 2) / 3;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), coconutMat);
      nut.position.set(Math.cos(angle) * 0.18, currY - 0.15, Math.sin(angle) * 0.18);
      group.add(nut);
    }

    // 6 Tropical Drooping Palm Fronds
    for (let i = 0; i < 6; i++) {
      const frondAngle = (i * Math.PI * 2) / 6;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(0, currY, 0);
      frondGroup.rotation.y = frondAngle;

      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 5), i % 2 === 0 ? leafMatA : leafMatB);
      frond.rotation.x = Math.PI / 2.6;
      frond.scale.set(1.0, 1.0, 0.12);
      frond.position.set(0, -0.25, 0.75);
      frondGroup.add(frond);

      group.add(frondGroup);
    }

    group.add(this.createBlobShadow(0.65, 0.6));
    this.addCelOutline(group, 1.05, '#1e293b');
    this.objectGroup.add(group);
  }

  // Moai Easter Island Monolith Statue (Harvest Moon: Innocent Life Iconic Relic)
  private addMoaiStatueObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const stoneMat = this.createSmoothMaterial('#78716c', 'ancient_stone');
    const darkStoneMat = this.createSmoothMaterial('#475569');
    const pukaoMat = this.createSmoothMaterial('#b45309'); // Red volcanic scoria topknot
    const runeEyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Glowing runic cyan eyes

    // Broad Stone Base & Torso Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.72), darkStoneMat);
    plinth.position.y = 0.22;
    group.add(plinth);

    // Carved Head & Jaw
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.35, 0.62), stoneMat);
    head.position.y = 1.05;
    group.add(head);

    // Heavy Angled Brow & Elongated Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.22), darkStoneMat);
    nose.position.set(0, 1.05, 0.35);
    group.add(nose);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.18), darkStoneMat);
    brow.position.set(0, 1.45, 0.28);
    group.add(brow);

    // Prominent Jutting Chin
    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.18), stoneMat);
    chin.position.set(0, 0.52, 0.28);
    group.add(chin);

    // Ancient Glowing Runic Eyes (Innocent Life Ancient Android Lore)
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), runeEyeMat);
    eyeL.position.set(-0.20, 1.35, 0.32);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), runeEyeMat);
    eyeR.position.set(0.20, 1.35, 0.32);
    group.add(eyeR);

    // Pukao (Red volcanic cylinder topknot hat)
    const pukao = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.35, 8), pukaoMat);
    pukao.position.y = 1.88;
    group.add(pukao);

    group.add(this.createBlobShadow(0.85, 0.7));
    this.addCelOutline(group, 1.04, '#1c1917');
    this.objectGroup.add(group);
  }

  // Automated Maglev Rail System (Innocent Life Automated Cargo Belt)
  private addMaglevRailObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const steelMat = this.createSmoothMaterial('#475569');
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Glowing neon guide strip
    const podMat = this.createSmoothMaterial('#0284c7');

    // Railway Sleepers / Ties
    for (let i = 0; i < 3; i++) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.16), steelMat);
      tie.position.set(0, 0.03, (i - 1) * 0.32);
      group.add(tie);
    }

    // Dual Steel Rail Tubes
    const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6), steelMat);
    railL.rotation.x = Math.PI / 2;
    railL.position.set(-0.30, 0.08, 0);
    group.add(railL);

    const railR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6), steelMat);
    railR.rotation.x = Math.PI / 2;
    railR.position.set(0.30, 0.08, 0);
    group.add(railR);

    // Center Glowing Maglev Power Conduit
    const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 1.0), neonMat);
    conduit.position.set(0, 0.06, 0);
    group.add(conduit);

    // Occasional Automated Crop Transport Pod
    if ((x + y * 7) % 5 === 0) {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.52), podMat);
      pod.position.set(0, 0.26, 0);
      group.add(pod);

      const light = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      light.position.set(0, 0.44, 0.22);
      group.add(light);
    }

    this.objectGroup.add(group);
  }

  // Submerged Tropical Coral Reef Formation (Ocean Scene)
  private addCoralReefObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, -0.22, y);

    const coralMat1 = this.createSmoothMaterial('#f43f5e'); // Staghorn pink coral
    const coralMat2 = this.createSmoothMaterial('#f97316'); // Orange brain coral
    const coralMat3 = this.createSmoothMaterial('#10b981'); // Sea fan green

    // Branched coral clusters
    const branch1 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 5), coralMat1);
    branch1.position.set(-0.14, 0.26, -0.12);
    branch1.rotation.z = -0.25;
    group.add(branch1);

    const branch2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 5), coralMat1);
    branch2.position.set(0.12, 0.22, 0.14);
    branch2.rotation.z = 0.22;
    group.add(branch2);

    const brainCoral = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), coralMat2);
    brainCoral.position.set(0.14, 0.18, -0.10);
    group.add(brainCoral);

    const seaFan = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.05), coralMat3);
    seaFan.position.set(-0.15, 0.18, 0.14);
    seaFan.rotation.y = 0.6;
    group.add(seaFan);

    // Glowing Starfish on sea floor
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const star = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 5), starMat);
    star.position.set(0, 0.04, 0);
    group.add(star);

    this.objectGroup.add(group);
  }

  // Elemental Jewel Crest Pedestal (Water / Fire / Earth Crest from Innocent Life)
  private addJewelCrestObject(x: number, y: number, sceneId: string) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const isFire = sceneId === 'dungeon_fire';
    const isForest = sceneId === 'dungeon_forest';
    const jewelColor = isFire ? 0xea580c : isForest ? 0x10b981 : 0x06b6d4;

    const stoneMat = this.createSmoothMaterial('#334155', 'ancient_stone');
    const jewelMat = new THREE.MeshBasicMaterial({ color: jewelColor });

    // Stepped Carved Altar
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.35, 8), stoneMat);
    base.position.y = 0.18;
    group.add(base);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.55, 8), stoneMat);
    pillar.position.y = 0.60;
    group.add(pillar);

    // Floating Rotating Elemental Crest Jewel
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), jewelMat);
    jewel.position.y = 1.15;
    group.add(jewel);

    // Glowing Halo Ring around Crest
    const ringGeo = new THREE.TorusGeometry(0.42, 0.025, 4, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: jewelColor, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.15;
    group.add(ring);

    group.add(this.createBlobShadow(0.6, 0.6));
    this.objectGroup.add(group);
  }

  // Animated Cascading Waterfall Sheet (Water Spirit Ruins)
  private addWaterfallObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const fallGeo = new THREE.PlaneGeometry(1.0, 2.2);
    const fallMesh = new THREE.Mesh(fallGeo, this.waterfallMaterial);
    fallMesh.position.set(0, 1.1, 0.45);
    group.add(fallMesh);

    // Splash Foam at base
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.1, 8), foamMat);
    foam.position.set(0, 0.05, 0.45);
    group.add(foam);

    this.objectGroup.add(group);
  }

  // Dr. Hope's Futuristic Holographic Island Map & Research Console
  private addLabConsoleObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const deskMat = this.createSmoothMaterial('#1e293b');
    const holoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });

    // Console Desk & Control Panel
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.75), deskMat);
    desk.position.y = 0.38;
    group.add(desk);

    // Angled Holographic Monitor Screen
    const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.42), holoMat);
    holoScreen.position.set(0, 0.95, -0.05);
    holoScreen.rotation.x = -Math.PI / 6;
    group.add(holoScreen);

    // Status Indicator LEDs
    const ledG = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    ledG.position.set(-0.25, 0.78, 0.22);
    group.add(ledG);

    const ledA = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    ledA.position.set(0.25, 0.78, 0.22);
    group.add(ledA);

    this.objectGroup.add(group);
  }

  // Dr. Hope's Life Recharging Capsule Pod (Android Protagonist Diagnostic Pod)
  private addLifePodObject(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, y);

    const metalMat = this.createSmoothMaterial('#334155');
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    // Hexagonal Base & Top Cap
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.35, 6), metalMat);
    base.position.y = 0.18;
    group.add(base);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.30, 6), metalMat);
    topCap.position.y = 1.95;
    group.add(topCap);

    // Translucent Glass Chamber
    const glassChamber = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.5, 12), glassMat);
    glassChamber.position.y = 1.1;
    group.add(glassChamber);

    // Interior Energy Regeneration Core Column
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.35, 6), coreMat);
    core.position.y = 1.1;
    group.add(core);

    group.add(this.createBlobShadow(0.7, 0.6));
    this.objectGroup.add(group);
  }

  // Innocent Life Flying Robot Companion "Forte" / Dr. Hope's Assistant Drone
  private createDroneForte(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'drone_forte';

    const bodyMat = this.createSmoothMaterial('#f8fafc');
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const thrusterMat = this.createSmoothMaterial('#475569');

    // Spherical White Android Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bodyMat);
    body.position.y = 0.35;
    group.add(body);

    // Cyan Sensor Visor Eye
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), visorMat);
    visor.position.set(0, 0.38, 0.18);
    group.add(visor);

    // Dual Side Hover Thrusters with Energy Rings
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 6), thrusterMat);
    thrusterL.position.set(-0.30, 0.35, 0);
    thrusterL.rotation.z = Math.PI / 6;
    group.add(thrusterL);

    const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 6), thrusterMat);
    thrusterR.position.set(0.30, 0.35, 0);
    thrusterR.rotation.z = -Math.PI / 6;
    group.add(thrusterR);

    // Soft floating shadow
    group.add(this.createBlobShadow(0.28, 0.45));
    this.addCelOutline(group, 1.08, '#0f172a');
    return group;
  }

  // ─── CHARACTERS & RIGS BUILDER (Story of Seasons 1:1 + PS2 Aesthetics) ───
  private buildCharacters(sceneDef: typeof SCENES['farm'], state: GameState, monsters: MonsterEntity[]) {
    const currentHour = state.time.hour;
    this.activeToolType = state.player.activeTool;

    // 1. Build Articulated Player Rig
    this.playerMesh = this.createArticulatedHumanoid(state.player.appearance, true);
    this.playerTargetPos.set(state.player.x, 0, state.player.y);
    this.playerCurrentPos.set(state.player.x, 0, state.player.y);
    this.playerMesh.position.copy(this.playerCurrentPos);
    this.characterGroup.add(this.playerMesh);

    // 2. Build Scheduled NPCs
    Object.values(state.npcs).forEach((npc) => {
      const sched = npc.schedule[currentHour] || npc.schedule[12] || npc.schedule[6];
      if (sched && sched.scene === sceneDef.id) {
        const npcMesh = this.createNPCMesh(npc);
        npcMesh.position.set(sched.x, 0, sched.y);
        this.characterGroup.add(npcMesh);
        this.npcMeshes.set(npc.id, npcMesh);
      }
    });

    // 3. Build Farm Animals
    if (sceneDef.id === 'farm') {
      Object.values(state.animals).forEach((animal) => {
        const animalMesh = this.createAnimalMesh(animal);
        animalMesh.position.set(animal.x, 0, animal.y);
        this.characterGroup.add(animalMesh);
        this.animalMeshes.set(animal.id, animalMesh);
      });
    }

    // 4. Build Mobs (Supported across Mountains, Cemetery, Ocean & Innocent Life Dungeons)
    const combatScenes = ['dungeon', 'mountain', 'cemetery', 'ocean', 'dungeon_water', 'dungeon_fire', 'dungeon_forest'];
    if (combatScenes.includes(sceneDef.id)) {
      monsters.forEach((mob) => {
        const monsterMesh = this.createMonsterMesh(mob);
        monsterMesh.position.set(mob.x, 0, mob.y);
        this.characterGroup.add(monsterMesh);
        this.monsterMeshes.set(mob.id, monsterMesh);
      });
    }

    // 5. Build Innocent Life Drone Companion "Forte" when in Lab or on Farm
    if (sceneDef.id === 'lab_hope' || sceneDef.id === 'farm') {
      const drone = this.createDroneForte();
      if (sceneDef.id === 'lab_hope') {
        drone.position.set(9, 1.1, 6);
      } else {
        drone.position.set(state.player.x + 0.9, 1.25, state.player.y - 0.5);
      }
      this.characterGroup.add(drone);
    }
  }

  // ─── ARTICULATED HUMANOID SKELETON (Vitaboy + PS2 Adventurer Detailing) ───
  private createArticulatedHumanoid(app: GameState['player']['appearance'], isPlayer = false): THREE.Group {
    const root = new THREE.Group();
    root.name = 'humanoid_root';

    const skinColors = ['#ffe1b4', '#f0c396', '#cd9b6e', '#a87048', '#825534', '#f8eee1'];
    const hairColors = ['#3a2612', '#1c160c', '#d2b262', '#bc3e2a', '#9b9491', '#e4ded7'];
    const shirtColors = ['#32b94b', '#c33232', '#3750c3', '#ebda34', '#7a37c6', '#da822d', '#eb73af', '#30cdc3'];
    const pantsColors = ['#5880c3', '#735230', '#2d2837', '#807a87'];

    const skin = skinColors[app.skinIndex % skinColors.length];
    const hair = hairColors[app.hairIndex % hairColors.length];
    const shirt = shirtColors[app.shirtIndex % shirtColors.length];
    const pants = pantsColors[app.pantsIndex % pantsColors.length];

    // Pelvis Base
    const pelvis = new THREE.Group();
    pelvis.name = 'pelvis';
    pelvis.position.y = 0.55;
    root.add(pelvis);

    // Torso / Spine
    const torsoMat = this.createSmoothMaterial(shirt);
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.28), torsoMat);
    torsoMesh.position.y = 0.24;
    const torsoGroup = new THREE.Group();
    torsoGroup.name = 'torso';
    torsoGroup.add(torsoMesh);

    // Belt & Buckle
    const beltMat = this.createSmoothMaterial('#3d2817');
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.30), beltMat);
    belt.position.y = 0.04;
    torsoGroup.add(belt);

    const buckleMat = this.createSmoothMaterial('#fbbf24');
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 0.32), buckleMat);
    buckle.position.set(0, 0.04, 0.01);
    torsoGroup.add(buckle);

    // Adventurer Satchel/Backpack
    if (isPlayer) {
      const bagMat = this.createSmoothMaterial('#78350f');
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.16), bagMat);
      bag.position.set(0, 0.24, -0.21);
      torsoGroup.add(bag);
    }

    pelvis.add(torsoGroup);

    // Head Joint
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.y = 0.52;
    torsoGroup.add(headGroup);

    const headMat = this.createSmoothMaterial(skin);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), headMat);
    headMesh.position.y = 0.19;
    headGroup.add(headMesh);

    // Expressive PS2 Anime Eyes (Blinking support)
    const eyesGroup = new THREE.Group();
    eyesGroup.name = 'eyes_group';
    eyesGroup.position.set(0, 0.20, 0.195);

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x221133 });

    // Left Eye
    const eyeLWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), eyeWhiteMat);
    eyeLWhite.position.set(-0.10, 0, 0);
    const eyeLIris = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.06), eyeIrisMat);
    eyeLIris.position.set(-0.09, -0.01, 0.001);
    eyesGroup.add(eyeLWhite);
    eyesGroup.add(eyeLIris);

    // Right Eye
    const eyeRWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), eyeWhiteMat);
    eyeRWhite.position.set(0.10, 0, 0);
    const eyeRIris = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.06), eyeIrisMat);
    eyeRIris.position.set(0.09, -0.01, 0.001);
    eyesGroup.add(eyeRWhite);
    eyesGroup.add(eyeRIris);

    headGroup.add(eyesGroup);

    // Hair
    const hairMat = this.createSmoothMaterial(hair);
    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.20, 0.42), hairMat);
    hairMesh.position.y = 0.36;
    headGroup.add(hairMesh);

    // Hair Bangs
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.14), hairMat);
    bangs.position.set(0, 0.32, 0.18);
    headGroup.add(bangs);

    // Hat
    if (app.hatIndex !== 4) {
      const hatColors = ['#d7aa64', '#7641cd', '#e4c65f', '#4e80e1'];
      const hatMat = this.createSmoothMaterial(hatColors[app.hatIndex % hatColors.length]);
      const hatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.52, 0.12, 12), hatMat);
      hatMesh.position.y = 0.48;
      headGroup.add(hatMesh);
    }

    // Left Arm
    const armL = new THREE.Group();
    armL.name = 'armL';
    armL.position.set(-0.28, 0.42, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.14), torsoMat);
    armLMesh.position.y = -0.16;
    armL.add(armLMesh);
    const handLMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), headMat);
    handLMesh.position.y = -0.36;
    armL.add(handLMesh);
    torsoGroup.add(armL);

    // Right Arm
    const armR = new THREE.Group();
    armR.name = 'armR';
    armR.position.set(0.28, 0.42, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.14), torsoMat);
    armRMesh.position.y = -0.16;
    armR.add(armRMesh);
    const handRMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), headMat);
    handRMesh.position.y = -0.36;
    armR.add(handRMesh);

    // Equipped Tool Container (Right Hand)
    if (isPlayer) {
      const toolContainer = new THREE.Group();
      toolContainer.name = 'playerTool';
      toolContainer.position.set(0, -0.36, 0.15);
      this.rebuildToolModel(toolContainer, this.activeToolType);
      armR.add(toolContainer);
    }

    torsoGroup.add(armR);

    // Left Leg & Chunky Boots
    const pantsMat = this.createSmoothMaterial(pants);
    const legL = new THREE.Group();
    legL.name = 'legL';
    legL.position.set(-0.12, 0, 0);
    const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.18), pantsMat);
    legLMesh.position.y = -0.18;
    legL.add(legLMesh);

    // Boot
    const bootMat = this.createSmoothMaterial('#451a03');
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.16, 0.22), bootMat);
    bootL.position.set(0, -0.42, 0.02);
    legL.add(bootL);
    pelvis.add(legL);

    // Right Leg & Chunky Boots
    const legR = new THREE.Group();
    legR.name = 'legR';
    legR.position.set(0.12, 0, 0);
    const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.18), pantsMat);
    legRMesh.position.y = -0.18;
    legR.add(legRMesh);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.16, 0.22), bootMat);
    bootR.position.set(0, -0.42, 0.02);
    legR.add(bootR);
    pelvis.add(legR);

    // Contact Blob Shadow Disk
    const blobShadow = this.createBlobShadow(0.44, 0.6);
    root.add(blobShadow);

    // Inverted-Hull Cel Outlines
    this.addCelOutline(root, 1.055, '#151020');

    // Overhead Item Container
    const heldContainer = new THREE.Group();
    heldContainer.name = 'heldItemContainer';
    heldContainer.position.set(0, 1.45, 0);
    heldContainer.visible = false;
    root.add(heldContainer);

    return root;
  }

  // ─── NPC CUSTOM RIGS (Arsa, Sari, Budi, Tirta, Naya) ───
  private createNPCMesh(npc: NPCData): THREE.Group {
    const isElder = npc.id === 'arsa';
    const isSmith = npc.id === 'budi';
    const isDoctor = npc.id === 'tirta';
    const isMerchant = npc.id === 'sari';
    const isNaya = npc.id === 'naya';

    const app = {
      name: npc.name,
      skinIndex: isElder ? 5 : isSmith ? 3 : isNaya ? 0 : 1,
      hairIndex: isElder ? 4 : isDoctor ? 1 : isSmith ? 0 : 2,
      shirtIndex: isDoctor ? 7 : isSmith ? 1 : isMerchant ? 5 : isNaya ? 6 : 2,
      pantsIndex: isSmith ? 2 : isElder ? 1 : 0,
      hatIndex: isSmith ? 0 : isNaya ? 2 : 4,
    };

    const group = this.createArticulatedHumanoid(app, false);

    // Custom NPC Handheld Accessories
    if (isElder) {
      // Walking Stick Cane
      const woodMat = this.createSmoothMaterial('#854d0e', 'wood_plank');
      const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 6), woodMat);
      cane.position.set(0.35, 0.45, 0.15);
      group.add(cane);
    } else if (isSmith) {
      // Heavy Blacksmith Forging Hammer
      const metalMat = this.createSmoothMaterial('#475569');
      const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), metalMat);
      hammer.position.set(0.32, 0.35, 0.22);
      group.add(hammer);
    } else if (isMerchant) {
      // Woven Market Basket with Fresh Fruit
      const basketMat = this.createSmoothMaterial('#b45309');
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.2, 8), basketMat);
      basket.position.set(-0.35, 0.38, 0.1);
      group.add(basket);
    } else if (isNaya) {
      // Flower Bouquet
      const flowerMat = this.createSmoothMaterial('#f43f5e');
      const flowers = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), flowerMat);
      flowers.position.set(0.32, 0.42, 0.15);
      group.add(flowers);
    }

    return group;
  }

  // ─── LIVING ANIMAL MODELS (PS2 Harvest Moon AWL 1:1) ───
  private createAnimalMesh(animal: GameState['animals'][string]): THREE.Group {
    const group = new THREE.Group();
    group.name = `animal_${animal.id}`;
    const isCow = animal.type === 'sapi';
    const isHen = animal.type === 'ayam';
    const isDuck = animal.type === 'bebek';
    const isGoat = animal.type === 'kambing';
    const isSheep = animal.type === 'domba';

    if (isHen) {
      // Chicken / Ayam Pio
      const bodyMat = this.createSmoothMaterial('#cbbe9e');
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bodyMat);
      body.name = 'hen_body';
      body.position.y = 0.28;
      group.add(body);

      // Red Comb Crown
      const combMat = this.createSmoothMaterial('#dc2626');
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.14), combMat);
      comb.position.set(0, 0.48, 0.08);
      group.add(comb);

      // Red Wattle
      const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.06), combMat);
      wattle.position.set(0, 0.26, 0.25);
      group.add(wattle);

      // Golden Beak
      const beakMat = this.createSmoothMaterial('#f59e0b');
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.34, 0.28);
      group.add(beak);

      // Wings
      const wingMat = this.createSmoothMaterial('#b8ab8d');
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.24), wingMat);
      wingL.name = 'wingL';
      wingL.position.set(-0.25, 0.30, 0);
      group.add(wingL);

      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.24), wingMat);
      wingR.name = 'wingR';
      wingR.position.set(0.25, 0.30, 0);
      group.add(wingR);

      // Blob shadow & cel outline
      group.add(this.createBlobShadow(0.28, 0.5));
      this.addCelOutline(group, 1.05, '#2e2518');
    } else if (isDuck) {
      // Duck / Bebek Petelur Karsa
      const bodyMat = this.createSmoothMaterial('#fef08a');
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 8), bodyMat);
      body.name = 'duck_body';
      body.position.y = 0.28;
      group.add(body);

      // Orange Duck Bill
      const billMat = this.createSmoothMaterial('#ea580c');
      const bill = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.16), billMat);
      bill.position.set(0, 0.32, 0.30);
      group.add(bill);

      // Duck Wings
      const wingMat = this.createSmoothMaterial('#fde047');
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.24), wingMat);
      wingL.name = 'wingL';
      wingL.position.set(-0.27, 0.30, 0);
      group.add(wingL);

      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.24), wingMat);
      wingR.name = 'wingR';
      wingR.position.set(0.27, 0.30, 0);
      group.add(wingR);

      group.add(this.createBlobShadow(0.30, 0.5));
      this.addCelOutline(group, 1.05, '#854d0e');
    } else if (isCow) {
      // Cow / Sapi Betsy (AWL iconic)
      const bodyMat = this.createSmoothMaterial('#f1f5f9');
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 1.15), bodyMat);
      body.name = 'cow_body';
      body.position.y = 0.54;
      group.add(body);

      // Cow spots
      const spotMat = this.createSmoothMaterial('#292524');
      const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.42), spotMat);
      spot1.position.set(0.22, 0.60, 0.12);
      group.add(spot1);

      const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.35), spotMat);
      spot2.position.set(-0.22, 0.52, -0.22);
      group.add(spot2);

      // Legs
      const legMat = this.createSmoothMaterial('#e2e8f0');
      const hoofMat = this.createSmoothMaterial('#1c1917');
      for (const [lx, lz] of [[-0.26, 0.38], [0.26, 0.38], [-0.26, -0.38], [0.26, -0.38]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 6), legMat);
        leg.position.set(lx, 0.22, lz);
        group.add(leg);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 6), hoofMat);
        hoof.position.set(lx, 0.05, lz);
        group.add(hoof);
      }

      // Head & Ears
      const head = new THREE.Group();
      head.name = 'cow_head';
      head.position.set(0, 0.75, 0.58);

      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.40, 0.44), bodyMat);
      head.add(headMesh);

      // Horns
      const hornMat = this.createSmoothMaterial('#fef3c7');
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), hornMat);
      hornL.rotation.z = -Math.PI / 4;
      hornL.position.set(-0.22, 0.22, 0.05);
      head.add(hornL);

      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), hornMat);
      hornR.rotation.z = Math.PI / 4;
      hornR.position.set(0.22, 0.22, 0.05);
      head.add(hornR);

      // Pink Muzzle & Chewing Jaw
      const muzzleMat = this.createSmoothMaterial('#f472b6');
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.24), muzzleMat);
      muzzle.name = 'cow_muzzle';
      muzzle.position.set(0, -0.11, 0.26);
      head.add(muzzle);

      // Golden Bell on Collar
      const collarMat = this.createSmoothMaterial('#7f1d1d');
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 8), collarMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, -0.15, 0.05);
      head.add(collar);

      const bellMat = this.createSmoothMaterial('#f59e0b');
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 6), bellMat);
      bell.position.set(0, -0.28, 0.08);
      head.add(bell);

      group.add(head);

      // Tail with Swish Tuft
      const tailGroup = new THREE.Group();
      tailGroup.name = 'cow_tail';
      tailGroup.position.set(0, 0.65, -0.62);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.38, 4), bodyMat);
      tail.position.y = -0.18;
      tailGroup.add(tail);
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), spotMat);
      tuft.position.y = -0.38;
      tailGroup.add(tuft);
      group.add(tailGroup);

      group.add(this.createBlobShadow(0.68, 0.65));
      this.addCelOutline(group, 1.05, '#1c1917');
    } else if (isSheep) {
      // Sheep / Domba (Puffy Cloud Spheres Wool)
      const woolMat = this.createSmoothMaterial('#f8fafc');
      const sheepGroup = new THREE.Group();
      sheepGroup.name = 'sheep_body';

      // Multi-sphere puffy cloud body
      for (let i = 0; i < 7; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), woolMat);
        const px = ((i % 3) - 1) * 0.22;
        const pz = (Math.floor(i / 3) - 1) * 0.28;
        puff.position.set(px, 0.48 + (i % 2) * 0.08, pz);
        sheepGroup.add(puff);
      }
      group.add(sheepGroup);

      // Cute face
      const faceMat = this.createSmoothMaterial('#fed7aa');
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.32), faceMat);
      head.position.set(0, 0.62, 0.44);
      group.add(head);

      // Floppy ears
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.06), faceMat);
      earL.position.set(-0.18, 0.62, 0.38);
      earL.rotation.z = Math.PI / 4;
      group.add(earL);

      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.06), faceMat);
      earR.position.set(0.18, 0.62, 0.38);
      earR.rotation.z = -Math.PI / 4;
      group.add(earR);

      group.add(this.createBlobShadow(0.55, 0.6));
      this.addCelOutline(group, 1.05, '#292524');
    } else {
      // Goat / Kambing
      const goatMat = this.createSmoothMaterial('#785a3c');
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.46, 0.88), goatMat);
      body.name = 'goat_body';
      body.position.y = 0.48;
      group.add(body);

      const head = new THREE.Group();
      head.name = 'goat_head';
      head.position.set(0, 0.68, 0.46);
      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 0.36), goatMat);
      head.add(headMesh);

      // Horns
      const hornMat = this.createSmoothMaterial('#475569');
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), hornMat);
      hornL.rotation.x = -Math.PI / 5;
      hornL.position.set(-0.12, 0.20, -0.05);
      head.add(hornL);

      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), hornMat);
      hornR.rotation.x = -Math.PI / 5;
      hornR.position.set(0.12, 0.20, -0.05);
      head.add(hornR);

      // Chin Goatee Beard
      const beardMat = this.createSmoothMaterial('#cbd5e1');
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), beardMat);
      beard.rotation.x = Math.PI;
      beard.position.set(0, -0.22, 0.12);
      head.add(beard);

      group.add(head);

      group.add(this.createBlobShadow(0.55, 0.6));
      this.addCelOutline(group, 1.05, '#1e293b');
    }

    return group;
  }

  // ─── MONSTER MODELS (Boss Bhutakala & Mobs) ───
  private createMonsterMesh(mob: MonsterEntity): THREE.Group {
    const group = new THREE.Group();
    group.name = `mob_${mob.id}`;

    if (mob.isBoss) {
      // Demonic Boss Bhutakala Swarga or Ancient Volcano Titan
      const bossMat = this.createSmoothMaterial(mob.color || '#7f1d1d');
      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 1), bossMat);
      body.name = 'boss_body';
      body.position.y = 1.35;
      group.add(body);

      // Glowing Demonic Horns
      const hornMat = this.createSmoothMaterial('#dc2626');
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 5), hornMat);
      hornL.rotation.z = -Math.PI / 3;
      hornL.position.set(-0.9, 2.1, 0);
      group.add(hornL);

      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 5), hornMat);
      hornR.rotation.z = Math.PI / 3;
      hornR.position.set(0.9, 2.1, 0);
      group.add(hornR);

      // Glowing Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
      eyeL.position.set(-0.35, 1.55, 1.15);
      group.add(eyeL);

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
      eyeR.position.set(0.35, 1.55, 1.15);
      group.add(eyeR);

      group.add(this.createBlobShadow(1.4, 0.75));
      this.addCelOutline(group, 1.05, '#450a0a');
    } else if (mob.type === 'golem_air') {
      // Ancient Water Spirit Automaton (Kuil Air Kuno)
      const stoneMat = this.createSmoothMaterial('#0284c7');
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.75, 0.45), stoneMat);
      body.name = 'golem_body';
      body.position.y = 0.58;
      group.add(body);

      // Glowing Aquamarine Crystal Core in Chest
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
      core.position.set(0, 0.62, 0.25);
      group.add(core);

      // Floating stone fists
      const fistL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMat);
      fistL.position.set(-0.52, 0.48, 0.15);
      group.add(fistL);

      const fistR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMat);
      fistR.position.set(0.52, 0.48, 0.15);
      group.add(fistR);

      group.add(this.createBlobShadow(0.58, 0.6));
      this.addCelOutline(group, 1.06, '#082f49');
    } else if (mob.type === 'salamander_api') {
      // Magma Salamander (Reruntuhan Lahar Api)
      const fireMat = this.createSmoothMaterial('#ea580c');
      const magmaMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.85), fireMat);
      body.position.y = 0.28;
      group.add(body);

      // Dorsal Magma Spikes
      for (let i = 0; i < 3; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), magmaMat);
        spike.position.set(0, 0.48, (i - 1) * 0.25);
        group.add(spike);
      }

      // Tail
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 4), fireMat);
      tail.rotation.x = -Math.PI / 2;
      tail.position.set(0, 0.28, -0.6);
      group.add(tail);

      group.add(this.createBlobShadow(0.55, 0.55));
      this.addCelOutline(group, 1.06, '#431407');
    } else if (mob.type === 'kepiting_karang') {
      // Coral Crab (Samudra & Karang Paskah)
      const crabMat = this.createSmoothMaterial('#f43f5e');
      const clawMat = this.createSmoothMaterial('#fb7185');
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), crabMat);
      body.scale.set(1.4, 0.6, 1.0);
      body.position.y = 0.25;
      group.add(body);

      // Dual Pincers
      const pincerL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), clawMat);
      pincerL.position.set(-0.45, 0.3, 0.25);
      group.add(pincerL);

      const pincerR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), clawMat);
      pincerR.position.set(0.45, 0.3, 0.25);
      group.add(pincerR);

      group.add(this.createBlobShadow(0.5, 0.5));
      this.addCelOutline(group, 1.06, '#881337');
    } else if (mob.type === 'mecha_drone') {
      // Ancient Flying Security Drone (Reruntuhan Hutan / Lab)
      const metalMat = this.createSmoothMaterial('#475569');
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.45, 4), metalMat);
      body.position.y = 0.65;
      group.add(body);

      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lensMat);
      lens.position.set(0, 0.62, 0.22);
      group.add(lens);

      group.add(this.createBlobShadow(0.35, 0.4));
      this.addCelOutline(group, 1.08, '#0f172a');
    } else {
      const mobMat = this.createSmoothMaterial(mob.color || '#ef4444');
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), mobMat);
      body.name = 'mob_body';
      body.position.y = 0.52;
      group.add(body);

      group.add(this.createBlobShadow(0.45, 0.55));
      this.addCelOutline(group, 1.06, '#310a0a');
    }

    return group;
  }

  // ─── ACTION TRIGGER ANIMATIONS (Called by App.tsx) ───
  public triggerToolAction(tool: ToolType | 'sikat' | 'elus' | string, targetX?: number, targetY?: number) {
    this.activeToolType = tool;

    // Rebuild tool mesh in hand
    const playerTool = this.playerMesh.getObjectByName('playerTool') as THREE.Group;
    if (playerTool) {
      this.rebuildToolModel(playerTool, tool);
    }

    if (tool === 'cangkul') {
      this.playAction('hoe', 0.65);
      this.spawnActionDust(this.playerCurrentPos.x, this.playerCurrentPos.z);
    } else if (tool === 'siram') {
      this.playAction('water', 0.85);
      this.spawnWaterDroplets(this.playerCurrentPos.x, this.playerCurrentPos.z);
    } else if (tool === 'sabit' || tool === 'tangan') {
      this.playAction('harvest', 0.95);
      this.spawnSparkles(this.playerCurrentPos.x, this.playerCurrentPos.z + 0.3);
    } else if (tool === 'kapak') {
      this.playAction('axe', 0.55);
      this.spawnActionDust(this.playerCurrentPos.x, this.playerCurrentPos.z);
    } else if (tool === 'beliung') {
      this.playAction('pickaxe', 0.55);
      this.spawnActionDust(this.playerCurrentPos.x, this.playerCurrentPos.z);
    } else if (tool === 'pedang') {
      this.playAction('sword', 0.45);
    } else if (tool === 'sikat' || tool === 'elus') {
      this.playAction('pet', 0.9);
      this.spawnHeartEmote(this.playerCurrentPos.x, this.playerCurrentPos.z + 0.5);
    } else if (tool === 'pancing') {
      this.playAction('fish_cast', 0.7);
    }
  }

  public triggerHarvestCelebration(cropId: string) {
    const heldContainer = this.playerMesh.getObjectByName('heldItemContainer') as THREE.Group;
    if (heldContainer) {
      while (heldContainer.children.length > 0) heldContainer.remove(heldContainer.children[0]);

      const item = ITEMS[cropId];
      const crop = CROPS[cropId];
      const col = crop?.fruitColor || '#f59e0b';
      const produceMat = this.createSmoothMaterial(col);
      const produceMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), produceMat);
      heldContainer.add(produceMesh);
    }

    this.playAction('harvest', 1.4);
    this.spawnSparkles(this.playerCurrentPos.x, this.playerCurrentPos.z, 14);
  }

  private rebuildToolModel(container: THREE.Group, toolType: ToolType | 'sikat' | string) {
    while (container.children.length > 0) {
      container.remove(container.children[0]);
    }

    const woodMat = this.createSmoothMaterial('#854d0e', 'wood_plank');
    const metalMat = this.createSmoothMaterial('#94a3b8');

    if (toolType === 'cangkul') {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 6), woodMat);
      handle.rotation.x = Math.PI / 4;
      container.add(handle);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.04), metalMat);
      blade.position.set(0, 0.28, 0.28);
      blade.rotation.x = Math.PI / 2;
      container.add(blade);
    } else if (toolType === 'siram') {
      const canMat = this.createSmoothMaterial('#0284c7');
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.26, 8), canMat);
      container.add(body);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.25, 6), metalMat);
      spout.position.set(0, 0.08, 0.16);
      spout.rotation.x = Math.PI / 4;
      container.add(spout);
    } else if (toolType === 'sabit') {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), woodMat);
      container.add(handle);
      const blade = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 4, 8, Math.PI), metalMat);
      blade.position.set(0.1, 0.22, 0);
      container.add(blade);
    } else if (toolType === 'kapak') {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.75, 6), woodMat);
      container.add(handle);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.05), metalMat);
      head.position.set(0.08, 0.32, 0);
      container.add(head);
    } else if (toolType === 'beliung') {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.75, 6), woodMat);
      container.add(handle);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.4, 4), metalMat);
      head.rotation.z = Math.PI / 2;
      head.position.set(0, 0.32, 0);
      container.add(head);
    } else if (toolType === 'pedang') {
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 6), woodMat);
      container.add(hilt);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.06), metalMat);
      guard.position.y = 0.1;
      container.add(guard);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.65, 0.02), metalMat);
      blade.position.y = 0.42;
      container.add(blade);
    } else if (toolType === 'pancing') {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 1.4, 6), woodMat);
      rod.rotation.x = Math.PI / 4;
      rod.position.set(0, 0.5, 0.5);
      container.add(rod);
    } else if (toolType === 'sikat') {
      const brushMat = this.createSmoothMaterial('#e0e7ff');
      const brush = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), brushMat);
      container.add(brush);
    }
  }

  private playAction(action: PlayerAnimAction, duration: number) {
    this.currentAction = action;
    this.actionDuration = duration;
    this.actionTimer = 0;
  }

  // ─── ACTION PARTICLES & EMOTES ───
  private spawnActionDust(px: number, pz: number) {
    const dustMat = this.createSmoothMaterial('#d6c7a1', undefined, true, 0.85);
    for (let i = 0; i < 6; i++) {
      const dust = new THREE.Mesh(new THREE.SphereGeometry(0.09, 4, 4), dustMat);
      dust.position.set(px + (Math.random() - 0.5) * 0.4, 0.1, pz + (Math.random() - 0.5) * 0.4);
      this.fxGroup.add(dust);
      this.activeParticles.push({
        mesh: dust,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6),
        life: 0,
        maxLife: 0.45,
      });
    }
  }

  private spawnWaterDroplets(px: number, pz: number) {
    const dropMat = this.createSmoothMaterial('#38bdf8', undefined, true, 0.9);
    for (let i = 0; i < 8; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), dropMat);
      drop.position.set(px + (Math.random() - 0.5) * 0.3, 0.4, pz + 0.3 + (Math.random() - 0.5) * 0.3);
      this.fxGroup.add(drop);
      this.activeParticles.push({
        mesh: drop,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, -0.6, 0.5 + (Math.random() - 0.5) * 0.4),
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  private spawnSparkles(px: number, pz: number, count = 8) {
    const sparkMat = this.createSmoothMaterial('#facc15', undefined, true, 0.95);
    for (let i = 0; i < count; i++) {
      const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), sparkMat);
      spark.position.set(px + (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.8, pz + (Math.random() - 0.5) * 0.6);
      this.fxGroup.add(spark);
      this.activeParticles.push({
        mesh: spark,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8),
        life: 0,
        maxLife: 0.6,
      });
    }
  }

  public spawnDamageNumber(px: number, pz: number, amount: number, isCritical = false) {
    this.spawnSparkles(px, pz, 10);
  }

  private spawnHeartEmote(px: number, pz: number) {
    const heartMat = this.createSmoothMaterial('#f43f5e', undefined, true, 0.95);
    const heart = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), heartMat);
    heart.position.set(px, 1.5, pz);
    this.fxGroup.add(heart);
    this.activeParticles.push({
      mesh: heart,
      velocity: new THREE.Vector3(0, 0.85, 0),
      life: 0,
      maxLife: 0.8,
    });
  }

  // Visual joyful hop and sound mote above animal when emitting ambient noise
  public triggerAnimalEmote(animalId: string) {
    const mesh = this.animalMeshes.get(animalId);
    if (!mesh) return;

    // Joyful little bounce animation
    const initY = 0;
    let t = 0;
    const bounceInterval = setInterval(() => {
      t += 0.12;
      if (t >= Math.PI) {
        mesh.position.y = initY;
        clearInterval(bounceInterval);
      } else {
        mesh.position.y = initY + Math.sin(t) * 0.18;
      }
    }, 25);

    // Spawn musical / vocal sound mote
    this.spawnAnimalSoundEmote(mesh.position.x, mesh.position.z);
  }

  public spawnAnimalSoundEmote(px: number, pz: number) {
    const noteMat = this.createSmoothMaterial('#f59e0b', undefined, true, 0.95);
    const note = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), noteMat);
    note.position.set(px, 1.35, pz);
    this.fxGroup.add(note);
    this.activeParticles.push({
      mesh: note,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.85, (Math.random() - 0.5) * 0.25),
      life: 0,
      maxLife: 0.75,
    });
    this.spawnSparkles(px, pz, 4);
  }

  // ─── DAY / NIGHT LIGHTING & ATMOSPHERIC PARTICLES ───
  private updateLightingAndWeather(state: GameState, sceneDef?: SceneDef) {
    const hour = state.time.hour + state.time.minute / 60;
    const season = state.time.season;
    const sceneId = sceneDef?.id || state.player.scene;

    // Special Environmental Themes for Innocent Life Scenes
    if (sceneId === 'ocean') {
      // Innocent Life Pristine Tropical Paradise Ocean
      this.scene.background = new THREE.Color('#38bdf8');
      this.scene.fog = new THREE.FogExp2('#38bdf8', 0.009);
      this.globalUniforms.sm_sun_dir.value.set(-0.4, -0.9, -0.3).normalize();
      this.globalUniforms.sm_sun_color.value.set(1.15, 1.12, 1.02);
      this.globalUniforms.sm_ambient.value.set(0.55, 0.58, 0.65);
      this.setAmbientParticleSystem('pollen');
      return;
    } else if (sceneId === 'dungeon_water') {
      // Subterranean Aquamarine Water Spirit Shrine
      this.scene.background = new THREE.Color('#031728');
      this.scene.fog = new THREE.FogExp2('#031728', 0.022);
      this.globalUniforms.sm_sun_dir.value.set(0.0, -1.0, 0.0).normalize();
      this.globalUniforms.sm_sun_color.value.set(0.25, 0.70, 0.98);
      this.globalUniforms.sm_ambient.value.set(0.28, 0.48, 0.62);
      this.setAmbientParticleSystem('fireflies');
      return;
    } else if (sceneId === 'dungeon_fire') {
      // Volcanic Magma Cavern
      this.scene.background = new THREE.Color('#180402');
      this.scene.fog = new THREE.FogExp2('#180402', 0.024);
      this.globalUniforms.sm_sun_dir.value.set(0.0, -1.0, 0.0).normalize();
      this.globalUniforms.sm_sun_color.value.set(1.25, 0.48, 0.16);
      this.globalUniforms.sm_ambient.value.set(0.52, 0.22, 0.12);
      this.setAmbientParticleSystem('fireflies');
      return;
    } else if (sceneId === 'dungeon_forest') {
      // Overgrown Ancient Forest Ziggurat
      this.scene.background = new THREE.Color('#06150b');
      this.scene.fog = new THREE.FogExp2('#06150b', 0.020);
      this.globalUniforms.sm_sun_dir.value.set(0.0, -1.0, 0.0).normalize();
      this.globalUniforms.sm_sun_color.value.set(0.42, 0.92, 0.52);
      this.globalUniforms.sm_ambient.value.set(0.32, 0.52, 0.36);
      this.setAmbientParticleSystem('fireflies');
      return;
    } else if (sceneId === 'lab_hope') {
      // Dr. Hope's High-Tech Research Facility
      this.scene.background = new THREE.Color('#0b1329');
      this.scene.fog = new THREE.FogExp2('#0b1329', 0.015);
      this.globalUniforms.sm_sun_dir.value.set(0.2, -0.9, 0.3).normalize();
      this.globalUniforms.sm_sun_color.value.set(0.92, 0.98, 1.15);
      this.globalUniforms.sm_ambient.value.set(0.48, 0.52, 0.62);
      return;
    }

    if (hour >= 5 && hour < 8) {
      // Dawn (Soft violet-pink mist)
      this.scene.background = new THREE.Color('#382846');
      this.scene.fog = new THREE.FogExp2('#382846', 0.016);
      this.globalUniforms.sm_sun_dir.value.set(-0.6, -0.6, -0.4).normalize();
      this.globalUniforms.sm_sun_color.value.set(1.02, 0.85, 0.65);
      this.globalUniforms.sm_ambient.value.set(0.42, 0.38, 0.45);
      this.setAmbientParticleSystem('pollen');
    } else if (hour >= 8 && hour < 17) {
      // Golden Daytime (Harvest Moon AWL sunny haze)
      this.scene.background = new THREE.Color('#5ba2eb');
      this.scene.fog = new THREE.FogExp2('#5ba2eb', 0.011);
      this.globalUniforms.sm_sun_dir.value.set(-0.5, -0.8, -0.4).normalize();
      this.globalUniforms.sm_sun_color.value.set(1.08, 1.04, 0.92);
      this.globalUniforms.sm_ambient.value.set(0.50, 0.48, 0.52);

      if (season === 'Semi') this.setAmbientParticleSystem('petals');
      else if (season === 'Gugur') this.setAmbientParticleSystem('leaves');
      else this.setAmbientParticleSystem('pollen');
    } else if (hour >= 17 && hour < 19) {
      // Golden Sunset
      this.scene.background = new THREE.Color('#833825');
      this.scene.fog = new THREE.FogExp2('#833825', 0.018);
      this.globalUniforms.sm_sun_dir.value.set(-0.8, -0.35, -0.3).normalize();
      this.globalUniforms.sm_sun_color.value.set(1.15, 0.65, 0.32);
      this.globalUniforms.sm_ambient.value.set(0.45, 0.35, 0.32);
      this.setAmbientParticleSystem('fireflies');
    } else {
      // Deep Indigo Night (Moonlit glow & glowing fireflies)
      this.scene.background = new THREE.Color('#0f0c18');
      this.scene.fog = new THREE.FogExp2('#0f0c18', 0.024);
      this.globalUniforms.sm_sun_dir.value.set(0.3, -0.8, 0.5).normalize();
      this.globalUniforms.sm_sun_color.value.set(0.24, 0.36, 0.58);
      this.globalUniforms.sm_ambient.value.set(0.26, 0.24, 0.34);
      this.setAmbientParticleSystem('fireflies');
    }

    // Weather Particles (Rain / Storm / Snow)
    if (state.time.weather === 'Hujan' || state.time.weather === 'Badai') {
      this.createRainParticles();
    } else if (state.time.weather === 'Bersalju') {
      this.createSnowParticles();
    } else if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
      this.weatherParticles = null;
    }
  }

  // ─── PS2 ATMOSPHERIC PARTICLES (Fireflies, Golden Pollen, Cherry Blossoms) ───
  private setAmbientParticleSystem(type: 'pollen' | 'fireflies' | 'petals' | 'leaves') {
    if (this.currentAmbientType === type && this.ambientParticles) return;
    this.currentAmbientType = type;

    if (this.ambientParticles) {
      this.ambientParticleGroup.remove(this.ambientParticles);
      this.ambientParticles.geometry.dispose();
      this.ambientParticles = null;
    }

    const count = type === 'fireflies' ? 90 : type === 'petals' ? 120 : 100;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 45 + 15;
      positions[i + 1] = 0.4 + Math.random() * 5.0;
      positions[i + 2] = (Math.random() - 0.5) * 45 + 15;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    let col = '#fef08a';
    let size = 0.16;

    if (type === 'fireflies') {
      col = '#86efac';
      size = 0.22;
    } else if (type === 'petals') {
      col = '#fbcfe8';
      size = 0.20;
    } else if (type === 'leaves') {
      col = '#f97316';
      size = 0.20;
    }

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(col),
      size: size,
      transparent: true,
      opacity: 0.85,
    });

    this.ambientParticles = new THREE.Points(geo, mat);
    this.ambientParticleGroup.add(this.ambientParticles);
  }

  private createRainParticles() {
    if (this.weatherParticles) this.scene.remove(this.weatherParticles);
    const count = 900;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60 + 15;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 60 + 15;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: '#82b9ff', size: 0.14, transparent: true, opacity: 0.75 });
    this.weatherParticles = new THREE.Points(geo, mat);
    this.scene.add(this.weatherParticles);
  }

  private createSnowParticles() {
    if (this.weatherParticles) this.scene.remove(this.weatherParticles);
    const count = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60 + 15;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 60 + 15;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: '#ffffff', size: 0.22, transparent: true, opacity: 0.85 });
    this.weatherParticles = new THREE.Points(geo, mat);
    this.scene.add(this.weatherParticles);
  }

  public updatePlayerPosition(x: number, y: number) {
    this.playerTargetPos.set(x, 0, y);
  }

  private updateCameraPosition(px: number, pz: number, instant = false) {
    const targetX = px;
    const targetY = this.CAM_LIFT;
    const targetZ = pz;

    if (instant) {
      this.camCurrentLookAt.set(targetX, targetY, targetZ);
    } else {
      this.camCurrentLookAt.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.12);
    }

    const camY = this.camCurrentLookAt.y + Math.sin(this.CAM_PITCH_RAD) * this.CAM_DIST;
    const camZ = this.camCurrentLookAt.z + Math.cos(this.CAM_PITCH_RAD) * this.CAM_DIST;
    const camX = this.camCurrentLookAt.x;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.camCurrentLookAt);
  }

  // ─── ANIMATION ENGINE & TICK ───
  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.globalUniforms.grs_time.value = time;
    this.waterMaterial.uniforms.u_time.value = time;
    this.lavaMaterial.uniforms.u_time.value = time;
    this.waterfallMaterial.uniforms.u_time.value = time;

    // 1. Locomotion & Position Interpolation
    const dist = this.playerCurrentPos.distanceTo(this.playerTargetPos);
    const isMoving = dist > 0.02;

    if (isMoving) {
      const moveDir = new THREE.Vector3().subVectors(this.playerTargetPos, this.playerCurrentPos).normalize();
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.playerFacingAngle = targetAngle;

      this.playerCurrentPos.lerp(this.playerTargetPos, Math.min(1, dt * 12));
      this.walkBob += dt * 14;
    }

    this.playerMesh.position.copy(this.playerCurrentPos);
    this.playerMesh.rotation.y = this.playerFacingAngle;

    // 2. Bone Hierarchy References
    const pelvis = this.playerMesh.getObjectByName('pelvis') as THREE.Group;
    const torso = this.playerMesh.getObjectByName('torso') as THREE.Group;
    const head = this.playerMesh.getObjectByName('head') as THREE.Group;
    const armL = this.playerMesh.getObjectByName('armL') as THREE.Group;
    const armR = this.playerMesh.getObjectByName('armR') as THREE.Group;
    const legL = this.playerMesh.getObjectByName('legL') as THREE.Group;
    const legR = this.playerMesh.getObjectByName('legR') as THREE.Group;
    const heldContainer = this.playerMesh.getObjectByName('heldItemContainer') as THREE.Group;
    const eyesGroup = this.playerMesh.getObjectByName('eyes_group') as THREE.Group;

    // 3. PS2 Natural Blinking Animation
    this.blinkTimer += dt;
    if (this.blinkTimer > 3.8) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.0) {
        this.blinkTimer = 0;
        this.isBlinking = false;
      }
    }
    if (eyesGroup) {
      eyesGroup.scale.y = this.isBlinking ? 0.1 : 1.0;
    }

    // 4. Update Action Timers
    if (this.currentAction !== 'idle' && this.currentAction !== 'walk') {
      this.actionTimer += dt;
      if (this.actionTimer >= this.actionDuration) {
        this.currentAction = 'idle';
        this.actionTimer = 0;
        if (heldContainer) heldContainer.visible = false;
      }
    }

    const actionProgress = this.actionTimer / Math.max(this.actionDuration, 0.01);

    // 5. Procedural Character Motion
    if (this.currentAction === 'hoe' || this.currentAction === 'axe' || this.currentAction === 'pickaxe') {
      if (torso && armR && armL) {
        const strike = Math.sin(actionProgress * Math.PI);
        if (actionProgress < 0.4) {
          torso.rotation.x = -0.3 * strike;
          armR.rotation.x = -Math.PI * 0.7 * strike;
          armL.rotation.x = -Math.PI * 0.5 * strike;
        } else {
          torso.rotation.x = 0.5 * strike;
          armR.rotation.x = 0.8 * strike;
          armL.rotation.x = 0.6 * strike;
        }
      }
    } else if (this.currentAction === 'water') {
      if (torso && armR) {
        torso.rotation.x = 0.2;
        armR.rotation.x = -0.45;
        armR.rotation.z = -0.35;
      }
    } else if (this.currentAction === 'harvest') {
      if (torso && armR && armL && heldContainer) {
        if (actionProgress < 0.3) {
          torso.position.y = 0.1;
          torso.rotation.x = 0.45;
          armR.rotation.x = 0.45;
          armL.rotation.x = 0.45;
          heldContainer.visible = false;
        } else {
          torso.position.y = 0.24;
          torso.rotation.x = -0.08;
          armR.rotation.x = -Math.PI * 0.85;
          armL.rotation.x = -Math.PI * 0.85;
          armR.rotation.z = -0.2;
          armL.rotation.z = 0.2;
          heldContainer.visible = true;
        }
      }
    } else if (this.currentAction === 'sword') {
      if (torso && armR) {
        const sweep = Math.sin(actionProgress * Math.PI * 2);
        torso.rotation.y = sweep * 0.6;
        armR.rotation.x = -0.8 + sweep * 1.6;
        armR.rotation.z = sweep * 0.8;
      }
    } else if (this.currentAction === 'pet') {
      if (torso && armR) {
        torso.position.y = 0.12;
        torso.rotation.x = 0.3;
        armR.rotation.x = -0.2 + Math.sin(time * 8) * 0.25;
      }
    } else if (isMoving) {
      if (pelvis) pelvis.position.y = 0.55 + Math.abs(Math.sin(this.walkBob)) * 0.07;
      if (torso) {
        torso.rotation.x = 0.12;
        torso.rotation.z = Math.sin(this.walkBob) * 0.04;
      }
      if (legL && legR) {
        legL.rotation.x = -Math.sin(this.walkBob) * 0.65;
        legR.rotation.x = Math.sin(this.walkBob) * 0.65;
      }
      if (armL && armR) {
        armL.rotation.x = Math.sin(this.walkBob) * 0.55;
        armR.rotation.x = -Math.sin(this.walkBob) * 0.55;
      }
      if (head) {
        head.position.y = 0.52 + Math.sin(this.walkBob * 2) * 0.02;
      }
    } else {
      if (pelvis) pelvis.position.y = 0.55;
      if (torso) {
        torso.position.y = 0.24 + Math.sin(time * 2.4) * 0.015;
        torso.rotation.x = 0;
        torso.rotation.z = Math.sin(time * 1.2) * 0.02;
      }
      if (legL && legR) {
        legL.rotation.x = 0;
        legR.rotation.x = 0;
      }
      if (armL && armR) {
        armL.rotation.x = 0;
        armR.rotation.x = 0;
        armL.rotation.z = 0.08 + Math.sin(time * 2.4) * 0.04;
        armR.rotation.z = -0.08 - Math.sin(time * 2.4) * 0.04;
      }
      if (head) {
        head.rotation.z = Math.sin(time * 0.8) * 0.04;
      }
    }

    // 6. Living Animal Animations
    this.animalMeshes.forEach((mesh) => {
      const cowMuzzle = mesh.getObjectByName('cow_muzzle');
      const cowTail = mesh.getObjectByName('cow_tail');
      const cowHead = mesh.getObjectByName('cow_head');
      if (cowMuzzle) {
        cowMuzzle.position.x = Math.sin(time * 5.0) * 0.04;
      }
      if (cowTail) {
        cowTail.rotation.z = Math.sin(time * 3.5) * 0.35;
      }
      if (cowHead) {
        const graze = Math.sin(time * 0.6);
        cowHead.rotation.x = graze < -0.4 ? 0.35 : 0;
      }

      const wingL = mesh.getObjectByName('wingL');
      const wingR = mesh.getObjectByName('wingR');
      const henBody = mesh.getObjectByName('hen_body');
      if (wingL && wingR) {
        const flap = Math.sin(time * 12.0) * 0.45;
        wingL.rotation.z = -flap;
        wingR.rotation.z = flap;
      }
      if (henBody) {
        henBody.position.y = 0.28 + Math.abs(Math.sin(time * 6.0)) * 0.04;
      }
    });

    // 7. Update Active Particle FX
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.scale.multiplyScalar(0.97);

      if (p.life >= p.maxLife) {
        this.fxGroup.remove(p.mesh);
        this.activeParticles.splice(i, 1);
      }
    }

    // 8. Update Ambient Particles (Pollen / Fireflies / Petals)
    if (this.ambientParticles) {
      const posAttr = this.ambientParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      if (this.currentAmbientType === 'fireflies') {
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] += Math.sin(time * 1.5 + i) * dt * 0.4;
          arr[i + 1] += Math.cos(time * 2.0 + i) * dt * 0.3;
          arr[i + 2] += Math.cos(time * 1.2 + i) * dt * 0.4;
        }
      } else {
        // Drifting Petals / Pollen
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] += dt * 0.6 + Math.sin(time + i) * dt * 0.2;
          arr[i + 1] -= dt * 0.35;
          if (arr[i + 1] < 0.2) arr[i + 1] = 5.0;
          if (arr[i] > 40) arr[i] = -10;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 9. Drift Clouds
    this.cloudGroup.children.forEach((cloud) => {
      cloud.position.x += dt * 0.8;
      if (cloud.position.x > 70) cloud.position.x = -40;
    });

    // 10. Weather Falling
    if (this.weatherParticles) {
      const posAttr = this.weatherParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= dt * 18;
        if (arr[i] < 0) arr[i] = 24;
      }
      posAttr.needsUpdate = true;
    }

    // 11. Camera Follow
    this.updateCameraPosition(this.playerCurrentPos.x, this.playerCurrentPos.z);

    // 12. PS2 Post-Processed Frame Rendering!
    this.postProcessor.render(this.scene, this.camera, time);
  };

  // ─── POINTER & INTERACTION EVENTS ───
  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.postProcessor.resize(w, h);
  };

  private getPointerGridCoords(e: PointerEvent): { x: number; y: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
      return {
        x: Math.round(intersectPoint.x),
        y: Math.round(intersectPoint.z),
      };
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const coords = this.getPointerGridCoords(e);
    if (coords) {
      for (const [id, mesh] of this.animalMeshes.entries()) {
        const dist = Math.hypot(mesh.position.x - coords.x, mesh.position.z - coords.y);
        if (dist <= 1.1) {
          this.callbacks.onEntityClick('animal', id);
          break;
        }
      }
      this.callbacks.onTileClick(coords.x, coords.y);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const coords = this.getPointerGridCoords(e);
    if (coords) {
      this.cursorMesh.position.set(coords.x, 0.02, coords.y);
      this.cursorMesh.visible = true;
      this.callbacks.onTileHover(coords.x, coords.y);
    } else {
      this.cursorMesh.visible = false;
    }
  };

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.postProcessor.dispose();
    this.renderer.dispose();
  }
}
