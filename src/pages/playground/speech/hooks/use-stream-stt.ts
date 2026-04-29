import {
  fetchChunkedDataPostFormData,
  readStreamData
} from '@/utils/fetch-chunk-data';
import _ from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { AUDIO_SPEECH_TO_TEXT_API } from '../../apis';
import { extractErrorMessage } from '../../config';

interface UseStreamSTTParams {
  onChunk?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: any) => void;
}

interface STTParams {
  model: string;
  language?: string;
  file: File;
  stream?: boolean;
  [key: string]: any;
}

export const useStreamSTT = (params?: UseStreamSTTParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (sttParams: STTParams) => {
      try {
        setLoading(true);
        setError(null);
        setProgress(0);

        // Abort previous request if exists
        controllerRef.current?.abort();
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        // Add stream parameter
        const streamParams = {
          ...sttParams,
          stream: true
        };

        const result = await fetchChunkedDataPostFormData({
          url: AUDIO_SPEECH_TO_TEXT_API,
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

        const { reader, decoder } = result;

        if (!reader || !decoder) {
          throw new Error('Failed to get reader from response');
        }

        // Collect all text chunks
        let fullText = '';

        await readStreamData(
          reader,
          decoder,
          (chunk: any) => {
            if (chunk.error) {
              const errorMessage = extractErrorMessage(chunk.error);
              setError({
                error: true,
                errorMessage
              });
              params?.onError?.(errorMessage);
              return;
            } else {
              const deltaContent =
                _.get(chunk, 'choices.0.delta.content', '') === null
                  ? ''
                  : _.get(chunk, 'choices.0.delta.content', '');

              fullText += deltaContent;
              params?.onChunk?.(fullText);
              setProgress((prev) => prev + 1);
            }
          },
          100
        );

        params?.onComplete?.(fullText);
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
