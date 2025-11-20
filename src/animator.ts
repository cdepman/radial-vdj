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

      fragment.appendChild(clone);
      this.clones.push({ el: clone, ang: 0, scale: 1, radius: 0 });
    }

    this.container.appendChild(fragment);
  }

  updateSettings(settings: Settings): void {
    this.settings = settings;

    // Rebuild clones if repeat count changed
    if (this.clones.length !== settings.repeats && this.sourceSvg) {
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
      const x = cx + rad * Math.cos(ang);
      const y = cy + rad * Math.sin(ang);

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

      clone.el.style.width = `${wpx}px`;
      clone.el.style.height = `${hpx}px`;
      clone.el.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${clone.ang}rad)`;

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
}
