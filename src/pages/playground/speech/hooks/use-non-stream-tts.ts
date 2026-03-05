import { pcmToWav } from '@/utils/pcm-to-wav';
import { useCallback, useRef, useState } from 'react';
import { textToSpeech } from '../../apis';
import { extractErrorMessage } from '../../config';

interface UseNonStreamTTSParams {
  onSuccess?: (result: { url: string; type: string }) => void;
  onError?: (error: any) => void;
}

interface TTSParams {
  model: string;
  voice: string;
  response_format: string;
  speed?: number;
  input: string;
  [key: string]: any;
}

export const useNonStreamTTS = (params?: UseNonStreamTTSParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const convertPCMToWav = async (ab: Blob) => {
    let audioBlob = ab;
    // Convert PCM to WAV for browser playback
    const arrayBuffer = await audioBlob.arrayBuffer();
    audioBlob = pcmToWav(arrayBuffer);

    const audioUrl = audioBlob.size > 0 ? URL.createObjectURL(audioBlob) : '';
    return {
      url: audioUrl,
      type: audioBlob.type
    };
  };

  // handle non-pcm formats
  const generateAudioUrl = async (audioBlob: Blob) => {
    const audioUrl = audioBlob.size > 0 ? URL.createObjectURL(audioBlob) : '';
    return {
      url: audioUrl,
      type: audioBlob.type
    };
  };

  const isPCMFormat = (audioBlob: Blob) => {
    return (
      audioBlob.type === 'audio/pcm' ||
      audioBlob.type === 'application/octet-stream'
    );
  };

  const generate = useCallback(
    async (ttsParams: TTSParams) => {
      try {
        setLoading(true);
        setError(null);

        // Abort previous request if exists
        controllerRef.current?.abort();
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        const res: any = await textToSpeech({
          data: ttsParams,
          signal
        });

        if ((res?.status_code && res?.status_code !== 200) || res?.error) {
          const errorMessage = extractErrorMessage(res);
          setError({
            error: true,
            errorMessage
          });
          params?.onError?.(errorMessage);
          return null;
        }

        let result = {
          url: '',
          type: ''
        };

        if (res.audioBlob?.type?.indexOf('audio') === -1) {
          result = {
            url: '',
            type: ''
          };
        } else if (
          ttsParams.response_format === 'pcm' ||
          isPCMFormat(res.audioBlob)
        ) {
          result = await convertPCMToWav(res.audioBlob);
        } else {
          result = await generateAudioUrl(res.audioBlob);
        }

        params?.onSuccess?.(result);
        return res;
      } catch (err: any) {
        const res = err?.response?.data;
        if (res?.error) {
          const errorMessage = extractErrorMessage(res);
          setError({
            error: true,
            errorMessage
          });
          params?.onError?.(errorMessage);
        }
        return null;
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
    error
  };
};
