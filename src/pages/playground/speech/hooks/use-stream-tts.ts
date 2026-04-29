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
  autoPlay?: boolean;
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
  const [progress, setProgress] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const controllerRef = useRef<AbortController | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);
  const isAppendingRef = useRef(false);
  const allChunksRef = useRef<Uint8Array[]>([]);
  const [isPCM, setIsPCM] = useState(false);
  const completeAudioUrlRef = useRef<string>('');

  // PCM stream player instance
  const pcmPlayer = usePCMStreamPlayer({
    onError: (error) => {
      console.error('PCM player error:', error);
      params?.onError?.(error);
    },
    onPlaybackComplete: () => {
      console.log('PCM playback complete');
      // Create complete audio URL from all chunks when playback finishes
      if (allChunksRef.current.length > 0) {
        const totalLength = allChunksRef.current.reduce(
          (acc, chunk) => acc + chunk.length,
          0
        );
        const pcmData = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of allChunksRef.current) {
          pcmData.set(chunk, offset);
          offset += chunk.length;
        }

        // Convert combined PCM data to WAV and create URL
        const wavBlob = pcmToWav(pcmData.buffer);
        const completeUrl = URL.createObjectURL(wavBlob);
        params?.onComplete?.(completeUrl);
        // when the stream ends, should clear the audio analyer data, because the the audio elment will play the complete audio, and the analyser will generate new.
        pcmPlayer.setAudioChunks(null);
      }
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
      setProgress(0);
      setIsPCM(ttsParams.response_format === 'pcm');
      allChunksRef.current = [];

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
      const isPCM = format === 'pcm';
      const useMediaSource = !isPCM && supportsMediaSource(format);

      let url = '';
      console.log(
        'format:',
        format,
        'isPCM:',
        isPCM,
        'useMediaSource:',
        useMediaSource
      );

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
        console.log('Created MediaSource URL:', url);
        setStreamUrl(url);
        params?.onUrlReady?.(url); // Notify that URL is ready
        console.log('Called onUrlReady with URL:', url);

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
          if (allChunksRef.current.length > 0) {
            if (isPCM) {
              // PCM format: notify the player that streaming has ended
              // onComplete will be called by the player when playback finishes
              pcmPlayer.endStream();
            } else {
              const completeBlob = new Blob(allChunksRef.current as any, {
                type: `audio/${format}`
              });
              const completeUrl = URL.createObjectURL(completeBlob);
            }
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
          setProgress((prev) => prev + 1);
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

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    pcmPlayer.stop();
    if (streamUrl) {
      URL.revokeObjectURL(streamUrl);
    }
    if (mediaSourceRef.current?.readyState === 'open') {
      try {
        mediaSourceRef.current.endOfStream();
      } catch (error) {
        console.error('Failed to end stream on abort:', error);
      }
    }
    setLoading(false);
  }, [streamUrl, pcmPlayer]);

  const play = useCallback(() => {
    params?.playerRef?.current?.play();
  }, [params?.playerRef]);

  const pause = useCallback(() => {
    params?.playerRef?.current?.pause();
  }, [params?.playerRef]);

  return {
    generate,
    abort,
    loading,
    error,
    progress,
    streamUrl,
    audioChunks: isPCM ? pcmPlayer.audioChunks : undefined,
    isPlaying: pcmPlayer.isPlaying,
    pcmPlayer,
    play,
    pause
  };
};
