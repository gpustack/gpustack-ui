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
const POSITION_INTERVAL = 200;

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
  // Total length of the scheduled audio, known exactly once the stream ends —
  // no need to wait for playback to drain to report a duration.
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const leftoverRef = useRef<Uint8Array | null>(null);
  const streamEndedRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  const totalFramesRef = useRef(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [audioChunks, setAudioChunks] = useState<any>({
    data: new Uint8Array(128),
    analyser: null
  });

  // Everything scheduled ahead of `currentTime` is contiguous audio, so the
  // played position is the audio scheduled so far minus what is still queued.
  // A suspended context freezes its clock, which freezes the position too.
  const positionOf = (ctx: AudioContext) => {
    const total = totalFramesRef.current / sampleRate;
    const remaining = Math.max(0, nextStartTimeRef.current - ctx.currentTime);
    return Math.min(total, Math.max(0, total - remaining));
  };

  const clearTimers = () => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    if (positionTimerRef.current) {
      clearInterval(positionTimerRef.current);
      positionTimerRef.current = null;
    }
  };

  const complete = useMemoizedFn(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    setIsPlaying(false);
    onPlaybackComplete?.();
  });

  // `nextStartTime` is the context time at which the last scheduled buffer
  // ends, so playback completion is a known instant — it must not be inferred
  // from a count of live source nodes: that count is shared across runs, and a
  // new run resets it while the previous run's nodes are still reporting
  // `onended`, which drives it negative and loses the completion signal for
  // good. Re-armed after a seek, and after a resume because a suspended
  // context's clock does not run down in wall-clock time.
  const scheduleCompletion = useMemoizedFn(() => {
    const ctx = audioContextRef.current;
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    if (!ctx || !streamEndedRef.current || isPausedRef.current) return;

    const remaining = nextStartTimeRef.current - ctx.currentTime;
    if (remaining <= 0) {
      complete();
      return;
    }
    completionTimerRef.current = setTimeout(complete, remaining * 1000 + 50);
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

      clearTimers();
      sourcesRef.current.clear();
      leftoverRef.current = null;
      streamEndedRef.current = false;
      nextStartTimeRef.current = 0;
      isPausedRef.current = false;
      totalFramesRef.current = 0;
      setDuration(0);
      setCurrentTime(0);

      positionTimerRef.current = setInterval(() => {
        const current = audioContextRef.current;
        if (current) {
          setCurrentTime(positionOf(current));
        }
      }, POSITION_INTERVAL);

      setAudioChunks({
        data: new Uint8Array(analyser.frequencyBinCount),
        analyser: analyserRef
      });

      onReady?.();
    } catch (err: any) {
      onError?.(err?.message ?? String(err));
    }
  });

  const toFloat32 = (pcm: Uint8Array) => {
    const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    const numSamples = Math.floor(pcm.length / 2);
    const float32 = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      float32[i] = view.getInt16(i * 2, true) / 32768;
    }

    return float32;
  };

  // Carries the bytes of an incomplete trailing frame over to the next chunk.
  const convertPCM = (pcmData: Uint8Array) => {
    let pcm = pcmData;
    const frameSize = (bitsPerSample / 8) * numChannels;

    if (leftoverRef.current) {
      const merged = new Uint8Array(leftoverRef.current.length + pcm.length);
      merged.set(leftoverRef.current);
      merged.set(pcm, leftoverRef.current.length);
      pcm = merged;
    }

    const usableLength = Math.floor(pcm.length / frameSize) * frameSize;
    leftoverRef.current = pcm.slice(usableLength);

    return toFloat32(pcm.slice(0, usableLength));
  };

  // Queues one buffer of audio and returns its length in frames. `startAt`
  // defaults to the end of what is already queued, which is what streaming
  // needs; a seek passes the current time to start over from there.
  const scheduleBuffer = (
    floatData: Float32Array<ArrayBuffer>,
    startAt?: number
  ) => {
    const ctx = audioContextRef.current!;
    const analyser = analyserRef.current!;
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
    if (startAt !== undefined) {
      nextStartTimeRef.current = startAt;
    } else if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now + JITTER_DELAY;
    }

    const begin = nextStartTimeRef.current;
    source.start(begin);
    nextStartTimeRef.current = begin + buffer.duration;

    sourcesRef.current.add(source);
    source.onended = () => {
      sourcesRef.current.delete(source);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
    };

    return frames;
  };

  const stopSources = () => {
    sourcesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    });
    sourcesRef.current.clear();
  };

  const addChunk = useMemoizedFn((pcmChunk: Uint8Array) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    const floatData = convertPCM(pcmChunk);
    if (!floatData.length) return;

    // chunks keep arriving while the user has paused — they are scheduled on
    // the (frozen) context clock and must not flip the state back to playing.
    if (!isPausedRef.current) {
      setIsPlaying(true);
    }

    totalFramesRef.current += scheduleBuffer(floatData);
  });

  // Restart playback at `position` seconds from the complete PCM data. Seeking
  // means dropping every queued buffer and queueing the remainder as one, so it
  // is only meaningful once the stream has ended and the data is all there.
  const playFrom = useMemoizedFn((position: number, pcm: Uint8Array) => {
    const ctx = audioContextRef.current;
    if (!ctx || !analyserRef.current) return;

    const frameSize = (bitsPerSample / 8) * numChannels;
    const total = totalFramesRef.current / sampleRate;
    const from = Math.min(Math.max(position, 0), total);
    const byteOffset = Math.floor(from * sampleRate) * frameSize;
    const floatData = toFloat32(pcm.subarray(byteOffset));
    if (!floatData.length) return;

    stopSources();
    const frames = scheduleBuffer(floatData, ctx.currentTime);
    // the queue now holds the tail only — `positionOf` measures backwards from
    // the end of the queue, so the total has to account for the skipped head.
    totalFramesRef.current = Math.floor(from * sampleRate) + frames;
    setCurrentTime(from);
    scheduleCompletion();
  });

  // Suspending freezes ctx.currentTime, so every buffer scheduled ahead of the
  // network stream keeps its position and resumes exactly where it stopped.
  const pause = useMemoizedFn(async () => {
    const ctx = audioContextRef.current;
    if (!ctx || isPausedRef.current) return;

    isPausedRef.current = true;
    setIsPlaying(false);
    scheduleCompletion();
    try {
      await ctx.suspend();
    } catch (err: any) {
      isPausedRef.current = false;
      setIsPlaying(true);
      scheduleCompletion();
      onError?.(err?.message ?? String(err));
    }
  });

  const resume = useMemoizedFn(async () => {
    const ctx = audioContextRef.current;
    if (!ctx || !isPausedRef.current) return;

    isPausedRef.current = false;
    setIsPlaying(true);
    try {
      await ctx.resume();
      scheduleCompletion();
    } catch (err: any) {
      isPausedRef.current = true;
      setIsPlaying(false);
      onError?.(err?.message ?? String(err));
    }
  });

  const stop = useMemoizedFn(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    ctx.close();

    clearTimers();
    sourcesRef.current.clear();
    audioContextRef.current = null;
    analyserRef.current = null;
    leftoverRef.current = null;
    streamEndedRef.current = false;
    nextStartTimeRef.current = 0;
    isPausedRef.current = false;
    totalFramesRef.current = 0;

    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
  });

  const endStream = useMemoizedFn(() => {
    if (!audioContextRef.current) return;

    streamEndedRef.current = true;
    // every chunk has been scheduled, so the total length is final
    setDuration(totalFramesRef.current / sampleRate);
    scheduleCompletion();
  });

  return {
    initialize,
    addChunk,
    playFrom,
    pause,
    resume,
    stop,
    endStream,
    duration,
    currentTime,
    isPlaying,
    setAudioChunks,
    audioChunks
  };
};
