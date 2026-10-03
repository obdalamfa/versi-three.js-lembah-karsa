// PS2 Graphics Synthesizer (GS) Post-Processing Pipeline
// Recreates the authentic visual aesthetic of PlayStation 2 golden-era classics:
// - Harvest Moon: A Wonderful Life / Save the Homeland (dreamy bloom & golden haze)
// - Dragon Quest VIII / Dark Cloud 2 (warm vibrant cel shading & soft analog display)
// - ICO / Shadow of the Colossus (overbright diffuse glow & atmospheric depth)
// - 480p CRT Scanlines, Bayer Dither Matrix, & 16/24-bit Framebuffer Emulation

import * as THREE from 'three';
import { PS2VisualSettings } from '../types/game';

const PS2_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const PS2_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform int uPs2Enabled;
  uniform int uBloomGlow;
  uniform int uCrtScanlines;
  uniform int uGsDither;
  uniform int uVignette;
  uniform float uColorWarmth;

  varying vec2 vUv;

  // 4x4 Bayer Matrix for authentic PlayStation 2 Graphics Synthesizer 16-bit dither
  float bayer4x4(vec2 coord) {
    int x = int(mod(coord.x, 4.0));
    int y = int(mod(coord.y, 4.0));
    int index = x + y * 4;
    
    // Bayer pattern values normalized between 0.0 and 1.0
    if (index == 0) return 0.0 / 16.0;
    if (index == 1) return 8.0 / 16.0;
    if (index == 2) return 2.0 / 16.0;
    if (index == 3) return 10.0 / 16.0;
    if (index == 4) return 12.0 / 16.0;
    if (index == 5) return 4.0 / 16.0;
    if (index == 6) return 14.0 / 16.0;
    if (index == 7) return 6.0 / 16.0;
    if (index == 8) return 3.0 / 16.0;
    if (index == 9) return 11.0 / 16.0;
    if (index == 10) return 1.0 / 16.0;
    if (index == 11) return 9.0 / 16.0;
    if (index == 12) return 15.0 / 16.0;
    if (index == 13) return 7.0 / 16.0;
    if (index == 14) return 13.0 / 16.0;
    return 5.0 / 16.0;
  }

  void main() {
    vec2 uv = vUv;
    vec2 screenCoord = gl_FragCoord.xy;

    // If PS2 mode is completely disabled, pass through raw render
    if (uPs2Enabled == 0) {
      gl_FragColor = texture2D(tDiffuse, uv);
      return;
    }

    vec4 baseColor = texture2D(tDiffuse, uv);
    vec3 color = baseColor.rgb;

    // 1. PS2 Dreamy Diffuse Bloom & Soft Glare (Harvest Moon AWL / ICO / DQVIII)
    if (uBloomGlow == 1) {
      vec2 texel = 1.0 / uResolution;
      vec3 bloom = vec3(0.0);
      float totalWeight = 0.0;

      // 9-tap cross & diagonal blur sampling
      vec2 offsets[8];
      offsets[0] = vec2( 1.5,  0.0) * texel;
      offsets[1] = vec2(-1.5,  0.0) * texel;
      offsets[2] = vec2( 0.0,  1.5) * texel;
      offsets[3] = vec2( 0.0, -1.5) * texel;
      offsets[4] = vec2( 1.2,  1.2) * texel;
      offsets[5] = vec2(-1.2,  1.2) * texel;
      offsets[6] = vec2( 1.2, -1.2) * texel;
      offsets[7] = vec2(-1.2, -1.2) * texel;

      for (int i = 0; i < 8; i++) {
        vec3 s = texture2D(tDiffuse, uv + offsets[i]).rgb;
        // Threshold check: bright tones contribute to nostalgic bloom
        float luma = dot(s, vec3(0.299, 0.587, 0.114));
        float bright = max(0.0, luma - 0.42) * 1.6;
        bloom += s * bright;
        totalWeight += 1.0;
      }
      bloom /= totalWeight;

      // Composite warm golden bloom over base color
      color += bloom * (0.42 * uColorWarmth);
    }

    // 2. PS2 Warm Color Grading (Golden hour, pastoral richness)
    if (uColorWarmth > 0.01) {
      // Warm tint: boost red/amber in highlights, rich cyan/deep blue in shadows
      vec3 warmTint = vec3(1.06, 1.02, 0.94);
      color *= warmTint;
      // Slight contrast curve typical of CRT analog composite video
      color = pow(color, vec3(0.96));
    }

    // 3. PS2 GS Bayer Dithering (Simulates 16-bit/24-bit eDRAM quantization)
    if (uGsDither == 1) {
      float bayer = bayer4x4(screenCoord) - 0.5;
      // Add subtle dither noise before quantization
      color += (bayer / 48.0);
      // Quantize to ~36 color levels per channel
      color = floor(color * 36.0 + 0.5) / 36.0;
    }

    // 4. CRT 480i / 480p Scanlines & Phosphor Mask
    if (uCrtScanlines == 1) {
      // Horizontal scanline modulation (thin dark lines between pixel rows)
      float scanline = sin(uv.y * uResolution.y * 3.14159) * 0.5 + 0.5;
      float scanlineFactor = mix(0.88, 1.0, scanline);
      color *= scanlineFactor;

      // Subtle RGB phosphor subpixel striping
      float pixelMod = mod(screenCoord.x, 3.0);
      vec3 phosphor = vec3(1.0);
      if (pixelMod < 1.0) {
        phosphor = vec3(1.03, 0.98, 0.98);
      } else if (pixelMod < 2.0) {
        phosphor = vec3(0.98, 1.03, 0.98);
      } else {
        phosphor = vec3(0.98, 0.98, 1.04);
      }
      color = mix(color, color * phosphor, 0.35);
    }

    // 5. Analog TV Tube Vignette & Slight Edge Glow
    if (uVignette == 1) {
      vec2 distFromCenter = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
      float dist = length(distFromCenter);
      float vig = smoothstep(0.95, 0.35, dist);
      color *= mix(0.78, 1.0, vig);
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), baseColor.a);
  }
`;

export class PS2PostProcessor {
  private renderer: THREE.WebGLRenderer;
  private renderTarget: THREE.WebGLRenderTarget;
  private quadScene: THREE.Scene;
  private quadCamera: THREE.OrthographicCamera;
  private quadMaterial: THREE.ShaderMaterial;
  private quadMesh: THREE.Mesh;
  private width: number;
  private height: number;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;

    // High quality render target for 3D pass
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // Screen-space Quad
    this.quadScene = new THREE.Scene();
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.quadMaterial = new THREE.ShaderMaterial({
      vertexShader: PS2_VERTEX_SHADER,
      fragmentShader: PS2_FRAGMENT_SHADER,
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0.0 },
        uPs2Enabled: { value: 1 },
        uBloomGlow: { value: 1 },
        uCrtScanlines: { value: 1 },
        uGsDither: { value: 1 },
        uVignette: { value: 1 },
        uColorWarmth: { value: 0.8 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.quadMaterial);
    this.quadScene.add(this.quadMesh);
  }

  public updateSettings(settings?: PS2VisualSettings) {
    if (!settings) return;
    this.quadMaterial.uniforms.uPs2Enabled.value = settings.enabled ? 1 : 0;
    this.quadMaterial.uniforms.uBloomGlow.value = settings.bloomGlow ? 1 : 0;
    this.quadMaterial.uniforms.uCrtScanlines.value = settings.crtScanlines ? 1 : 0;
    this.quadMaterial.uniforms.uGsDither.value = settings.gsDither ? 1 : 0;
    this.quadMaterial.uniforms.uVignette.value = settings.vignette ? 1 : 0;
    this.quadMaterial.uniforms.uColorWarmth.value = settings.colorWarmth ?? 0.8;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderTarget.setSize(width, height);
    this.quadMaterial.uniforms.uResolution.value.set(width, height);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera, time: number) {
    this.quadMaterial.uniforms.uTime.value = time;

    // 1. Render 3D Scene into RenderTarget
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);

    // 2. Render Fullscreen PS2 Post-Processed Quad to Screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  public dispose() {
    this.renderTarget.dispose();
    this.quadMaterial.dispose();
    this.quadMesh.geometry.dispose();
  }
}
