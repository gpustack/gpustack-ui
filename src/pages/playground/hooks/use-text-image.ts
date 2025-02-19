import { CREAT_IMAGE_API } from '@/pages/playground/apis';
import { extractErrorMessage, promptList } from '@/pages/playground/config';
import { generateRandomNumber } from '@/utils';
import {
  fetchChunkedData,
  readLargeStreamData as readStreamData
} from '@/utils/fetch-chunk-data';
import _ from 'lodash';
import { useCallback, useRef, useState } from 'react';

const ODD_STRING = 'AAAABJRU5ErkJgg===';

export default function useTextImage() {
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [imageList, setImageList] = useState<any[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const messageId = useRef<number>(0);
  const requestToken = useRef<any>(null);

  const removeBase64Suffix = (str: string, suffix: string) => {
    return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
  };

  const setImageSize = useCallback((parameters: any) => {
    let size: Record<string, string | number> = {
      span: 12
    };
    if (parameters.n === 1) {
      size.span = 24;
    }
    if (parameters.n === 2) {
      size.span = 12;
    }
    if (parameters.n === 3) {
      size.span = 12;
    }
    if (parameters.n === 4) {
      size.span = 12;
    }
    return size;
  }, []);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
  };

  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const submitMessage = async (params: {
    current?: { content: string };
    system?: { role: string; content: string };
    parameters: any;
  }) => {
    const { current, parameters } = params;
    try {
      if (!parameters.model) return;
      const size: any = setImageSize(parameters);
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setCurrentPrompt(current?.content || '');

      const imgSize = [parameters.width, parameters.height];

      // preview
      let stream_options: Record<string, any> = {
        chunk_size: 16 * 1024,
        chunk_results: true
      };
      if (parameters.preview === 'preview') {
        stream_options = {
          preview: true
        };
      }

      if (parameters.preview === 'preview_faster') {
        stream_options = {
          preview_faster: true
        };
      }

      let newImageList = Array(parameters.n)
        .fill({})
        .map((item, index: number) => {
          return {
            dataUrl: 'data:image/png;base64,',
            ...size,
            progress: 0,
            height: imgSize[1],
            width: imgSize[0],
            loading: true,
            progressType: 'dashboard',
            preview: false,
            uid: setMessageId()
          };
        });
      setImageList(newImageList);

      requestToken.current?.abort?.();
      requestToken.current = new AbortController();

      const params = {
        ..._.omitBy(
          parameters,
          (value: string, key: string) =>
            !value || ['width', 'height', 'seed'].includes(key)
        ),
        size: `${imgSize[0]}x${imgSize[1]}`,
        seed: parameters.random_seed ? generateRandomNumber() : parameters.seed,
        stream: true,
        stream_options: {
          ...stream_options
        },
        prompt: current?.content
      };

      const result: any = await fetchChunkedData({
        data: params,
        url: `${CREAT_IMAGE_API}?t=${Date.now()}`,
        signal: requestToken.current.signal
      });
      if (result.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(result)
        });
        setImageList([]);
        return;
      }

      const { reader, decoder } = result;

      await readStreamData(reader, decoder, (chunk: any) => {
        if (chunk?.error) {
          setTokenResult({
            error: true,
            errorMessage: chunk?.error?.message || chunk?.message || ''
          });
          return;
        }
        chunk?.data?.forEach((item: any) => {
          const imgItem = newImageList[item.index];
          if (item.b64_json && stream_options.chunk_results) {
            imgItem.dataUrl += removeBase64Suffix(item.b64_json, ODD_STRING);
          } else if (item.b64_json) {
            imgItem.dataUrl = `data:image/png;base64,${removeBase64Suffix(item.b64_json, ODD_STRING)}`;
          }
          const progress = item.progress;

          newImageList[item.index] = {
            dataUrl: imgItem.dataUrl,
            height: imgSize[1],
            width: imgSize[0],
            maxHeight: `${imgSize[1]}px`,
            maxWidth: `${imgSize[0]}px`,
            uid: imgItem.uid,
            span: imgItem.span,
            loading: stream_options.chunk_results ? progress < 100 : false,
            preview: progress >= 100,
            progress: progress
          };
        });
        setImageList([...newImageList]);
      });
    } catch (error) {
      console.log('error:', error);
      requestToken.current?.abort?.();
      setImageList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessageId();
    setImageList([]);
    setTokenResult(null);
  };

  const handleStopConversation = () => {
    requestToken.current?.abort?.();
    setLoading(false);
  };

  return {
    loading,
    tokenResult,
    imageList,
    promptList,
    handleStopConversation,
    generateNumber,
    handleClear,
    submitMessage
  };
}
