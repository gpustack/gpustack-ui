import { extractErrorMessage, promptList } from '@/pages/playground/config';
import { useOverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import { CREAT_IMAGE_API, createImage, editImage } from '../apis';

export default function useTextImage(props: any) {
  const intl = useIntl();
  const { scroller, API, onLoadingChange } = props;
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [imageList, setImageList] = useState<any[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const messageId = useRef(0);
  const requestToken = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const { initialize } = useOverlayScroller();

  const updateLoading = useMemoizedFn((running: boolean) => {
    setLoading(running);
    onLoadingChange?.(running);
  });

  useEffect(() => {
    if (scroller.current) initialize(scroller.current);
  }, [initialize]);

  const handleStopConversation = () => {
    requestIdRef.current += 1;
    requestToken.current?.abort('stop');
    requestToken.current = null;
    setImageList((images) => images.filter((image) => !image.loading));
    updateLoading(false);
  };

  const submitMessage = async (parameters: any) => {
    if (!parameters.model) return;
    const requestId = ++requestIdRef.current;
    requestToken.current?.abort('cancel');
    const controller = new AbortController();
    requestToken.current = controller;
    const [width, height] = String(parameters.size || '')
      .split('x')
      .map(Number);
    const images = Array.from({ length: parameters.n || 1 }, () => ({
      dataUrl: 'data:image/png;base64,',
      height,
      width,
      span: parameters.n > 1 ? 12 : 24,
      loading: true,
      progress: 0,
      progressType: 'dashboard',
      preview: false,
      uid: ++messageId.current
    }));
    setImageList(images);
    setTokenResult(null);
    updateLoading(true);
    try {
      const request = API === CREAT_IMAGE_API ? createImage : editImage;
      const result = await request({
        data: parameters,
        signal: controller.signal
      });
      if (requestId !== requestIdRef.current) return;
      if (result?.error) throw new Error(extractErrorMessage(result));
      if (
        !result?.data?.length ||
        !result.data.every((item: any) => item.b64_json || item.url)
      ) {
        throw new Error(
          intl.formatMessage({ id: 'playground.image.generate.error' })
        );
      }
      setImageList(
        result.data.map((item: any, index: number) => ({
          ...images[index],
          uid: images[index]?.uid ?? ++messageId.current,
          dataUrl: item.b64_json
            ? `data:image/png;base64,${item.b64_json}`
            : item.url,
          height,
          width,
          span: result.data.length > 1 ? 12 : 24,
          maxHeight: `${height}px`,
          maxWidth: `${width}px`,
          loading: false,
          preview: true,
          progress: 100
        }))
      );
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setImageList([]);
      setTokenResult({ error: true, errorMessage: extractErrorMessage(error) });
    } finally {
      if (requestId === requestIdRef.current) {
        requestToken.current = null;
        updateLoading(false);
      }
    }
  };

  const handleClear = () => {
    handleStopConversation();
    setImageList([]);
    setTokenResult(null);
    setCurrentPrompt('');
  };

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      requestToken.current?.abort('cancel');
      onLoadingChange?.(false);
    },
    []
  );

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
    handleClear,
    submitMessage
  };
}
