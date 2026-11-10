import { readResponseError } from '@/utils/download-stream';
import { useOverlayScroller } from '@gpustack/core-ui';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { createVideo } from '../apis';
import { extractErrorMessage } from '../config';

export default function useTextVideo(scroller: RefObject<HTMLDivElement>) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const { initialize } = useOverlayScroller();

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize, scroller]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const submitMessage = async (parameters: Record<string, unknown>) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setErrorMessage('');
    setVideoUrl('');

    try {
      const video = await createVideo({
        data: parameters,
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      if (!video.size) throw new Error('Empty video response');

      setVideoUrl(URL.createObjectURL(video));
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = await readResponseError(error);
      if (controller.signal.aborted) return;
      setErrorMessage(extractErrorMessage(message || error));
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleStopConversation = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
  };

  const handleClear = () => {
    handleStopConversation();
    setVideoUrl('');
    setErrorMessage('');
    setCurrentPrompt('');
  };

  return {
    loading,
    errorMessage,
    videoUrl,
    currentPrompt,
    setCurrentPrompt,
    handleStopConversation,
    handleClear,
    submitMessage
  };
}
