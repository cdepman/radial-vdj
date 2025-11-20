import { Animator } from './animator';
import { Controls } from './controls';
import { loadSettings, saveSettings, loadSavedFile, saveSavedFile, clearSavedFile } from './storage';
import type { Settings } from './types';
import './styles/main.css';

class App {
  private animator: Animator;
  private controls: Controls;
  private settings: Settings;

  constructor() {
    // Load settings
    this.settings = loadSettings();

    // Initialize containers
    const animContainer = document.getElementById('animationContainer') as HTMLElement;
    const svgContainer = document.getElementById('svgContainer') as HTMLElement;
    const controlsContainer = document.getElementById('controls') as HTMLElement;

    if (!animContainer || !svgContainer || !controlsContainer) {
      throw new Error('Required containers not found');
    }

    // Initialize animator
    this.animator = new Animator(animContainer, svgContainer, this.settings);

    // Initialize controls
    this.controls = new Controls(controlsContainer, this.settings, {
      onChange: (settings) => this.handleSettingsChange(settings),
      onFileLoad: (file) => this.handleFileLoad(file),
      onExampleLoad: (filename, label, presetUrl) => this.handleExampleLoad(filename, label, presetUrl),
      onClear: () => this.handleClear(),
    });

    // Apply initial settings
    this.applySettings();

    // Load saved file or default example
    this.loadInitialAsset();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup play/pause button
    this.setupPlayPauseButton();

    // Setup toggle button
    this.setupToggleButton();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Toggle controls with 'H' key
      if (e.key === 'h' || e.key === 'H') {
        this.controls.toggle();
      }

      // Pause with spacebar
      if (e.key === ' ') {
        e.preventDefault();
        this.animator.togglePause();
        this.updatePlayPauseButton();
      }
    });
  }

  private setupPlayPauseButton(): void {
    const btn = document.getElementById('playPauseBtn');
    btn?.addEventListener('click', () => {
      this.animator.togglePause();
      this.updatePlayPauseButton();
    });
  }

  private updatePlayPauseButton(): void {
    const btn = document.getElementById('playPauseBtn');
    if (!btn) return;

    if (this.animator.isPaused) {
      btn.textContent = '▶';
      btn.classList.add('paused');
    } else {
      btn.textContent = '⏸';
      btn.classList.remove('paused');
    }
  }

  private setupToggleButton(): void {
    const btn = document.getElementById('toggleControls');
    btn?.addEventListener('click', () => {
      this.controls.toggle();
    });
  }

  private handleSettingsChange(settings: Settings): void {
    this.settings = settings;
    this.applySettings();
  }

  private applySettings(): void {
    // Update animator
    this.animator.updateSettings(this.settings);

    // Update background
    document.body.style.background = this.settings.bgColor;

    // Apply container filters
    const container = document.getElementById('animationContainer');
    if (container) {
      if (this.settings.filterEnabled) {
        const filters = [
          `brightness(${this.settings.brightness}%)`,
          `contrast(${this.settings.contrast}%)`,
          `saturate(${this.settings.saturation}%)`,
          `blur(${this.settings.blur}px)`,
        ].join(' ');
        container.style.filter = filters;
      } else {
        container.style.filter = '';
      }
    }

    // Handle audio
    if (this.settings.audioReactive) {
      this.animator.toggleAudio(true).then((success) => {
        if (!success) {
          alert('Microphone access denied. Audio reactivity disabled.');
          this.settings.audioReactive = false;
          saveSettings(this.settings);
        }
      });
    }
  }

  private async handleFileLoad(file: File): Promise<void> {
    try {
      // Read file to save it
      const reader = new FileReader();
      const ext = file.name.split('.').pop()?.toLowerCase();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && ext) {
          saveSavedFile(ext as 'svg' | 'png', result);
        }
      };

      if (ext === 'svg') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }

      await this.animator.loadFile(file);
      this.animator.start();
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Failed to load file. Please try a different file.');
    }
  }

  private async handleExampleLoad(filename: string, _label: string, presetUrl?: string): Promise<void> {
    // Load preset settings if provided
    if (presetUrl) {
      try {
        const response = await fetch(presetUrl);
        const presetSettings = await response.json();

        // Merge preset with current settings
        this.settings = { ...this.settings, ...presetSettings };

        // Update controls UI and apply settings
        this.controls.applySettings(this.settings);
      } catch (err) {
        console.error('Failed to load preset:', err);
      }
    }

    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'svg') {
      fetch(filename)
        .then((res) => res.text())
        .then((svgText) => {
          saveSavedFile('svg', svgText);
          this.animator.loadSVG(svgText);
          this.animator.start();
        })
        .catch((err) => {
          console.error('Failed to load example:', err);
        });
    } else if (ext === 'png') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        saveSavedFile('png', dataUrl);
        this.animator.loadImage(dataUrl);
      };
      img.src = filename;
    }
  }

  private handleClear(): void {
    this.animator.clear();
    clearSavedFile();
  }

  private loadInitialAsset(): void {
    const saved = loadSavedFile();

    if (saved) {
      if (saved.type === 'svg') {
        this.animator.loadSVG(saved.data);
      } else {
        this.animator.loadImage(saved.data);
      }
      this.animator.start();
    } else {
      // Load default example
      this.handleExampleLoad('/image_assets/takashi.svg', 'Takashi');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
