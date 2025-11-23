import type { Settings, Clone, AnimationState } from './types';
import { AudioAnalyzer } from './audio';

const FIXED_TIME_STEP = 1000 / 60; // 60 FPS

export class Animator {
  private container: HTMLElement;
  private svgContainer: HTMLElement;
  private sourceSvg: HTMLElement | SVGSVGElement | null = null;
  private clones: Clone[] = [];
  private vbW = 1;
  private vbH = 1;
  private animationFrameId: number | null = null;
  private audioAnalyzer: AudioAnalyzer;

  private state: AnimationState = {
    compAng: 0,
    scaleAng: 0,
    hueAng: 0,
    radOscAng: 0,
    bgShiftAng: 0,
    waveAng: 0,
    isPaused: false,
    lastFrameTime: 0,
    accumulator: 0,
  };

  constructor(
    container: HTMLElement,
    svgContainer: HTMLElement,
    private settings: Settings
  ) {
    this.container = container;
    this.svgContainer = svgContainer;
    this.audioAnalyzer = new AudioAnalyzer();
  }

  async loadFile(file: File): Promise<void> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (!result) {
          reject(new Error('Failed to read file'));
          return;
        }

        if (ext === 'svg') {
          this.loadSVG(result);
          resolve();
        } else if (ext === 'png') {
          this.loadImage(result);
          resolve();
        } else {
          reject(new Error('Unsupported file type'));
        }
      };

      if (ext === 'svg') {
        reader.readAsText(file);
      } else if (ext === 'png') {
        reader.readAsDataURL(file);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  }

  loadSVG(svgText: string): void {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      throw new Error('Invalid SVG');
    }

    this.svgContainer.innerHTML = '';
    this.svgContainer.appendChild(svg);
    this.sourceSvg = svg;

    const vb = svg.viewBox.baseVal;
    this.vbW = vb.width || svg.clientWidth;
    this.vbH = vb.height || svg.clientHeight;

    this.resetAngles();
    this.buildClones();
  }

  loadImage(dataUrl: string): void {
    const img = new Image();

    img.onload = () => {
      this.svgContainer.innerHTML = '';
      this.svgContainer.appendChild(img);
      this.sourceSvg = img;
      this.vbW = img.naturalWidth || img.width || 100;
      this.vbH = img.naturalHeight || img.height || 100;
      img.style.display = 'block';

      this.resetAngles();
      this.buildClones();
      this.start();
    };

    img.src = dataUrl;
  }

  private resetAngles(): void {
    this.state.compAng = 0;
    this.state.scaleAng = 0;
    this.state.hueAng = 0;
    this.state.radOscAng = 0;
    this.state.bgShiftAng = 0;
    this.state.waveAng = 0;
  }

  buildClones(): void {
    if (!this.sourceSvg) return;

    // Clear existing clones efficiently
    this.clones.forEach(clone => clone.el.remove());
    this.clones = [];

    const n = this.settings.repeats;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < n; i++) {
      const clone = this.sourceSvg.cloneNode(true) as HTMLElement;
      clone.removeAttribute('style');
      clone.style.display = 'block';
      clone.style.position = 'absolute';
      clone.style.willChange = 'transform'; // GPU acceleration hint
      clone.classList.add('monad');

      // Remove stroke if setting is enabled
      if (this.settings.removeStroke) {
        this.removeStrokeFromElement(clone);
      }

      // Apply blend mode
      clone.style.mixBlendMode = this.settings.blendMode;

      fragment.appendChild(clone);
      this.clones.push({ el: clone, ang: 0, scale: 1, radius: 0 });
    }

    this.container.appendChild(fragment);
  }

  private removeStrokeFromElement(element: HTMLElement): void {
    // Remove stroke from the element itself
    if (element instanceof SVGElement) {
      element.style.stroke = 'none';
      element.setAttribute('stroke', 'none');
      element.setAttribute('stroke-width', '0');
    }

    // Remove stroke from all child SVG elements
    const svgElements = element.querySelectorAll('*');
    svgElements.forEach((child) => {
      if (child instanceof SVGElement) {
        child.style.stroke = 'none';
        child.setAttribute('stroke', 'none');
        child.setAttribute('stroke-width', '0');
      }
    });
  }

  updateSettings(settings: Settings): void {
    const needsRebuild =
      this.clones.length !== settings.repeats ||
      this.settings.removeStroke !== settings.removeStroke ||
      this.settings.blendMode !== settings.blendMode;

    this.settings = settings;

    // Rebuild clones if repeat count, stroke, or blend mode changed
    if (needsRebuild && this.sourceSvg) {
      this.buildClones();
    }
  }

  async toggleAudio(enabled: boolean): Promise<boolean> {
    if (enabled && !this.audioAnalyzer.active) {
      return await this.audioAnalyzer.initialize();
    }
    return this.audioAnalyzer.active;
  }

  private animate = (timestamp: number): void => {
    if (this.state.isPaused) return;

    // Calculate frame delta
    const deltaTime = Math.min(timestamp - this.state.lastFrameTime, 32);
    this.state.lastFrameTime = timestamp;
    this.state.accumulator += deltaTime;

    // Fixed timestep updates for consistent physics
    while (this.state.accumulator >= FIXED_TIME_STEP) {
      this.update();
      this.state.accumulator -= FIXED_TIME_STEP;
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private update(): void {
    const s = this.settings;

    // Update angles
    const compSpd = s.compSpeed * (s.compDirection === 'ccw' ? -1 : 1);
    const indSpd = s.indSpeed * (s.indDirection === 'ccw' ? -1 : 1);

    this.state.compAng += compSpd;
    this.state.scaleAng += s.scaleRate;
    this.state.radOscAng += s.radialRate;

    if (s.hueMode) {
      this.state.hueAng = (this.state.hueAng + s.hueDriftSpeed) % 360;
    }

    if (s.backgroundColorShift) {
      this.state.bgShiftAng = (this.state.bgShiftAng + s.backgroundColorShiftSpeed) % 360;
    }

    if (s.waveEnabled) {
      this.state.waveAng += s.waveSpeed;
    }

    // Update individual clone angles
    this.clones.forEach(clone => {
      clone.ang += indSpd;
    });
  }

  private render(): void {
    const s = this.settings;
    const n = this.clones.length;
    const step = (Math.PI * 2) / n;
    const cx = this.container.clientWidth / 2;
    const cy = this.container.clientHeight / 2;

    // Get audio level if enabled
    let audioLevel = 0;
    if (s.audioReactive && this.audioAnalyzer.active) {
      audioLevel = this.audioAnalyzer.getAudioLevel(
        s.bassBoost,
        s.midBoost,
        s.trebBoost,
        s.audioSens
      );
    }

    // Golden angle for better distribution
    const goldenAngle = 2.399963229728653;

    // Batch DOM updates
    this.clones.forEach((clone, i) => {
      // Calculate radius with oscillation and audio
      let rad = s.radius + audioLevel * s.audioModMax;

      if (s.radialToggle) {
        if (s.perItemRadial) {
          rad += s.radialAmt * Math.sin(this.state.radOscAng + i * goldenAngle);
        } else {
          rad += s.radialAmt * Math.sin(this.state.radOscAng);
        }
      }

      // Calculate position
      const ang = i * step + this.state.compAng;
      let x = cx + rad * Math.cos(ang);
      let y = cy + rad * Math.sin(ang);

      // Apply wave formation (perpendicular to radius)
      if (s.waveEnabled) {
        // Calculate wave offset
        let wavePhase = this.state.waveAng + i * s.waveFrequency * step;
        if (s.perItemWave) {
          wavePhase += i * goldenAngle;
        }
        const waveOffset = s.waveAmplitude * Math.sin(wavePhase);

        // Apply offset perpendicular to radius (tangent direction)
        const tangentAng = ang + Math.PI / 2;
        x += waveOffset * Math.cos(tangentAng);
        y += waveOffset * Math.sin(tangentAng);
      }

      // Calculate scale
      let scale = 1;
      if (s.scaleToggle) {
        if (s.perItemScale) {
          scale = 1 + s.scaleAmt * Math.sin(this.state.scaleAng + i * step);
        } else {
          scale = 1 + s.scaleAmt * Math.sin(this.state.scaleAng);
        }
      }

      const wpx = s.size * scale;
      const hpx = s.size * scale * (this.vbH / this.vbW);

      // Use transform for better performance (GPU accelerated)
      const translateX = x - wpx / 2;
      const translateY = y - hpx / 2;

      // Calculate final rotation with radial orientation if enabled
      let finalRotation = clone.ang; // base spin rotation
      if (s.radialOrientationEnabled) {
        // Add position angle and user offset for radial orientation
        finalRotation = clone.ang + ang + s.radialOrientationOffset;
      }

      clone.el.style.width = `${wpx}px`;
      clone.el.style.height = `${hpx}px`;
      clone.el.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${finalRotation}rad)`;

      // Apply hue rotation if enabled
      if (s.hueMode) {
        const shift = (this.state.hueAng + i * (360 / n)) % 360;
        let brightness = 1;
        let saturation = 1;

        if (s.scaleToggle) {
          const t = s.perItemScale
            ? (Math.sin(this.state.scaleAng + i * step) + 1) / 2
            : (Math.sin(this.state.scaleAng) + 1) / 2;
          brightness = 0.75 + 0.25 * t;
          saturation = 0.75 + 0.5 * t;
        }

        clone.el.style.filter = `brightness(${brightness}) saturate(${saturation}) hue-rotate(${shift}deg)`;
      } else {
        clone.el.style.filter = '';
      }
    });
  }

  start(): void {
    if (this.animationFrameId !== null) return;

    this.state.isPaused = false;
    this.state.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  pause(): void {
    this.state.isPaused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.state.lastFrameTime = performance.now();
      this.state.accumulator = 0;
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  }

  togglePause(): void {
    if (this.state.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  clear(): void {
    this.pause();
    this.clones.forEach(clone => clone.el.remove());
    this.clones = [];
    this.sourceSvg = null;
    this.svgContainer.innerHTML = '';
  }

  get isPaused(): boolean {
    return this.state.isPaused;
  }

  getCurrentBackgroundColor(): string {
    if (!this.settings.backgroundColorShift) {
      return this.settings.bgColor;
    }

    return this.getColorFromPreset(
      this.settings.backgroundColorShiftPreset,
      this.state.bgShiftAng
    );
  }

  private getColorFromPreset(preset: string, angle: number): string {
    const hslToHex = (h: number, s: number, l: number): string => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const t = angle / 360; // Normalized 0-1

    switch (preset) {
      case 'rainbow':
        return hslToHex(angle, 70, 20);

      case 'warm':
        // Cycle through warm colors: red to orange to yellow
        const warmHue = 0 + t * 60; // 0° (red) to 60° (yellow)
        return hslToHex(warmHue, 80, 25);

      case 'cool':
        // Cycle through cool colors: blue to cyan to purple
        const coolHue = 180 + t * 120; // 180° (cyan) to 300° (purple)
        return hslToHex(coolHue, 70, 20);

      case 'sunset':
        // Transition from orange to purple
        const sunsetHue = 20 + t * 260; // 20° (orange) to 280° (purple)
        return hslToHex(sunsetHue, 75, 22);

      case 'ocean':
        // Cycle through ocean colors: blue to teal to deep blue
        const oceanHue = 180 + Math.sin(t * Math.PI * 2) * 30;
        return hslToHex(oceanHue, 65, 18);

      case 'fire':
        // Cycle through fire colors: deep red to orange to yellow
        const fireHue = 0 + Math.sin(t * Math.PI) * 40;
        const fireLightness = 20 + Math.sin(t * Math.PI) * 10;
        return hslToHex(fireHue, 85, fireLightness);

      case 'purpleHaze':
        // Cycle through purples and pinks
        const purpleHue = 270 + t * 60; // 270° (purple) to 330° (magenta)
        return hslToHex(purpleHue, 70, 20);

      default:
        return this.settings.bgColor;
    }
  }
}
