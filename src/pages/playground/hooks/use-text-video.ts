import { createAxiosToken } from '@/hooks/use-chunk-request';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { extractErrorMessage, promptList } from '@/pages/playground/config';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { createVideo } from '../apis';

export default function useTextVideo(props: any) {
  const intl = useIntl();
  const { scroller, paramsRef } = props;
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [videoList, setVideoList] = useState<
    {
      dataUrl: string;
      uid: number;
      span?: number;
      loading?: boolean;
      progress?: number;
      preview?: boolean;
    }[]
  >([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const messageId = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const { initialize } = useOverlayScroller();
  const { initialize: innitializeParams } = useOverlayScroller();
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize]);
  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [innitializeParams]);

  const updateRequestId = () => {
    requestIdRef.current = requestIdRef.current + 1;
    return requestIdRef.current;
  };

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
  };

  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const stopDebounce = _.debounce(() => {
    setVideoList([]);
    setLoading(false);
  }, 200);

  const submitMessage = async (parameters: any) => {
    try {
      if (!parameters.model) return;

      requestToken.current?.cancel?.('cancel');
      requestToken.current = createAxiosToken();
      const currentRequestId = updateRequestId();
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      const newList = [
        {
          dataUrl: '',
          progress: 0,
          loading: true,
          preview: false,
          uid: setMessageId()
        }
      ];

      setVideoList(newList);

      const result = await createVideo({
        data: parameters,
        token: requestToken.current.token
      });

      console.log('result:', result);

      if (result.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(result)
        });
        setVideoList([]);
        return;
      }

      // If the request ID has changed, ignore this chunk
      if (requestIdRef.current !== currentRequestId) {
        return;
      }
      if (result?.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(result)
        });
        return;
      }

      newList[0] = {
        ...newList[0],
        dataUrl: result?.id,
        loading: false,
        progress: 100
      };

      console.log('newList:', newList);
      setVideoList([...newList]);
    } catch (error) {
      console.log('error:', error);
      updateRequestId();
      stopDebounce();
      requestToken.current?.cancel?.('cancel');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setVideoList([]);
    setTokenResult(null);
    setCurrentPrompt('');
  };

  const handleStopConversation = () => {
    requestToken.current?.cancel?.('stop');
  };

  useEffect(() => {
    return () => {
      requestToken.current?.cancel?.('cancel');
    };
  }, []);

  return {
    loading,
    tokenResult,
    videoList,
    promptList,
    currentPrompt,
    setVideoList,
    setTokenResult,
    setCurrentPrompt,
    handleStopConversation,
    generateNumber,
    handleClear,
    submitMessage
  };
}
