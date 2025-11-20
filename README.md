# SVG Player AI

A modern, high-performance radial SVG animator with audio reactivity and advanced visual effects.

## ✨ Features

- 🎨 **Radial Animation**: Animate SVG and PNG images in stunning radial patterns
- 🎛️ **Extensive Controls**: Fine-tune every aspect of your animation
- 🎧 **Audio Reactive**: Sync animations to music and sound
- ⚡ **High Performance**: Optimized for smooth playback even with 100+ shapes
- 🎨 **Advanced Filters**: Apply real-time visual effects
- 💾 **Persistent Settings**: Your preferences are saved automatically
- 🎮 **Intuitive UI**: Clean, modern interface with easy show/hide controls
- ⌨️ **Keyboard Shortcuts**: Quick access to common functions

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage

### Loading Assets

- **Upload**: Drag and drop SVG or PNG files, or click to browse
- **Examples**: Choose from built-in example images
- **Clear**: Remove the current asset

### Keyboard Shortcuts

- `H` - Toggle control panel
- `Space` - Pause/Resume animation

### Controls

The unified control panel on the right includes:

#### 🎛️ Animation
- **Repeats**: Number of clones (1-128)
- **Size**: Base size of each shape
- **Radius**: Distance from center
- **Composite Rotation**: Overall rotation of the pattern
- **Individual Spin**: Rotation of each individual shape

#### 📏 Scale Pulsation
- **Enable/Disable**: Toggle pulsing scale effect
- **Rate**: Speed of pulsation
- **Amount**: Intensity of pulsation
- **Individual Variation**: Each shape pulses differently

#### 🌀 Radial Oscillation
- **Enable/Disable**: Toggle radial movement
- **Rate**: Speed of oscillation
- **Amount**: Distance of oscillation
- **Individual Variation**: Each shape oscillates differently

#### 🎨 Appearance
- **Background**: Set background color
- **Hue Rotation**: Enable rainbow color cycling
- **Hue Drift**: Speed of color changes

#### ✨ Filters
- **Enable/Disable**: Toggle post-processing filters
- **Brightness**: Adjust overall brightness
- **Contrast**: Adjust contrast
- **Saturation**: Adjust color intensity
- **Blur**: Apply blur effect

#### 🎧 Audio Reactive
- **Enable/Disable**: Sync to microphone input
- **Sensitivity**: Overall responsiveness
- **Bass/Mid/Treble Boost**: Frequency-specific boosts
- **Max Radius Mod**: Maximum radius change from audio

## ⚡ Performance Optimizations

This modernized version includes several performance improvements:

### 1. **GPU Acceleration**
- Uses CSS `transform` instead of `left/top` positioning
- `will-change` hints for GPU layer promotion
- Hardware-accelerated CSS transforms

### 2. **Efficient Rendering**
- Fixed timestep animation loop prevents frame rate issues
- Batch DOM updates to minimize reflows
- DocumentFragment for efficient clone creation

### 3. **Optimized Animation Loop**
- Separates update logic from rendering
- Frame time accumulator for consistent physics
- Prevents "spiral of death" with delta time capping

### 4. **Modern Architecture**
- TypeScript for type safety and better tooling
- Modular code structure for maintainability
- Vite for fast builds and hot module replacement

### 5. **Memory Management**
- Efficient clone recycling
- Proper cleanup on asset change
- Optimized event listeners

## 🏗️ Project Structure

```
svgplayerai/
├── src/
│   ├── main.ts          # Application entry point
│   ├── animator.ts      # Core animation engine
│   ├── controls.ts      # UI controls manager
│   ├── audio.ts         # Audio analysis
│   ├── storage.ts       # Settings persistence
│   ├── types.ts         # TypeScript type definitions
│   └── styles/
│       └── main.css     # Modern CSS with animations
├── image_assets/        # Example SVG/PNG files
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## 🎨 UI Improvements

### Before
- Multiple scattered control panels
- Fixed position controls
- Difficult to access/hide controls
- Inconsistent styling

### After
- **Unified Control Sidebar**: All controls in one organized panel
- **Smooth Animations**: Slide-in/out with backdrop blur
- **Modern Design**: Clean, consistent styling with glow effects
- **Easy Toggle**: Click button or press `H` to show/hide
- **Responsive**: Works on different screen sizes
- **Top Bar**: Minimal always-visible controls for play/pause

## 🔧 Technical Details

### Technologies Used
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR
- **CSS3**: Modern styling with animations
- **Web Audio API**: Real-time audio analysis
- **LocalStorage**: Settings persistence
- **ESLint**: Code quality and consistency

### Browser Compatibility
- Modern browsers with ES2020 support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires microphone permission for audio reactivity

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
