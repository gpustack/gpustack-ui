import { useMemoizedFn } from 'ahooks';
import { useRef, useState } from 'react';
import { workerletUrl } from '../audio/pcm-player-workerlet';

interface Params {
  sampleRate?: number;
  numChannels?: number;
  bitsPerSample?: number;
  onReady?: () => void;
  onError?: (err: any) => void;
  onPlaybackComplete?: () => void;
}

export const usePCMStreamPlayer = (params?: Params) => {
  const {
    sampleRate = 24000,
    numChannels = 1,
    bitsPerSample = 16,
    onReady,
    onError,
    onPlaybackComplete
  } = params || {};

  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const leftoverRef = useRef<Uint8Array | null>(null);
  const streamEndedRef = useRef(false);

  const [audioChunks, setAudioChunks] = useState<any>({
    data: new Uint8Array(128),
    analyser: null
  });

  const initialize = useMemoizedFn(async () => {
    if (audioContextRef.current) return;

    try {
      const ctx = new AudioContext({ sampleRate });

      const workletUrl = workerletUrl();

      await ctx.audioWorklet.addModule(workletUrl);

      URL.revokeObjectURL(workletUrl);
      const node = new AudioWorkletNode(ctx, 'pcm-player');

      // Listen for messages from the worklet
      node.port.onmessage = (event) => {
        if (event.data.type === 'playback-complete') {
          setIsPlaying(false);
          onPlaybackComplete?.();
        }
      };

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;

      node.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      workletNodeRef.current = node;
      analyserRef.current = analyser;

      setAudioChunks({
        data: new Uint8Array(analyser.frequencyBinCount),
        analyser: analyserRef
      });

      streamEndedRef.current = false;

      onReady?.();
    } catch (err) {
      onError?.(err);
    }
  });

  const convertPCM = (pcmData: Uint8Array) => {
    let pcm = pcmData;
    const bytesPerSample = bitsPerSample / 8;
    const frameSize = bytesPerSample * numChannels;

    // If there's leftover data from the previous chunk, prepend it to the current chunk
    if (leftoverRef.current) {
      const merged = new Uint8Array(leftoverRef.current.length + pcm.length);
      merged.set(leftoverRef.current);
      merged.set(pcm, leftoverRef.current.length);
      pcm = merged;
    }

    const usableLength = Math.floor(pcm.length / frameSize) * frameSize;

    leftoverRef.current = pcm.slice(usableLength);

    const usable = pcm.slice(0, usableLength);

    const view = new DataView(
      usable.buffer,
      usable.byteOffset,
      usable.byteLength
    );

    const numSamples = usable.length / 2;

    const float32 = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      float32[i] = view.getInt16(i * 2, true) / 32768;
    }

    return float32;
  };

  const addChunk = useMemoizedFn((pcmChunk: Uint8Array) => {
    const node = workletNodeRef.current;
    if (!node) return;

    setIsPlaying(true);
    const floatData = convertPCM(pcmChunk);

    if (!floatData.length) return;

    node.port.postMessage({
      type: 'push',
      data: floatData
    });
  });

  const stop = useMemoizedFn(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    workletNodeRef.current?.port.postMessage({ type: 'clear' });

    ctx.close();

    audioContextRef.current = null;
    workletNodeRef.current = null;
    analyserRef.current = null;
    streamEndedRef.current = false;

    setIsPlaying(false);
  });

  const cleanup = useMemoizedFn(() => {
    stop();
  });

  const endStream = useMemoizedFn(() => {
    const node = workletNodeRef.current;
    if (!node) return;

    streamEndedRef.current = true;
    node.port.postMessage({ type: 'end-stream' });
  });

  return {
    initialize,
    addChunk,
    stop,
    cleanup,
    endStream,
    isPlaying,
    setIsPlaying,
    setAudioChunks,
    audioChunks
  };
};
