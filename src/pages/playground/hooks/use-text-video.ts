import { setRouteCache } from '@/atoms/route-cache';
import routeCachekey from '@/config/route-cachekey';
import { readResponseError } from '@/utils/download-stream';
import { useOverlayScroller } from '@gpustack/core-ui';
import { useLocation } from '@umijs/max';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { extractErrorMessage } from '../config';
import { generateVideo } from '../video/video-generation';
import { createVideoPollingController } from '../video/video-polling';

export default function useTextVideo(scroller: RefObject<HTMLDivElement>) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [progress, setProgress] = useState<number>();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const [polling] = useState(createVideoPollingController);
  const { pathname } = useLocation();
  const { initialize } = useOverlayScroller();

  const setGenerating = (running: boolean) => {
    setLoading(running);
    setRouteCache(routeCachekey['/playground/video'], running);
  };

  useEffect(() => {
    const updateActivity = () => {
      polling.setActive(
        pathname.replace(/\/+$/, '').toLowerCase() ===
          routeCachekey['/playground/video'] && !document.hidden
      );
    };
    updateActivity();
    document.addEventListener('visibilitychange', updateActivity);
    return () =>
      document.removeEventListener('visibilitychange', updateActivity);
  }, [pathname, polling]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize, scroller]);

  useEffect(
    () => () => {
      requestRef.current?.abort();
      requestRef.current = null;
      setRouteCache(routeCachekey['/playground/video'], false);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const submitMessage = async (parameters: Record<string, unknown>) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setGenerating(true);
    setErrorMessage('');
    setVideoUrl('');
    setProgress(undefined);

    try {
      const video = await generateVideo(
        parameters,
        controller.signal,
        (value) => {
          if (!controller.signal.aborted) setProgress(value);
        },
        polling
      );
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
        setGenerating(false);
      }
    }
  };

  const handleStopConversation = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setGenerating(false);
    setProgress(undefined);
  };

  const handleClear = () => {
    handleStopConversation();
    setVideoUrl('');
    setErrorMessage('');
    setCurrentPrompt('');
  };

  return {
    loading,
    progress,
    errorMessage,
    videoUrl,
    currentPrompt,
    setCurrentPrompt,
    handleStopConversation,
    handleClear,
    submitMessage
  };
}
