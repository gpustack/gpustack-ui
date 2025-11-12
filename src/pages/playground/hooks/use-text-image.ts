import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { extractErrorMessage, promptList } from '@/pages/playground/config';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import {
  CREAT_IMAGE_API,
  EDIT_IMAGE_API,
  createImage,
  editImage
} from '../apis';

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
        result = await createImage({
          data: parameters,
          signal: requestToken.current.signal
        });
      }

      if (API === EDIT_IMAGE_API) {
        result = await editImage({
          data: parameters,
          signal: requestToken.current.signal
        });
      }

      console.log('result:', result);

      if (result.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(result)
        });
        setImageList([]);
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

      result?.data?.forEach((item: any, index: number) => {
        const imgItem = newImageList[index];

        if (item.b64_json) {
          imgItem.dataUrl = `data:image/png;base64,${item.b64_json}`;
        }

        newImageList[index] = {
          dataUrl: imgItem.dataUrl,
          height: imgSize[1],
          width: imgSize[0],
          maxHeight: `${imgSize[1]}px`,
          maxWidth: `${imgSize[0]}px`,
          uid: imgItem.uid,
          span: imgItem.span,
          loading: false,
          preview: true,
          progress: 100
        };
      });
      console.log('newImageList:', newImageList);
      setImageList([...newImageList]);
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
