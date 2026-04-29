import axios from 'axios';
import { useCallback, useRef, useState } from 'react';
import { speechToText } from '../../apis';
import { extractErrorMessage } from '../../config';

interface UseNonStreamSTTParams {
  onSuccess?: (result: { text: string }) => void;
  onError?: (error: any) => void;
}

interface STTParams {
  model: string;
  language?: string;
  file: File;
  [key: string]: any;
}

export const useNonStreamSTT = (params?: UseNonStreamSTTParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const cancelTokenRef = useRef<any>(null);

  const generate = useCallback(
    async (sttParams: STTParams, cancelToken?: any) => {
      try {
        setLoading(true);
        setError(null);

        cancelTokenRef.current = cancelToken;

        const result: any = await speechToText(
          {
            data: sttParams
          },
          {
            cancelToken
          }
        );

        if (
          (result?.status_code && result?.status_code !== 200) ||
          result?.error
        ) {
          const errorMessage = extractErrorMessage(result);
          setError({
            error: true,
            errorMessage
          });
          params?.onError?.(errorMessage);
          return null;
        }

        params?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        if (axios.isCancel(err)) {
          return null;
        }
        const res = err?.response?.data;
        const errorMessage =
          res?.error || (res?.status_code && res?.status_code !== 200)
            ? extractErrorMessage(res)
            : err?.response?.statusText || err?.message || 'Request failed';
        setError({
          error: true,
          errorMessage
        });
        params?.onError?.(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  return {
    generate,
    loading,
    error
  };
};
