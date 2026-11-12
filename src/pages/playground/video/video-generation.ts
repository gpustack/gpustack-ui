import { createVideo, getVideo, getVideoContent } from '../apis';
import { createVideoPollingController } from './video-polling';

export async function generateVideo(
  parameters: Record<string, unknown>,
  signal: AbortSignal,
  onProgress: (progress: number | undefined) => void,
  polling = createVideoPollingController()
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
    await polling.waitForPoll(signal);
    await polling.waitUntilActive(signal);
    signal.throwIfAborted();
    job = await getVideo(id, signal);
  }

  await polling.waitUntilActive(signal);
  signal.throwIfAborted();
  return getVideoContent(id, signal);
}
