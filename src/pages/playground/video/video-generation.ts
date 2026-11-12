import { createVideo, getVideo, getVideoContent } from '../apis';

const waitForPoll = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const handleAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, 2000);
    signal.addEventListener('abort', handleAbort, { once: true });
  });

export async function generateVideo(
  parameters: Record<string, unknown>,
  signal: AbortSignal,
  onProgress: (progress: number | undefined) => void
) {
  let job = await createVideo({ data: parameters, signal });
  signal.throwIfAborted();
  if (!job.id) throw new Error('Video generation did not return a task ID');
  const id = job.id;

  while (true) {
    signal.throwIfAborted();
    if (job.id !== id) throw new Error('Video task ID changed unexpectedly');
    onProgress(
      typeof job.progress === 'number' && Number.isFinite(job.progress)
        ? Math.max(0, Math.min(100, Math.round(job.progress)))
        : undefined
    );
    if (job.status === 'completed') break;
    if (job.status !== 'queued' && job.status !== 'in_progress') {
      const message =
        typeof job.error === 'string' ? job.error : job.error?.message;
      throw new Error(message || `Video generation ${job.status || 'failed'}`);
    }
    await waitForPoll(signal);
    signal.throwIfAborted();
    job = await getVideo(id, signal);
  }

  signal.throwIfAborted();
  return getVideoContent(id, signal);
}
