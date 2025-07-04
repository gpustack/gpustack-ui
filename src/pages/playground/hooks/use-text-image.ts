import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { extractErrorMessage, promptList } from '@/pages/playground/config';
import {
  fetchChunkedData,
  fetchChunkedDataPostFormData,
  readLargeStreamData as readStreamData
} from '@/utils/fetch-chunk-data';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { CREAT_IMAGE_API, EDIT_IMAGE_API } from '../apis';

const ODD_STRING = 'AAAABJRU5ErkJgg===';

export default function useTextImage(props: any) {
  const intl = useIntl();
  const { scroller, paramsRef, chunkFields, API } = props;
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [imageList, setImageList] = useState<
    {
      dataUrl: string;
      height: number | string;
      width: string | number;
      maxHeight: string | number;
      maxWidth: string | number;
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
  const streamReaderRef = useRef<any>(null);
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

  const removeBase64Suffix = (str: string, suffix: string) => {
    return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
  };

  const setImageSize = (parameters: any) => {
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
  };

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
  };

  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const stopDebounce = _.debounce(() => {
    setImageList([]);
    setLoading(false);
  }, 200);

  const submitMessage = async (parameters: any) => {
    try {
      if (!parameters.model) return;

      requestToken.current?.abort?.('cancel');
      requestToken.current = new AbortController();
      const currentRequestId = updateRequestId();
      const size: any = setImageSize(parameters);
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      const imgSize = _.split(parameters.size, 'x').map((item: string) =>
        _.toNumber(item)
      );

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

      let result: any = {};
      if (API === CREAT_IMAGE_API) {
        result = await fetchChunkedData({
          data: parameters,
          url: `${API}?t=${Date.now()}`,
          signal: requestToken.current.signal
        });
      }

      if (API === EDIT_IMAGE_API) {
        result = await fetchChunkedDataPostFormData({
          data: parameters,
          url: `${API}?t=${Date.now()}`,
          signal: requestToken.current.signal
        });
      }

      if (result.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(result)
        });
        setImageList([]);
        return;
      }
      console.log('result:', result);
      const { reader, decoder } = result;
      streamReaderRef.current = reader;
      await readStreamData(reader, decoder, (chunk: any, done?: boolean) => {
        console.log('chunk done:', chunk, done);
        if (requestIdRef.current !== currentRequestId) {
          // If the request ID has changed, ignore this chunk
          return;
        }
        if (chunk?.error) {
          setTokenResult({
            error: true,
            errorMessage: extractErrorMessage(chunk)
          });
          return;
        }
        chunk?.data?.forEach((item: any) => {
          const imgItem = newImageList[item.index];
          if (item.b64_json && _.get(parameters, chunkFields)) {
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
            loading: _.get(parameters, chunkFields) ? progress < 100 : false,
            preview: API === CREAT_IMAGE_API ? progress >= 100 : false,
            progress: progress
          };
        });
        if (
          done &&
          !chunk?.error &&
          newImageList.some((item) => item.progress < 100)
        ) {
          setTokenResult({
            error: true,
            errorMessage: intl.formatMessage({
              id: 'playground.image.generate.error'
            })
          });
        }
        setImageList([...newImageList]);
      });
    } catch (error) {
      console.log('error:', error);
      updateRequestId();
      stopDebounce();
      requestToken.current?.abort?.('cancel');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImageList([]);
    setTokenResult(null);
    setCurrentPrompt('');
  };

  const handleStopConversation = () => {
    requestToken.current?.abort?.('stop');
  };

  useEffect(() => {
    return () => {
      requestToken.current?.abort?.('cancel');
    };
  }, []);

  return {
    loading,
    tokenResult,
    imageList,
    promptList,
    currentPrompt,
    setImageList,
    setTokenResult,
    setCurrentPrompt,
    handleStopConversation,
    generateNumber,
    handleClear,
    submitMessage
  };
}
