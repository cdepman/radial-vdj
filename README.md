# SVG Player

A high-performance radial SVG animator with audio reactivity and real-time visual effects. Think of it as a visual DJ tool for creating animated kaleidoscopic patterns from SVG and PNG images.

## Features

- **Radial Animation**: Animate SVG/PNG images in radial patterns with up to 128 clones
- **Component Radial Orientation**: Control how shapes orient relative to the center (point inward/outward, tangent rotation)
- **Audio Reactive**: Sync animations to microphone input with frequency-specific controls
- **Preset System**: Load pre-configured examples with custom animation settings
- **Settings Management**: Export/import animation settings as JSON
- **Advanced Filters**: Real-time post-processing effects (brightness, contrast, saturation, blur)
- **Keyboard Shortcuts**: `H` to toggle controls, `Space` to pause/resume

## Quick Start

```bash
npm install
npm run dev        # development server
npm run build      # production build
npm run preview    # preview production build
```

## Controls

### Animation

- **Repeats**: Number of clones (1-128)
- **Size**: Base size of each shape
- **Radius**: Distance from center
- **Composite Rotation**: Overall pattern rotation speed
- **Individual Spin**: Per-shape rotation speed

### Component Radial Orientation

- **Enable/Disable**: Toggle orientation relative to center
- **Offset**: Fine-tune orientation angle
- **Presets**: Point outward, point inward, or tangent alignment

### Scale Pulsation

- **Rate**: Pulsation speed
- **Amount**: Pulsation intensity
- **Individual Variation**: Per-shape randomization

### Radial Oscillation

- **Rate**: Oscillation speed
- **Amount**: Oscillation distance
- **Individual Variation**: Per-shape randomization

### Appearance

- **Background**: Background color
- **Hue Rotation**: Enable color cycling
- **Hue Drift**: Color cycle speed

### Filters

- **Brightness/Contrast/Saturation**: Color adjustments
- **Blur**: Blur effect

### Audio Reactive

- **Enable**: Sync to microphone
- **Sensitivity**: Overall responsiveness
- **Bass/Mid/Treble Boost**: Frequency-specific amplification
- **Max Radius Mod**: Maximum radius change from audio

### Settings Management

- **Download**: Export current settings as JSON
- **Upload**: Import previously saved settings
- **Reset**: Restore default settings

## Performance

- GPU-accelerated transforms with `will-change` optimization
- Fixed timestep animation loop (60 FPS)
- Batch DOM updates to minimize reflows
- Efficient clone management and memory handling

## Project Structure

```
svgplayer/
├── src/
│   ├── main.ts          # App initialization
│   ├── animator.ts      # Core animation engine
│   ├── controls.ts      # UI controls
│   ├── audio.ts         # Audio analysis
│   ├── storage.ts       # Settings persistence
│   ├── types.ts         # TypeScript definitions
│   └── styles/main.css  # Styling
├── public/
│   ├── image_assets/    # Example SVG/PNG files
│   └── presets/         # Preset JSON configurations
└── index.html           # HTML entry point
```

## Tech Stack

- TypeScript
- Vite
- Web Audio API
- LocalStorage
- CSS3 animations

## Browser Support

Modern browsers with ES2020 support (Chrome, Firefox, Safari, Edge). Requires microphone permission for audio reactivity.

## License

MIT
