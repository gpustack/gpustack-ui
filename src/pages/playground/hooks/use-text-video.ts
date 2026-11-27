import { readResponseError } from '@/utils/download-stream';
import { useOverlayScroller } from '@gpustack/core-ui';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  cancelVideo,
  createVideo,
  getVideo,
  getVideoContent,
  type VideoJob
} from '../apis';
import { extractErrorMessage } from '../config';
import {
  clearCurrentVideoTask,
  readCurrentVideoTask,
  writeCurrentVideoTask,
  type CurrentVideoTask
} from '../video/current-task-cache';
import {
  adaptVideoRequest,
  type VideoCapabilities
} from '../video/request-adapter';

const running = (job?: VideoJob) =>
  Boolean(job && ['queued', 'in_progress'].includes(job.status));
const statuses = [
  'queued',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
  'expired'
];

export default function useTextVideo(
  scroller: RefObject<HTMLDivElement>,
  userId?: string
) {
  const [state, setState] = useState({
    restoring: true,
    submitting: false,
    loading: false,
    cancelling: false,
    errorMessage: '',
    statusQueryFailed: false,
    contentError: null as { message?: string } | null,
    cacheError: false,
    hasCachedTask: false,
    videoUrl: ''
  });
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentJob, setCurrentJob] = useState<VideoJob>();
  const [restoredParameters, setRestoredParameters] =
    useState<Record<string, unknown>>();
  const record = useRef<CurrentVideoTask>();
  const job = useRef<VideoJob>();
  const creation = useRef<AbortController>();
  const query = useRef<AbortController>();
  const download = useRef<AbortController>();
  const cancellation = useRef<AbortController>();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const url = useRef('');
  const blob = useRef<Blob>();
  const alive = useRef(false);
  const active = useRef(false);
  const restoring = useRef(true);
  const storageQueue = useRef(Promise.resolve());
  const { initialize } = useOverlayScroller();

  const persist = useMemoizedFn(
    (task?: CurrentVideoTask, expectedId?: string) => {
      if (!userId) return;
      storageQueue.current = storageQueue.current.then(async () => {
        try {
          let hasCachedTask = Boolean(task);
          if (task) {
            await writeCurrentVideoTask(userId, task);
          } else {
            const cached = expectedId
              ? await readCurrentVideoTask(userId)
              : undefined;
            if (!expectedId || cached?.video_id === expectedId)
              await clearCurrentVideoTask(userId);
            else hasCachedTask = Boolean(cached);
          }
          if (alive.current)
            setState((s) => ({ ...s, cacheError: false, hasCachedTask }));
        } catch {
          if (alive.current) setState((s) => ({ ...s, cacheError: true }));
        }
      });
      return storageQueue.current;
    }
  );
  const releaseVideo = useMemoizedFn(() => {
    download.current?.abort();
    download.current = undefined;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = '';
    blob.current = undefined;
  });
  const updateJob = useMemoizedFn((value?: VideoJob) => {
    job.current = value;
    setCurrentJob(value);
  });
  const readError = async (error: unknown) =>
    extractErrorMessage((await readResponseError(error)) || error);

  const loadContent = useMemoizedFn(async (silent = false) => {
    const current = job.current;
    if (
      !active.current ||
      current?.status !== 'completed' ||
      download.current ||
      blob.current
    )
      return;
    const controller = new AbortController();
    download.current = controller;
    setState((s) => ({ ...s, loading: true, contentError: null }));
    try {
      const video = await getVideoContent(current.id, controller.signal);
      controller.signal.throwIfAborted();
      if (!alive.current || job.current?.id !== current.id) return;
      if (!video.size) throw new Error('Empty video response');
      url.current = URL.createObjectURL(video);
      blob.current = video;
      setState((s) => ({ ...s, videoUrl: url.current }));
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = silent ? undefined : await readError(error);
      if (alive.current && !controller.signal.aborted)
        setState((s) => ({ ...s, contentError: { message } }));
    } finally {
      if (download.current === controller) {
        download.current = undefined;
        if (alive.current) setState((s) => ({ ...s, loading: false }));
      }
    }
  });
  const refreshStatus = useMemoizedFn(async () => {
    const id = record.current?.video_id;
    if (
      !active.current ||
      !id ||
      creation.current ||
      query.current ||
      cancellation.current
    )
      return;
    const isRestoring = restoring.current;
    clearTimeout(timer.current);
    const controller = new AbortController();
    query.current = controller;
    let timedOut = false;
    const deadline = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 5000);
    let success = false;
    try {
      const result = await getVideo(id, controller.signal, 5000);
      controller.signal.throwIfAborted();
      if (!alive.current || record.current?.video_id !== id) return;
      if (result.id !== id || !statuses.includes(result.status))
        throw new Error('Invalid video status response');
      const params = record.current.params;
      updateJob(
        isRestoring && result.status === 'failed'
          ? undefined
          : {
              prompt: params.prompt as string,
              model: params.model as string,
              seconds: params.seconds as number | string,
              size: params.size as string,
              ...result,
              error: isRestoring ? undefined : result.error
            }
      );
      setState((s) => ({ ...s, errorMessage: '', statusQueryFailed: false }));
      success = true;
      if (result.status === 'completed') {
        if (isRestoring) {
          clearTimeout(deadline);
          await loadContent(true);
        } else {
          void loadContent();
        }
      }
    } catch (error) {
      if (controller.signal.aborted && !timedOut) return;
      let message = '';
      if (!isRestoring)
        message = timedOut
          ? 'Video status request timed out'
          : await readError(error);
      if (
        alive.current &&
        query.current === controller &&
        record.current?.video_id === id &&
        (!controller.signal.aborted || timedOut)
      ) {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (!success && status === 404) {
          resetCurrentTask(message, id);
        } else {
          setState((s) => ({
            ...s,
            errorMessage: message,
            statusQueryFailed: true
          }));
        }
      }
    } finally {
      clearTimeout(deadline);
      if (query.current === controller) {
        query.current = undefined;
        if (alive.current) {
          restoring.current = false;
          setState((s) => ({ ...s, restoring: false }));
          if (success && active.current && running(job.current))
            timer.current = setTimeout(() => void refreshStatus(), 5000);
        }
      }
    }
  });

  useEffect(() => {
    if (scroller.current) initialize(scroller.current);
  }, [initialize, scroller]);
  useEffect(() => {
    alive.current = true;
    let disposed = false;
    void (async () => {
      try {
        const saved = userId ? await readCurrentVideoTask(userId) : undefined;
        if (disposed) return;
        record.current = saved;
        if (saved) {
          setState((s) => ({ ...s, hasCachedTask: true }));
          setRestoredParameters(saved.params);
          setCurrentPrompt(
            typeof saved.params.prompt === 'string' ? saved.params.prompt : ''
          );
          updateJob({
            id: saved.video_id,
            status: 'queued',
            prompt: saved.params.prompt as string
          });
          if (active.current) void refreshStatus();
        }
      } catch {
        if (!disposed) setState((s) => ({ ...s, cacheError: true }));
      } finally {
        if (!disposed && !record.current) {
          restoring.current = false;
          setState((s) => ({ ...s, restoring: false }));
        }
      }
    })();
    return () => {
      disposed = true;
      alive.current = false;
      clearTimeout(timer.current);
      creation.current?.abort();
      query.current?.abort();
      cancellation.current?.abort();
      releaseVideo();
    };
  }, [userId]);
  useEffect(() => {
    const visibility = () => {
      active.current = !document.hidden;
      if (!active.current) {
        clearTimeout(timer.current);
        query.current?.abort();
        query.current = undefined;
        download.current?.abort();
        download.current = undefined;
        setState((s) => ({ ...s, loading: false }));
      } else if (record.current) void refreshStatus();
    };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  const submitMessage = async (
    params: Record<string, unknown>,
    videoCapabilities?: VideoCapabilities
  ) => {
    if (
      !userId ||
      restoring.current ||
      creation.current ||
      cancellation.current ||
      (running(job.current) && !state.statusQueryFailed)
    )
      return;
    const controller = new AbortController();
    creation.current = controller;
    clearTimeout(timer.current);
    query.current?.abort();
    query.current = undefined;
    setState((s) => ({ ...s, submitting: true, errorMessage: '' }));
    try {
      const requestData = await adaptVideoRequest(params, videoCapabilities);
      controller.signal.throwIfAborted();
      const result = await createVideo({
        data: requestData,
        signal: controller.signal
      });
      controller.signal.throwIfAborted();
      if (!alive.current) return;
      if (!result.id || !statuses.includes(result.status))
        throw new Error('Invalid video creation response');
      releaseVideo();
      record.current = { video_id: result.id, params };
      persist(record.current);
      updateJob({
        prompt: params.prompt as string,
        model: params.model as string,
        seconds: params.seconds as number | string,
        size: params.size as string,
        ...result
      });
      setState((s) => ({
        ...s,
        videoUrl: '',
        contentError: null,
        loading: false,
        statusQueryFailed: false
      }));
      if (running(result) && active.current)
        timer.current = setTimeout(() => void refreshStatus(), 5000);
      if (result.status === 'completed') void loadContent();
      return result;
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = await readError(error);
        if (alive.current && !controller.signal.aborted)
          setState((s) => ({ ...s, errorMessage: message }));
      }
    } finally {
      if (creation.current === controller) {
        creation.current = undefined;
        if (alive.current) setState((s) => ({ ...s, submitting: false }));
      }
    }
    return undefined;
  };
  const resetCurrentTask = (
    errorMessage = '',
    expectedId = record.current?.video_id
  ) => {
    clearTimeout(timer.current);
    query.current?.abort();
    query.current = undefined;
    releaseVideo();
    record.current = undefined;
    if (expectedId) persist(undefined, expectedId);
    updateJob(undefined);
    restoring.current = false;
    setState((s) => ({
      ...s,
      restoring: false,
      submitting: false,
      videoUrl: '',
      loading: false,
      contentError: null,
      errorMessage,
      statusQueryFailed: false
    }));
  };
  const handleClearCache = () => persist();
  const handleCancel = async () => {
    if (creation.current) {
      creation.current.abort();
      creation.current = undefined;
      resetCurrentTask();
      return;
    }
    const current = job.current;
    if (!running(current) || cancellation.current || !current) return;
    clearTimeout(timer.current);
    query.current?.abort();
    query.current = undefined;
    const controller = new AbortController();
    cancellation.current = controller;
    setState((s) => ({ ...s, cancelling: true, errorMessage: '' }));
    try {
      const result = await cancelVideo(current.id, controller.signal);
      controller.signal.throwIfAborted();
      if (
        result.id !== current.id ||
        (result.deleted !== true && result.status !== 'deleted')
      )
        throw new Error('Video cancellation was not confirmed');
      resetCurrentTask();
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = await readError(error);
        if (alive.current && !controller.signal.aborted)
          setState((s) => ({ ...s, errorMessage: message }));
      }
    } finally {
      if (cancellation.current === controller) {
        cancellation.current = undefined;
        if (alive.current) setState((s) => ({ ...s, cancelling: false }));
      }
    }
  };
  return {
    ...state,
    currentPrompt,
    currentJob,
    restoredParameters,
    generating:
      !state.restoring && running(currentJob) && !state.statusQueryFailed,
    setCurrentPrompt,
    submitMessage,
    handleClearCache,
    handleCancel,
    handleRetryContent: () => loadContent(),
    handlePlaybackError: (message: string) => {
      releaseVideo();
      setState((s) => ({ ...s, videoUrl: '', contentError: { message } }));
    }
  };
}
