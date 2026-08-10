import { fetchChunkedData } from '@/utils/fetch-chunk-data';
import { pcmToWav } from '@/utils/pcm-to-wav';
import { useMemoizedFn } from 'ahooks';
import { useCallback, useRef, useState } from 'react';
import { AUDIO_TEXT_TO_SPEECH_API } from '../../apis';
import { extractErrorMessage } from '../../config';
import { usePCMStreamPlayer } from './use-pcm-stream-player';

interface UseStreamTTSParams {
  onChunk?: (chunk: ArrayBuffer) => void;
  onComplete?: (audioUrl: string) => void; // Return complete audio URL when done
  onError?: (error: any) => void;
  onUrlReady?: (url: string) => void; // Called when the stream URL is ready
  playerRef?: React.RefObject<any>; // Reference to the player for controlling playback
}

interface TTSParams {
  model: string;
  voice: string;
  response_format: string;
  speed?: number;
  input: string;
  stream?: boolean;
  [key: string]: any;
}

// MediaSource codec mapping for different formats
const MEDIA_SOURCE_CODECS: Record<string, string> = {
  mp4: 'audio/mp4; codecs="mp4a.40.2"',
  webm: 'audio/webm; codecs="opus"',
  ogg: 'audio/ogg; codecs="opus"',
  opus: 'audio/webm; codecs="opus"',
  pcm: 'audio/pcm; codecs=pcm'
};

// Check if format supports MediaSource API
const supportsMediaSource = (format: string): boolean => {
  if (!window.MediaSource) return false;
  const codec = MEDIA_SOURCE_CODECS[format];
  return codec ? MediaSource.isTypeSupported(codec) : false;
};

export const useStreamTTS = (params?: UseStreamTTSParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const controllerRef = useRef<AbortController | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);
  const isAppendingRef = useRef(false);
  const allChunksRef = useRef<Uint8Array[]>([]);
  const [isPCM, setIsPCM] = useState(false);
  const formatRef = useRef<string>('mp3');
  const completeUrlRef = useRef<string>('');
  const pcmCacheRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const deliveredRef = useRef(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  // PCM stream player instance
  const pcmPlayer = usePCMStreamPlayer({
    onError: (error) => {
      console.error('PCM player error:', error);
      params?.onError?.(error);
    },
    onPlaybackComplete: () => {
      finalizeAudio();
    }
  });

  // Cached because seeking asks for it repeatedly. Safe: it is only ever needed
  // once the chunk list has stopped growing, and it is dropped on the next run.
  const concatChunks = () => {
    if (pcmCacheRef.current) return pcmCacheRef.current;

    const totalLength = allChunksRef.current.reduce(
      (acc, chunk) => acc + chunk.length,
      0
    );
    const data = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of allChunksRef.current) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    pcmCacheRef.current = data;
    return data;
  };

  // The chunks received so far as one playable audio URL, built once per run.
  const buildCompleteAudioUrl = useMemoizedFn(() => {
    if (completeUrlRef.current) return completeUrlRef.current;
    if (!allChunksRef.current.length) return '';

    completeUrlRef.current =
      formatRef.current === 'pcm'
        ? URL.createObjectURL(pcmToWav(concatChunks().buffer))
        : URL.createObjectURL(
            new Blob(allChunksRef.current as any, {
              type: `audio/${formatRef.current}`
            })
          );

    return completeUrlRef.current;
  });

  // Hand the complete audio to the caller as the item's own audio, so it stops
  // being a stream and becomes a normal, seekable, downloadable player. Called
  // when playback drains and when the user stops the request, so a stopped
  // generation still leaves behind whatever it had produced.
  const finalizeAudio = useMemoizedFn(() => {
    if (deliveredRef.current) return;

    const completeUrl = buildCompleteAudioUrl();
    if (!completeUrl) return;

    deliveredRef.current = true;
    params?.onComplete?.(completeUrl);

    if (formatRef.current === 'pcm') {
      // clear the streaming analyser data: the audio element now plays the
      // complete audio and generates its own.
      pcmPlayer.setAudioChunks(null);
    }
  });

  const processQueue = useCallback(() => {
    if (
      isAppendingRef.current ||
      queueRef.current.length === 0 ||
      !sourceBufferRef.current ||
      sourceBufferRef.current.updating
    ) {
      return;
    }

    isAppendingRef.current = true;
    const chunk = queueRef.current.shift()!;
    try {
      sourceBufferRef.current.appendBuffer(chunk.buffer as ArrayBuffer);
    } catch (error) {
      console.error('Failed to append buffer:', error);
      isAppendingRef.current = false;
    }
  }, []);

  const generate = useMemoizedFn(async (ttsParams: TTSParams) => {
    try {
      setLoading(true);
      setError(null);
      setIsPCM(ttsParams.response_format === 'pcm');
      allChunksRef.current = [];
      pcmCacheRef.current = null;
      deliveredRef.current = false;
      setDownloadUrl('');
      // the previous run's audio has just left the list with it
      if (completeUrlRef.current) {
        URL.revokeObjectURL(completeUrlRef.current);
        completeUrlRef.current = '';
      }

      // Abort previous request if exists
      controllerRef.current?.abort();

      // Clean up previous PCM player
      pcmPlayer.stop();

      // Clean up previous MediaSource/URL
      if (streamUrl) {
        URL.revokeObjectURL(streamUrl);
        setStreamUrl('');
      }

      if (mediaSourceRef.current) {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
        mediaSourceRef.current = null;
      }

      sourceBufferRef.current = null;
      queueRef.current = [];
      isAppendingRef.current = false;

      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const format = ttsParams.response_format || 'mp3';
      formatRef.current = format;
      const isPCM = format === 'pcm';
      const useMediaSource = !isPCM && supportsMediaSource(format);

      let url = '';

      if (isPCM) {
        // PCM format: use Web Audio API for playback
        pcmPlayer.initialize();
        // Create a virtual URL identifier for PCM stream (not an actual URL since we're using Web Audio API)
        url = 'pcm-stream://playing';
        setStreamUrl(url);
        params?.onUrlReady?.(url);
      } else if (useMediaSource) {
        // Use MediaSource API for supported formats
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        url = URL.createObjectURL(mediaSource);
        setStreamUrl(url);
        params?.onUrlReady?.(url); // Notify that URL is ready

        // Wait for MediaSource to be ready
        await new Promise<void>((resolve, reject) => {
          const handleSourceOpen = () => {
            try {
              const mimeType = MEDIA_SOURCE_CODECS[format];
              const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
              sourceBufferRef.current = sourceBuffer;

              sourceBuffer.addEventListener('updateend', () => {
                isAppendingRef.current = false;
                processQueue();
              });

              sourceBuffer.addEventListener('error', (e) => {
                console.error('SourceBuffer error:', e);
              });

              resolve();
            } catch (error) {
              reject(error);
            }
          };

          mediaSource.addEventListener('sourceopen', handleSourceOpen, {
            once: true
          });

          // Timeout fallback
          setTimeout(() => {
            if (mediaSource.readyState !== 'open') {
              reject(new Error('MediaSource failed to open'));
            }
          }, 5000);
        });
      }

      // Add stream parameter
      const streamParams = {
        ...ttsParams,
        stream: true
      };

      const result = await fetchChunkedData({
        url: AUDIO_TEXT_TO_SPEECH_API,
        data: streamParams,
        signal
      });

      if ('error' in result) {
        const errorMessage = extractErrorMessage(result);
        setError({
          error: true,
          errorMessage
        });
        params?.onError?.(errorMessage);
        return;
      }

      const { reader } = result;

      if (!reader) {
        throw new Error('Failed to get reader from response');
      }

      // Read stream data
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (useMediaSource) {
            // Wait for all chunks to be appended before ending stream
            await new Promise<void>((resolve) => {
              const checkQueue = () => {
                if (queueRef.current.length === 0 && !isAppendingRef.current) {
                  if (mediaSourceRef.current?.readyState === 'open') {
                    try {
                      mediaSourceRef.current.endOfStream();
                      setLoading(false);
                    } catch (error) {
                      console.error('Failed to end stream:', error);
                    }
                  }
                  resolve();
                } else {
                  setTimeout(checkQueue, 100);
                }
              };
              checkQueue();
            });
          }

          // Handle completion based on format
          if (isPCM) {
            // The scheduled buffers are still playing, so the player calls back
            // through onPlaybackComplete when it drains. Every byte is in hand
            // though, so seeking and downloading can already be offered.
            pcmPlayer.endStream();
            setDownloadUrl(buildCompleteAudioUrl());
          } else if (!useMediaSource) {
            // No incremental playback happened: hand over the complete audio.
            // (MediaSource keeps playing its own URL, which endOfStream just
            // turned into a complete, seekable stream — don't swap it out.)
            finalizeAudio();
          }
          break;
        }

        if (value) {
          allChunksRef.current.push(value);
          if (isPCM) {
            // PCM chunks are sent directly to the player for real-time playback
            pcmPlayer.addChunk(value);
          } else if (useMediaSource) {
            queueRef.current.push(value);
            processQueue();
          }

          params?.onChunk?.(value.buffer);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }

      const errorMessage = err?.message || 'Stream processing failed';
      setError({
        error: true,
        errorMessage
      });
      params?.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  });

  // SpeechItem exposes the underlying audio element handle as `playerRef`.
  const audioElement = () => params?.playerRef?.current?.playerRef;

  const abort = useMemoizedFn(() => {
    controllerRef.current?.abort();
    // Stop what is currently audible: the PCM buffers scheduled ahead of the
    // network stream, and the audio element fed by MediaSource.
    pcmPlayer.stop();
    audioElement()?.pause?.();
    if (mediaSourceRef.current?.readyState === 'open') {
      try {
        mediaSourceRef.current.endOfStream();
      } catch (error) {
        console.error('Failed to end stream on abort:', error);
      }
    }
    if (streamUrl) {
      URL.revokeObjectURL(streamUrl);
      setStreamUrl('');
    }
    // keep the part that was already generated playable
    finalizeAudio();
    setLoading(false);
  });

  // Playback controls for a stream that is still being played by our own PCM
  // player. For every other format the audio element inside the player
  // component drives itself, and these calls are no-ops.
  const pause = useMemoizedFn(() => {
    pcmPlayer.pause();
  });

  const resume = useMemoizedFn(() => {
    pcmPlayer.resume();
  });

  const seek = useMemoizedFn((position: number) => {
    if (formatRef.current !== 'pcm' || !allChunksRef.current.length) return;
    pcmPlayer.playFrom(position, concatChunks());
  });

  return {
    generate,
    abort,
    loading,
    error,
    streamUrl,
    audioChunks: isPCM ? pcmPlayer.audioChunks : undefined,
    isPlaying: pcmPlayer.isPlaying,
    // length and download become available as soon as generation ends, without
    // waiting for playback to drain
    duration: pcmPlayer.duration,
    currentTime: pcmPlayer.currentTime,
    downloadUrl,
    pause,
    resume,
    seek
  };
};
