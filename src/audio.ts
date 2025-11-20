export class AudioAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;
  private isActive = false;

  async initialize(): Promise<boolean> {
    if (this.audioCtx) return true;

    try {
      this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = this.audioCtx.createMediaStreamSource(stream);
      src.connect(this.analyser);
      this.isActive = true;
      return true;
    } catch (err) {
      console.error('Microphone access denied', err);
      this.isActive = false;
      return false;
    }
  }

  getAudioLevel(bassBoost: number, midBoost: number, trebBoost: number, sensitivity: number): number {
    if (!this.isActive || !this.analyser || !this.freqData) return 0;

    const freqData = this.freqData;
    // @ts-ignore - TypeScript strict type checking issue with Uint8Array
    this.analyser.getByteFrequencyData(freqData);
    const len = freqData.length;
    const third = Math.floor(len / 3);

    const bassSlice = Array.from(freqData.slice(0, third));
    const midSlice = Array.from(freqData.slice(third, 2 * third));
    const trebSlice = Array.from(freqData.slice(2 * third));

    const bass = bassSlice.reduce((a, v) => a + v, 0) / third;
    const mid = midSlice.reduce((a, v) => a + v, 0) / third;
    const treb = trebSlice.reduce((a, v) => a + v, 0) / (len - 2 * third);

    const totalW = bassBoost + midBoost + trebBoost;
    const weighted = bass * bassBoost + mid * midBoost + treb * trebBoost;
    return (weighted / 255 / totalW) * sensitivity;
  }

  get active(): boolean {
    return this.isActive;
  }
}
