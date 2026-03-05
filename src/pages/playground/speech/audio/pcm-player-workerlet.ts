const workletCode = `class PCMPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.capacity = 24000 * 2; // 2 seconds buffer
    this.jitterThreshold = 24000 * 0.1; // 100ms

    this.buffer = new Float32Array(this.capacity);

    this.readIndex = 0;
    this.writeIndex = 0;
    this.size = 0;

    this.streamEnded = false;
    this.completionNotified = false;

    this.port.onmessage = (event) => {
      const { type, data } = event.data || {};

      if (type === 'push' && data) {
        this.push(data);
      }

      if (type === 'clear') {
        this.readIndex = 0;
        this.writeIndex = 0;
        this.size = 0;
        this.streamEnded = false;
        this.completionNotified = false;
      }

      if (type === 'end-stream') {
        this.streamEnded = true;
      }
    };
  }

  push(data) {
    for (let i = 0; i < data.length; i++) {
      if (this.size >= this.capacity) {
        // backpressure: drop oldest data
        this.readIndex = (this.readIndex + 1) % this.capacity;
        this.size--;
      }

      this.buffer[this.writeIndex] = data[i];

      this.writeIndex = (this.writeIndex + 1) % this.capacity;
      this.size++;
    }
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output) return true;

    const channel = output[0];

    for (let i = 0; i < channel.length; i++) {
      // When stream has ended, ignore jitter threshold and play remaining data
      if (!this.streamEnded && this.size < this.jitterThreshold) {
        channel[i] = 0;
        continue;
      }

      if (this.size === 0) {
        channel[i] = 0;
        continue;
      }

      channel[i] = this.buffer[this.readIndex];

      this.readIndex = (this.readIndex + 1) % this.capacity;
      this.size--;
    }

    // Check if playback is complete
    if (this.streamEnded && this.size === 0 && !this.completionNotified) {
      console.log('PCM playback complete, notifying main thread');
      this.completionNotified = true;
      this.port.postMessage({ type: 'playback-complete' });
    }

    return true;
  }
}

registerProcessor('pcm-player', PCMPlayerProcessor);`;

export const workerletUrl = (): string => {
  const blob = new Blob([workletCode], { type: 'application/javascript' });
  const workletUrl = URL.createObjectURL(blob);
  return workletUrl;
};
