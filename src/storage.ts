import type { Settings } from './types';

const SETTINGS_KEY = 'radialAnimatorSettings';
const FILE_TYPE_KEY = 'savedFileType';
const FILE_DATA_KEY = 'savedFileData';

export const DEFAULT_SETTINGS: Settings = {
  repeats: 25,
  size: 151,
  radius: 156,
  compSpeed: 0.015,
  indSpeed: 0.013,
  compDirection: 'ccw',
  indDirection: 'ccw',
  scaleRate: 0.005,
  scaleAmt: 0.65,
  perItemScale: true,
  scaleToggle: true,
  radialRate: 0.004,
  radialAmt: 96,
  radialToggle: true,
  perItemRadial: false,
  radialOrientationEnabled: false,
  radialOrientationOffset: 0,
  bgColor: '#111111',
  hueMode: true,
  hueSpeed: 0.5,
  hueDriftSpeed: 0.1,
  removeStroke: false,
  backgroundColorShift: false,
  backgroundColorShiftPreset: 'rainbow',
  backgroundColorShiftSpeed: 0.5,
  audioSens: 1,
  bassBoost: 1,
  midBoost: 1,
  trebBoost: 1,
  audioModMax: 100,
  audioReactive: false,
  filterEnabled: true,
  brightness: 110,
  contrast: 120,
  saturation: 130,
  blur: 0.5,
  sepia: 15,
  invert: 0,
  grayscale: 0,
  hueRotate: 45,
};

export function loadSettings(): Settings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Failed to parse saved settings', e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function saveSavedFile(type: 'svg' | 'png', data: string): void {
  localStorage.setItem(FILE_TYPE_KEY, type);
  localStorage.setItem(FILE_DATA_KEY, data);
}

export function loadSavedFile(): { type: 'svg' | 'png'; data: string } | null {
  const type = localStorage.getItem(FILE_TYPE_KEY) as 'svg' | 'png' | null;
  const data = localStorage.getItem(FILE_DATA_KEY);

  if (!type || !data) return null;
  return { type, data };
}

export function clearSavedFile(): void {
  localStorage.removeItem(FILE_TYPE_KEY);
  localStorage.removeItem(FILE_DATA_KEY);
}
