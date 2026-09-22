import { convertFileSize } from '@/utils';
import {
  downloadFile,
  filenameFromDisposition,
  readResponseError
} from '@/utils/download-stream';
import { useIntl } from '@umijs/max';
import { App } from 'antd';
import { downloadModelInstanceLogs } from '../apis';
import { ModelInstanceListItem as ListItem } from '../config/types';

// A ProgressEvent fires every few milliseconds; reopening the notification on
// every one of them is a re-render per tick for no readable gain.
const PROGRESS_INTERVAL = 300;

/**
 * Instances currently downloading, app-wide — deliberately not a ref.
 *
 * ActionsCell renders per table row, so a ref would reset whenever a row
 * unmounts and remounts (pagination, collapsing an expanded row). A second
 * download started that way would collide with the first on the notification
 * key below: it would overwrite the first's progress, and whichever finished
 * first would `destroy` the survivor's still-live notification. The guard has
 * to live in the same scope as the key it protects.
 */
const inFlight = new Set<number | string>();

const useDownloadInstanceLogs = () => {
  const intl = useIntl();
  // Not notification.useNotification(): ActionsCell renders per table row, so a
  // per-row contextHolder unmounts with its row — collapsing an expanded row or
  // a list re-key would take the in-flight download's notification with it.
  // <App component={false}> in layouts/index.tsx holds this one app-wide.
  const { notification } = App.useApp();

  const downloadLogs = async (record: ListItem) => {
    // Checked and set synchronously, so two clicks in the same tick can't both
    // get through the way a state flag would.
    if (inFlight.has(record.id)) return;
    inFlight.add(record.id);

    // Keyed by instance, not by filename: the filename only arrives with the
    // response headers, so it cannot identify the notification that precedes it.
    const key = `instance-logs-${record.id}`;
    const controller = new AbortController();
    let lastTick = 0;

    // A percentage needs a length, and the server can only state one when the
    // log it is about to send cannot change under it; a multi-worker zip or a
    // capped log has no such length, and then bytes so far is all there is.
    const openProgress = (loaded: number, total?: number) => {
      const progress = total
        ? intl.formatMessage(
            { id: 'models.instance.logs.downloadingPercent' },
            { percent: Math.min(100, Math.floor((loaded / total) * 100)) }
          )
        : intl.formatMessage(
            { id: 'models.instance.logs.downloading' },
            { size: convertFileSize(loaded, 1, true) }
          );
      notification.open({
        key,
        // 0, not null: antd types duration as `number | false` and treats 0 as
        // "never auto-close", which is what a download in progress needs.
        duration: 0,
        // `title`, not `message`: antd 6 deprecated `message` in favour of it.
        title: record.name,
        description: progress.trim(),
        closeIcon: (
          <span>{intl.formatMessage({ id: 'common.button.cancel' })}</span>
        ),
        onClose: () => controller.abort()
      });
    };

    openProgress(0);

    try {
      const { data, headers } = await downloadModelInstanceLogs(record.id, {
        signal: controller.signal,
        onDownloadProgress: (event) => {
          const now = Date.now();
          if (now - lastTick < PROGRESS_INTERVAL) return;
          lastTick = now;
          openProgress(
            event.loaded,
            event.lengthComputable && event.total > 0 ? event.total : undefined
          );
        }
      });

      // The server owns the name, and with it the extension: .log for a single
      // stream, .logs.zip once several workers are involved. Only the fallback
      // has to guess, and it guesses from what the server actually sent.
      const filename =
        filenameFromDisposition(headers?.['content-disposition']) ||
        `${record.name || `instance-${record.id}`}${
          data.type?.includes('zip') ? '.logs.zip' : '.log'
        }`;

      notification.destroy(key);
      downloadFile(data, filename);
    } catch (error) {
      // Read the flag BEFORE destroying: rc-notification's `close(key)` fires
      // the notice's own `onClose`, so `destroy` would abort the controller and
      // make every failure look like a cancellation — swallowing the error.
      const cancelled = controller.signal.aborted;
      notification.destroy(key);
      // The user closed the notification. Not a failure — say nothing.
      if (cancelled) return;
      const detail = await readResponseError(error);
      notification.error({
        title: intl.formatMessage({ id: 'common.message.downloadFailed' }),
        description: detail || undefined
      });
    } finally {
      inFlight.delete(record.id);
    }
  };

  return { downloadLogs };
};

export default useDownloadInstanceLogs;
