function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert PCM audio data to WAV format
 * @param pcmData - Raw PCM audio data as ArrayBuffer
 * @param sampleRate - Sample rate (default: 24000 Hz, common for TTS)
 * @param numChannels - Number of channels (default: 1 for mono)
 * @param bitsPerSample - Bits per sample (default: 16)
 * @returns WAV format audio as Blob
 */
export function pcmToWav(
  pcmData: ArrayBuffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Blob {
  const pcmBytes = new Uint8Array(pcmData);
  const dataLength = pcmBytes.length;

  // WAV file header size
  const headerSize = 44;
  const wavBuffer = new ArrayBuffer(headerSize + dataLength);
  const view = new DataView(wavBuffer);

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // Subchunk2Size

  // Write PCM data
  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(pcmBytes, headerSize);

  return new Blob([wavBuffer], { type: 'audio/wav' });
}
