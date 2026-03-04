import { fetchChunkedData } from '@/utils/fetch-chunk-data';
import { useCallback, useRef, useState } from 'react';
import { AUDIO_TEXT_TO_SPEECH_API } from '../../apis';
import { extractErrorMessage } from '../../config';

interface UseStreamTTSParams {
  onChunk?: (chunk: ArrayBuffer) => void;
  onComplete?: (audioUrl: string) => void; // Return complete audio URL when done
  onError?: (error: any) => void;
  autoPlay?: boolean;
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

/**
 * Audio chunk queue manager for smooth playback
 * Uses a single Audio element for better performance and seamless playback
 */
class AudioQueue {
  private queue: Blob[] = [];
  private audioElement: HTMLAudioElement;
  private isPlaying = false;
  private currentIndex = 0;
  private onComplete?: () => void;
  private streamEnded = false;
  private minBufferSize = 2; // Minimum chunks to buffer before starting playback
  private maxQueueSize = 10; // Maximum queue size to prevent memory issues
  private currentBlobUrl: string | null = null;

  constructor(onComplete?: () => void) {
    this.onComplete = onComplete;
    // Create a single Audio element for the entire playback session
    this.audioElement = new Audio();
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audioElement.onended = () => {
      this.cleanupCurrentBlob();
      this.playNext();
    };

    this.audioElement.onerror = () => {
      console.error('Audio playback error');
      this.cleanupCurrentBlob();
      this.playNext();
    };
  }

  private cleanupCurrentBlob() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  addChunk(chunk: Blob) {
    this.queue.push(chunk);

    // Start playback if we have enough buffer
    if (!this.isPlaying && this.queue.length >= this.minBufferSize) {
      this.playNext();
    }
  }

  // Check if queue is full (for backpressure)
  isFull(): boolean {
    return this.queue.length - this.currentIndex >= this.maxQueueSize;
  }

  // Get current queue size (unplayed chunks)
  getQueueSize(): number {
    return this.queue.length - this.currentIndex;
  }

  private async playNext() {
    if (this.currentIndex >= this.queue.length) {
      // If stream has ended and no more chunks, complete
      if (this.streamEnded) {
        this.isPlaying = false;
        this.onComplete?.();
      }
      return;
    }

    this.isPlaying = true;
    const chunk = this.queue[this.currentIndex];
    this.currentIndex++;

    // Reuse the same Audio element, just update the src
    this.cleanupCurrentBlob();
    this.currentBlobUrl = URL.createObjectURL(chunk);
    this.audioElement.src = this.currentBlobUrl;

    try {
      await this.audioElement.play();
    } catch (error) {
      console.error('Failed to play audio chunk:', error);
      this.cleanupCurrentBlob();
      this.playNext();
    }
  }

  markStreamEnded() {
    this.streamEnded = true;
    // If not playing and has remaining chunks, start playing
    if (!this.isPlaying && this.currentIndex < this.queue.length) {
      this.playNext();
    }
  }

  stop() {
    this.isPlaying = false;
    this.audioElement.pause();
    this.cleanupCurrentBlob();
  }

  clear() {
    this.stop();
    this.queue = [];
    this.currentIndex = 0;
    this.streamEnded = false;
  }
}

export const useStreamTTS = (params?: UseStreamTTSParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

  const generate = useCallback(
    async (ttsParams: TTSParams) => {
      try {
        setLoading(true);
        setError(null);
        setProgress(0);

        // Abort previous request if exists
        controllerRef.current?.abort();
        audioQueueRef.current?.clear();

        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        // Create audio queue for smooth playback
        audioQueueRef.current = new AudioQueue();

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
          const errorMessage = extractErrorMessage(result.data);
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
        let audioChunks: Uint8Array[] = [];
        let allAudioChunks: Uint8Array[] = []; // Collect all chunks for final URL
        let chunkCount = 0;

        while (true) {
          // Backpressure: wait if queue is full
          while (audioQueueRef.current?.isFull()) {
            await new Promise((resolve) => {
              setTimeout(resolve, 100);
            });
          }

          const { done, value } = await reader.read();

          if (done) {
            // Process remaining chunks for playback
            if (audioChunks.length > 0) {
              const blob = new Blob(audioChunks as any, {
                type: `audio/${ttsParams.response_format || 'mp3'}`
              });
              audioQueueRef.current?.addChunk(blob);
              params?.onChunk?.(blob.arrayBuffer() as any);
            }
            audioQueueRef.current?.markStreamEnded();

            // Create complete audio URL from all chunks
            if (allAudioChunks.length > 0) {
              const completeBlob = new Blob(allAudioChunks as any, {
                type: `audio/${ttsParams.response_format || 'mp3'}`
              });
              const completeUrl = URL.createObjectURL(completeBlob);
              params?.onComplete?.(completeUrl);
            }
            break;
          }

          if (value) {
            audioChunks.push(value);
            allAudioChunks.push(value); // Keep all chunks for final URL
            chunkCount++;

            // For fast API responses, batch chunks to avoid too many small audio elements
            // Create a blob every N chunks or when chunk size exceeds threshold
            const totalSize = audioChunks.reduce(
              (sum, chunk) => sum + chunk.length,
              0
            );
            const shouldFlush = chunkCount >= 5 || totalSize >= 50000; // ~50KB threshold

            if (shouldFlush) {
              const blob = new Blob(audioChunks as any, {
                type: `audio/${ttsParams.response_format || 'mp3'}`
              });
              audioQueueRef.current?.addChunk(blob);
              params?.onChunk?.(blob.arrayBuffer() as any);

              audioChunks = [];
              chunkCount = 0;
              setProgress((prev) => prev + 1);
            }
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
    },
    [params]
  );

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    audioQueueRef.current?.stop();
    setLoading(false);
  }, []);

  return {
    generate,
    abort,
    loading,
    error,
    progress
  };
};
