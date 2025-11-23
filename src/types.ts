export interface Settings {
  // Animation settings
  repeats: number;
  size: number;
  radius: number;
  compSpeed: number;
  indSpeed: number;
  compDirection: 'cw' | 'ccw';
  indDirection: 'cw' | 'ccw';

  // Scale pulsation
  scaleToggle: boolean;
  scaleRate: number;
  scaleAmt: number;
  perItemScale: boolean;

  // Radial oscillation
  radialToggle: boolean;
  radialRate: number;
  radialAmt: number;
  perItemRadial: boolean;

  // Radial orientation
  radialOrientationEnabled: boolean;
  radialOrientationOffset: number;

  // Appearance
  bgColor: string;
  hueMode: boolean;
  hueSpeed: number;
  hueDriftSpeed: number;
  removeStroke: boolean;
  backgroundColorShift: boolean;
  backgroundColorShiftPreset: 'rainbow' | 'warm' | 'cool' | 'sunset' | 'ocean' | 'fire' | 'purpleHaze';
  backgroundColorShiftSpeed: number;
  blendMode: string;

  // Wave formation
  waveEnabled: boolean;
  waveFrequency: number;
  waveAmplitude: number;
  waveSpeed: number;
  perItemWave: boolean;

  // Audio
  audioReactive: boolean;
  audioSens: number;
  bassBoost: number;
  midBoost: number;
  trebBoost: number;
  audioModMax: number;

  // Filters
  filterEnabled: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
  invert: number;
  grayscale: number;
  hueRotate: number;
}

export interface Clone {
  el: HTMLElement | SVGSVGElement;
  ang: number;
  scale: number;
  radius: number;
}

export interface AnimationState {
  compAng: number;
  scaleAng: number;
  hueAng: number;
  radOscAng: number;
  bgShiftAng: number;
  waveAng: number;
  isPaused: boolean;
  lastFrameTime: number;
  accumulator: number;
}

export interface Example {
  file: string;
  label: string;
  preset?: Partial<Settings>;
  presetUrl?: string;
}
