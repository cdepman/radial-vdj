import type { Settings, Example } from './types';
import { DEFAULT_SETTINGS, saveSettings } from './storage';

export class Controls {
  private container: HTMLElement;
  private settings: Settings;
  private onChange: (settings: Settings) => void;
  private onFileLoad: (file: File) => void;
  private onExampleLoad: (filename: string, label: string) => void;
  private onClear: () => void;
  private isVisible = false;

  constructor(
    container: HTMLElement,
    initialSettings: Settings,
    callbacks: {
      onChange: (settings: Settings) => void;
      onFileLoad: (file: File) => void;
      onExampleLoad: (filename: string, label: string) => void;
      onClear: () => void;
    }
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.onChange = callbacks.onChange;
    this.onFileLoad = callbacks.onFileLoad;
    this.onExampleLoad = callbacks.onExampleLoad;
    this.onClear = callbacks.onClear;

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="control-sidebar" id="controlSidebar">
        <div class="control-header">
          <h2>Controls</h2>
          <button class="close-btn" id="closeControls">×</button>
        </div>

        <div class="control-content">
          <!-- File Upload Section -->
          <section class="control-section">
            <h3>📁 Load Asset</h3>
            <div class="file-upload-area" id="dropZone">
              <input type="file" id="fileInput" accept=".svg,.png" />
              <div class="upload-prompt" id="uploadPrompt">
                <p>Drop file here or click to browse</p>
                <small>SVG or PNG</small>
              </div>
              <div class="file-info" id="fileInfo" style="display:none;">
                <p id="fileName"></p>
                <button class="btn-secondary" id="clearFile">Clear</button>
              </div>
            </div>

            <div class="examples">
              <h4>Examples</h4>
              <div class="example-grid" id="exampleGrid"></div>
            </div>
          </section>

          <!-- Animation Controls -->
          <section class="control-section">
            <h3>🎛️ Animation</h3>

            <div class="control-group">
              <label>Repeats: <span id="repeats-value">${this.settings.repeats}</span></label>
              <input type="range" id="repeats" min="1" max="128" step="1" value="${this.settings.repeats}" />
            </div>

            <div class="control-group">
              <label>Size: <span id="size-value">${this.settings.size}px</span></label>
              <input type="range" id="size" min="10" max="500" value="${this.settings.size}" />
            </div>

            <div class="control-group">
              <label>Radius: <span id="radius-value">${this.settings.radius}px</span></label>
              <input type="range" id="radius" min="0" max="500" value="${this.settings.radius}" />
            </div>

            <div class="control-group">
              <label>Composite Rotation</label>
              <div class="radio-group">
                <label><input type="radio" name="compDir" value="ccw" ${this.settings.compDirection === 'ccw' ? 'checked' : ''} /> CCW</label>
                <label><input type="radio" name="compDir" value="cw" ${this.settings.compDirection === 'cw' ? 'checked' : ''} /> CW</label>
              </div>
              <input type="range" id="compSpeed" min="0" max="0.1" step="0.001" value="${this.settings.compSpeed}" />
              <span id="compSpeed-value">${this.settings.compSpeed.toFixed(3)}</span>
            </div>

            <div class="control-group">
              <label>Individual Spin</label>
              <div class="radio-group">
                <label><input type="radio" name="indDir" value="ccw" ${this.settings.indDirection === 'ccw' ? 'checked' : ''} /> CCW</label>
                <label><input type="radio" name="indDir" value="cw" ${this.settings.indDirection === 'cw' ? 'checked' : ''} /> CW</label>
              </div>
              <input type="range" id="indSpeed" min="0" max="0.2" step="0.001" value="${this.settings.indSpeed}" />
              <span id="indSpeed-value">${this.settings.indSpeed.toFixed(3)}</span>
            </div>
          </section>

          <!-- Component Radial Orientation -->
          <section class="control-section">
            <h3>🧭 Component Radial Orientation</h3>
            <label class="checkbox-label">
              <input type="checkbox" id="radialOrientationEnabled" ${this.settings.radialOrientationEnabled ? 'checked' : ''} />
              Enable Radial Orientation
            </label>

            <div class="control-group">
              <label>Orientation Angle: <span id="radialOrientationOffset-value">${Math.round((this.settings.radialOrientationOffset * 180) / Math.PI)}°</span></label>
              <input type="range" id="radialOrientationOffset" min="${-Math.PI}" max="${Math.PI}" step="0.01" value="${this.settings.radialOrientationOffset}" />
            </div>

            <div class="preset-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
              <button class="preset-btn" data-angle="0" style="padding: 8px; border: 1px solid #0f0; background: rgba(0,255,0,0.1); color: #0f0; border-radius: 4px; cursor: pointer; font-size: 11px;">Point Outward</button>
              <button class="preset-btn" data-angle="${Math.PI}" style="padding: 8px; border: 1px solid #0f0; background: rgba(0,255,0,0.1); color: #0f0; border-radius: 4px; cursor: pointer; font-size: 11px;">Point Inward</button>
              <button class="preset-btn" data-angle="${Math.PI / 2}" style="padding: 8px; border: 1px solid #0f0; background: rgba(0,255,0,0.1); color: #0f0; border-radius: 4px; cursor: pointer; font-size: 11px;">Tangent CW</button>
              <button class="preset-btn" data-angle="${-Math.PI / 2}" style="padding: 8px; border: 1px solid #0f0; background: rgba(0,255,0,0.1); color: #0f0; border-radius: 4px; cursor: pointer; font-size: 11px;">Tangent CCW</button>
            </div>
          </section>

          <!-- Scale Pulsation -->
          <section class="control-section">
            <h3>📏 Scale Pulsation</h3>
            <label class="checkbox-label">
              <input type="checkbox" id="scaleToggle" ${this.settings.scaleToggle ? 'checked' : ''} />
              Enable Scale Pulsation
            </label>

            <div class="control-group">
              <label>Rate: <span id="scaleRate-value">${this.settings.scaleRate.toFixed(3)}</span></label>
              <input type="range" id="scaleRate" min="0" max="0.2" step="0.001" value="${this.settings.scaleRate}" />
            </div>

            <div class="control-group">
              <label>Amount: <span id="scaleAmt-value">${this.settings.scaleAmt.toFixed(2)}</span></label>
              <input type="range" id="scaleAmt" min="0" max="1" step="0.01" value="${this.settings.scaleAmt}" />
            </div>

            <label class="checkbox-label">
              <input type="checkbox" id="perItemScale" ${this.settings.perItemScale ? 'checked' : ''} />
              Individual Variation
            </label>
          </section>

          <!-- Radial Oscillation -->
          <section class="control-section">
            <h3>🌀 Radial Oscillation</h3>
            <label class="checkbox-label">
              <input type="checkbox" id="radialToggle" ${this.settings.radialToggle ? 'checked' : ''} />
              Enable Radial Oscillation
            </label>

            <div class="control-group">
              <label>Rate: <span id="radialRate-value">${this.settings.radialRate.toFixed(3)}</span></label>
              <input type="range" id="radialRate" min="0" max="0.2" step="0.001" value="${this.settings.radialRate}" />
            </div>

            <div class="control-group">
              <label>Amount: <span id="radialAmt-value">${this.settings.radialAmt}px</span></label>
              <input type="range" id="radialAmt" min="0" max="200" step="1" value="${this.settings.radialAmt}" />
            </div>

            <label class="checkbox-label">
              <input type="checkbox" id="perItemRadial" ${this.settings.perItemRadial ? 'checked' : ''} />
              Individual Variation
            </label>
          </section>

          <!-- Appearance -->
          <section class="control-section">
            <h3>🎨 Appearance</h3>

            <div class="control-group">
              <label>Background</label>
              <input type="color" id="bgColor" value="${this.settings.bgColor}" />
            </div>

            <label class="checkbox-label">
              <input type="checkbox" id="hueMode" ${this.settings.hueMode ? 'checked' : ''} />
              Hue Rotation
            </label>

            <div class="control-group">
              <label>Hue Drift: <span id="hueDriftSpeed-value">${this.settings.hueDriftSpeed.toFixed(2)}</span></label>
              <input type="range" id="hueDriftSpeed" min="-2" max="2" step="0.01" value="${this.settings.hueDriftSpeed}" />
            </div>
          </section>

          <!-- Filters -->
          <section class="control-section">
            <h3>✨ Filters</h3>
            <label class="checkbox-label">
              <input type="checkbox" id="filterEnabled" ${this.settings.filterEnabled ? 'checked' : ''} />
              Enable Filters
            </label>

            <div class="control-group">
              <label>Brightness: <span id="brightness-value">${this.settings.brightness}%</span></label>
              <input type="range" id="brightness" min="0" max="200" value="${this.settings.brightness}" />
            </div>

            <div class="control-group">
              <label>Contrast: <span id="contrast-value">${this.settings.contrast}%</span></label>
              <input type="range" id="contrast" min="0" max="200" value="${this.settings.contrast}" />
            </div>

            <div class="control-group">
              <label>Saturation: <span id="saturation-value">${this.settings.saturation}%</span></label>
              <input type="range" id="saturation" min="0" max="200" value="${this.settings.saturation}" />
            </div>

            <div class="control-group">
              <label>Blur: <span id="blur-value">${this.settings.blur}px</span></label>
              <input type="range" id="blur" min="0" max="10" step="0.1" value="${this.settings.blur}" />
            </div>
          </section>

          <!-- Audio -->
          <section class="control-section">
            <h3>🎧 Audio Reactive</h3>
            <label class="checkbox-label">
              <input type="checkbox" id="audioReactive" ${this.settings.audioReactive ? 'checked' : ''} />
              Enable Audio Reactivity
            </label>

            <div class="control-group">
              <label>Sensitivity: <span id="audioSens-value">${this.settings.audioSens.toFixed(1)}</span></label>
              <input type="range" id="audioSens" min="0" max="5" step="0.1" value="${this.settings.audioSens}" />
            </div>

            <div class="control-group">
              <label>Bass Boost: <span id="bassBoost-value">${this.settings.bassBoost.toFixed(1)}</span></label>
              <input type="range" id="bassBoost" min="0" max="5" step="0.1" value="${this.settings.bassBoost}" />
            </div>

            <div class="control-group">
              <label>Mid Boost: <span id="midBoost-value">${this.settings.midBoost.toFixed(1)}</span></label>
              <input type="range" id="midBoost" min="0" max="5" step="0.1" value="${this.settings.midBoost}" />
            </div>

            <div class="control-group">
              <label>Treble Boost: <span id="trebBoost-value">${this.settings.trebBoost.toFixed(1)}</span></label>
              <input type="range" id="trebBoost" min="0" max="5" step="0.1" value="${this.settings.trebBoost}" />
            </div>

            <div class="control-group">
              <label>Max Radius Mod: <span id="audioModMax-value">${this.settings.audioModMax}px</span></label>
              <input type="range" id="audioModMax" min="0" max="500" step="10" value="${this.settings.audioModMax}" />
            </div>
          </section>

          <!-- Reset Buttons -->
          <section class="control-section">
            <button class="btn-primary" id="resetAll">Reset All Settings</button>
          </section>
        </div>
      </div>
    `;

    this.renderExamples();
  }

  private renderExamples(): void {
    const examples: Example[] = [
      { file: '/image_assets/blue-dragon.svg', label: 'Blue Dragon' },
      { file: '/image_assets/takashi.svg', label: 'Takashi' },
      { file: '/image_assets/rubber-duck.png', label: 'Rubber Duck' },
      { file: '/image_assets/instrument.svg', label: 'Instrument' },
    ];

    const grid = this.container.querySelector('#exampleGrid');
    if (!grid) return;

    grid.innerHTML = examples
      .map(
        (ex) => `
        <button class="example-btn" data-file="${ex.file}" data-label="${ex.label}">
          ${ex.label}
        </button>
      `
      )
      .join('');
  }

  private attachEventListeners(): void {
    // File upload
    const fileInput = this.container.querySelector('#fileInput') as HTMLInputElement;
    const dropZone = this.container.querySelector('#dropZone') as HTMLElement;

    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.onFileLoad(file);
        this.updateFileInfo(file.name);
      }
    });

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file) {
        this.onFileLoad(file);
        this.updateFileInfo(file.name);
      }
    });

    // Clear file
    this.container.querySelector('#clearFile')?.addEventListener('click', () => {
      this.onClear();
      this.clearFileInfo();
    });

    // Examples
    this.container.querySelectorAll('.example-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const file = btn.getAttribute('data-file');
        const label = btn.getAttribute('data-label');
        if (file && label) {
          this.onExampleLoad(file, label);
          this.updateFileInfo(label);
        }
      });
    });

    // All inputs
    const inputs = this.container.querySelectorAll<HTMLInputElement>(
      'input[type="range"], input[type="number"], input[type="checkbox"], input[type="color"], input[type="radio"]'
    );

    inputs.forEach((input) => {
      input.addEventListener('input', () => this.updateFromInputs());
      input.addEventListener('change', () => this.updateFromInputs());
    });

    // Preset buttons for radial orientation
    this.container.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const angle = parseFloat(btn.getAttribute('data-angle') || '0');
        const slider = this.container.querySelector('#radialOrientationOffset') as HTMLInputElement;
        if (slider) {
          slider.value = angle.toString();
          this.updateFromInputs();
        }
      });
    });

    // Close button
    this.container.querySelector('#closeControls')?.addEventListener('click', () => {
      this.hide();
    });

    // Reset button
    this.container.querySelector('#resetAll')?.addEventListener('click', () => {
      this.reset();
    });
  }

  private updateFromInputs(): void {
    const getValue = (id: string): string => {
      const el = this.container.querySelector(`#${id}`) as HTMLInputElement;
      return el?.value || '';
    };

    const getChecked = (id: string): boolean => {
      const el = this.container.querySelector(`#${id}`) as HTMLInputElement;
      return el?.checked || false;
    };

    const getRadio = (name: string): string => {
      const el = this.container.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement;
      return el?.value || '';
    };

    this.settings = {
      repeats: parseInt(getValue('repeats')),
      size: parseInt(getValue('size')),
      radius: parseInt(getValue('radius')),
      compSpeed: parseFloat(getValue('compSpeed')),
      indSpeed: parseFloat(getValue('indSpeed')),
      compDirection: getRadio('compDir') as 'cw' | 'ccw',
      indDirection: getRadio('indDir') as 'cw' | 'ccw',
      scaleToggle: getChecked('scaleToggle'),
      scaleRate: parseFloat(getValue('scaleRate')),
      scaleAmt: parseFloat(getValue('scaleAmt')),
      perItemScale: getChecked('perItemScale'),
      radialToggle: getChecked('radialToggle'),
      radialRate: parseFloat(getValue('radialRate')),
      radialAmt: parseInt(getValue('radialAmt')),
      perItemRadial: getChecked('perItemRadial'),
      radialOrientationEnabled: getChecked('radialOrientationEnabled'),
      radialOrientationOffset: parseFloat(getValue('radialOrientationOffset')),
      bgColor: getValue('bgColor'),
      hueMode: getChecked('hueMode'),
      hueSpeed: 0.5,
      hueDriftSpeed: parseFloat(getValue('hueDriftSpeed')),
      audioReactive: getChecked('audioReactive'),
      audioSens: parseFloat(getValue('audioSens')),
      bassBoost: parseFloat(getValue('bassBoost')),
      midBoost: parseFloat(getValue('midBoost')),
      trebBoost: parseFloat(getValue('trebBoost')),
      audioModMax: parseInt(getValue('audioModMax')),
      filterEnabled: getChecked('filterEnabled'),
      brightness: parseInt(getValue('brightness')),
      contrast: parseInt(getValue('contrast')),
      saturation: parseInt(getValue('saturation')),
      blur: parseFloat(getValue('blur')),
      sepia: 0,
      invert: 0,
      grayscale: 0,
      hueRotate: 0,
    };

    this.updateValueDisplays();
    this.onChange(this.settings);
    saveSettings(this.settings);
  }

  private updateValueDisplays(): void {
    const updates: Record<string, string> = {
      'repeats-value': this.settings.repeats.toString(),
      'size-value': `${this.settings.size}px`,
      'radius-value': `${this.settings.radius}px`,
      'compSpeed-value': this.settings.compSpeed.toFixed(3),
      'indSpeed-value': this.settings.indSpeed.toFixed(3),
      'scaleRate-value': this.settings.scaleRate.toFixed(3),
      'scaleAmt-value': this.settings.scaleAmt.toFixed(2),
      'radialRate-value': this.settings.radialRate.toFixed(3),
      'radialAmt-value': `${this.settings.radialAmt}px`,
      'radialOrientationOffset-value': `${Math.round((this.settings.radialOrientationOffset * 180) / Math.PI)}°`,
      'hueDriftSpeed-value': this.settings.hueDriftSpeed.toFixed(2),
      'audioSens-value': this.settings.audioSens.toFixed(1),
      'bassBoost-value': this.settings.bassBoost.toFixed(1),
      'midBoost-value': this.settings.midBoost.toFixed(1),
      'trebBoost-value': this.settings.trebBoost.toFixed(1),
      'audioModMax-value': `${this.settings.audioModMax}px`,
      'brightness-value': `${this.settings.brightness}%`,
      'contrast-value': `${this.settings.contrast}%`,
      'saturation-value': `${this.settings.saturation}%`,
      'blur-value': `${this.settings.blur}px`,
    };

    Object.entries(updates).forEach(([id, value]) => {
      const el = this.container.querySelector(`#${id}`);
      if (el) el.textContent = value;
    });
  }

  private updateFileInfo(filename: string): void {
    const uploadPrompt = this.container.querySelector('#uploadPrompt') as HTMLElement;
    const fileInfo = this.container.querySelector('#fileInfo') as HTMLElement;
    const fileName = this.container.querySelector('#fileName') as HTMLElement;

    if (uploadPrompt && fileInfo && fileName) {
      uploadPrompt.style.display = 'none';
      fileInfo.style.display = 'block';
      fileName.textContent = filename;
    }
  }

  private clearFileInfo(): void {
    const uploadPrompt = this.container.querySelector('#uploadPrompt') as HTMLElement;
    const fileInfo = this.container.querySelector('#fileInfo') as HTMLElement;

    if (uploadPrompt && fileInfo) {
      uploadPrompt.style.display = 'block';
      fileInfo.style.display = 'none';
    }
  }

  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.render();
    this.attachEventListeners();
    this.onChange(this.settings);
    saveSettings(this.settings);
  }

  show(): void {
    this.isVisible = true;
    const sidebar = this.container.querySelector('#controlSidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.add('visible');
    }
  }

  hide(): void {
    this.isVisible = false;
    const sidebar = this.container.querySelector('#controlSidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('visible');
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
