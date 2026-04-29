import { useMemoizedFn } from 'ahooks';
import { useRef, useState } from 'react';

interface Params {
  sampleRate?: number;
  numChannels?: number;
  bitsPerSample?: number;
  onReady?: () => void;
  onError?: (err: any) => void;
  onPlaybackComplete?: () => void;
}

const JITTER_DELAY = 0.1;

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
  const analyserRef = useRef<AnalyserNode | null>(null);

  const leftoverRef = useRef<Uint8Array | null>(null);
  const streamEndedRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const pendingSourcesRef = useRef(0);

  const [audioChunks, setAudioChunks] = useState<any>({
    data: new Uint8Array(128),
    analyser: null
  });

  const checkComplete = useMemoizedFn(() => {
    if (streamEndedRef.current && pendingSourcesRef.current === 0) {
      setIsPlaying(false);
      onPlaybackComplete?.();
    }
  });

  const initialize = useMemoizedFn(async () => {
    if (audioContextRef.current) return;

    try {
      const ctx = new AudioContext({ sampleRate });

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      leftoverRef.current = null;
      streamEndedRef.current = false;
      nextStartTimeRef.current = 0;
      pendingSourcesRef.current = 0;

      setAudioChunks({
        data: new Uint8Array(analyser.frequencyBinCount),
        analyser: analyserRef
      });

      onReady?.();
    } catch (err: any) {
      onError?.(err?.message ?? String(err));
    }
  });

  const convertPCM = (pcmData: Uint8Array) => {
    let pcm = pcmData;
    const bytesPerSample = bitsPerSample / 8;
    const frameSize = bytesPerSample * numChannels;

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
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    const floatData = convertPCM(pcmChunk);
    if (!floatData.length) return;

    setIsPlaying(true);

    const frames = floatData.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frames, sampleRate);

    if (numChannels === 1) {
      buffer.copyToChannel(floatData, 0);
    } else {
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = new Float32Array(frames);
        for (let i = 0; i < frames; i++) {
          channelData[i] = floatData[i * numChannels + ch];
        }
        buffer.copyToChannel(channelData, ch);
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);

    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now + JITTER_DELAY;
    }

    const startAt = nextStartTimeRef.current;
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;

    pendingSourcesRef.current++;
    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      pendingSourcesRef.current--;
      checkComplete();
    };
  });

  const stop = useMemoizedFn(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    ctx.close();

    audioContextRef.current = null;
    analyserRef.current = null;
    leftoverRef.current = null;
    streamEndedRef.current = false;
    nextStartTimeRef.current = 0;
    pendingSourcesRef.current = 0;

    setIsPlaying(false);
  });

  const cleanup = useMemoizedFn(() => {
    stop();
  });

  const endStream = useMemoizedFn(() => {
    if (!audioContextRef.current) return;

    streamEndedRef.current = true;
    checkComplete();
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
