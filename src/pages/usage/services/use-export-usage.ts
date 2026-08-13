import { downloadFile } from '@/utils/download-stream';
import { useIntl } from '@umijs/max';
import { App, message } from 'antd';
import React from 'react';
import {
  USAGE_BREAKDOWN_EXPORT,
  USAGE_BREAKDOWN_EXPORT_ESTIMATE,
  downloadUsageExport,
  queryUsageExportEstimate
} from '../apis';
import { XLSX_MAX_ROWS_PER_SHEET } from '../config';
import type {
  UsageExportErrorDetails,
  UsageExportEstimate,
  UsageExportRequest
} from '../config/types';

const FILENAME_PATTERN = /filename="?([^"]+)"?/;

const filenameFromDisposition = (disposition?: string | null): string => {
  const matched = disposition?.match(FILENAME_PATTERN);
  return matched ? matched[1] : '';
};

/**
 * Pull the error payload off a failed export.
 *
 * A blob-typed request makes the error body a Blob, which the global handler
 * cannot read — it would fall back to axios's own "Request failed with status
 * code 422". So the export endpoints set ``skipErrorHandler`` and this reads
 * the body instead. Both halves are returned: ``details`` drives the
 * localized, actionable message, and ``message`` is the server's own sentence,
 * used as the last resort so a kind we don't recognize still reaches the user
 * instead of failing silently.
 */
const readExportError = async (
  error: any
): Promise<{ details?: UsageExportErrorDetails; message?: string }> => {
  const body = error?.response?.data ?? error?.data;
  try {
    const text = body instanceof Blob ? await body.text() : undefined;
    const payload = text ? JSON.parse(text) : body;
    return { details: payload?.details, message: payload?.message };
  } catch {
    return {};
  }
};

/**
 * Turn a failed export into a sentence the user can act on.
 *
 * Every branch ends in a message. The previous shape had an "everything else"
 * arm that showed nothing, on the theory that the global interceptor had
 * already reported it — which is exactly backwards for a blob request. The
 * three split errors landed there and vanished.
 *
 * Unknown kinds fall back to the server's own ``message``, which is already a
 * complete sentence. Localized text is better where we have it, but silence
 * is never the right answer.
 */
const describeExportError = (
  intl: ReturnType<typeof useIntl>,
  details?: UsageExportErrorDetails,
  serverMessage?: string
): string => {
  switch (details?.kind) {
    case 'export_too_large':
      return intl.formatMessage(
        { id: 'usage.export.error.tooLarge' },
        {
          total: details.total,
          limit: details.limit,
          days:
            details.suggestions?.find((item) => item.action === 'shorten_range')
              ?.max_days ?? 0
        }
      );
    case 'export_split_too_many_parts':
      return intl.formatMessage(
        { id: 'usage.export.error.splitTooManyParts' },
        { total: details.total, limit: details.limit }
      );
    default:
      return (
        serverMessage || intl.formatMessage({ id: 'usage.export.error.failed' })
      );
  }
};

/**
 * Shared export driver for every Usage tab.
 *
 * The endpoints differ per tab (tokens / GPU instances / storage) but the
 * behaviour must not: same pre-flight sizing, same structured-error handling,
 * same server-owned filename. Passing the endpoints in keeps that one
 * implementation instead of three that drift.
 */
export default function useExportUsage(endpoints?: {
  exportUrl: string;
  estimateUrl: string;
}) {
  const intl = useIntl();
  // Not the static ``Modal`` import: that renders outside the app's
  // ConfigProvider, so the dialog ignores the dark algorithm and the locale
  // (an untranslated "Cancel" on a light dialog). ``App.useApp`` reads them
  // from context -- see the <App> bridge in layouts/index.tsx.
  const { modal } = App.useApp();
  const exportUrl = endpoints?.exportUrl ?? USAGE_BREAKDOWN_EXPORT;
  const estimateUrl = endpoints?.estimateUrl ?? USAGE_BREAKDOWN_EXPORT_ESTIMATE;
  const [estimate, setEstimate] = React.useState<UsageExportEstimate | null>(
    null
  );
  const [estimating, setEstimating] = React.useState(false);
  // The estimate defines the preview's columns, so its failure is not a
  // cosmetic gap: the table has nothing to render and would sit there showing
  // a lone row-number column. Silence was tolerable only while the global
  // handler still popped something; now that these endpoints skip it, the
  // dialog has to say so itself.
  const [estimateFailed, setEstimateFailed] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  // Which estimate request is the current one. The dialogs fire this from two
  // places at once — the open effect and the filter-change callback — with
  // DIFFERENT payloads, because on open the filters may still hold the
  // previous values. Without a sequence the slower (stale, narrower) response
  // lands last and wins, so the dialog shows an under-limit verdict for an
  // over-limit query: the Export button stays enabled and the remedies never
  // render. That is a wrong answer, not just a slow one.
  const requestSeq = React.useRef(0);

  /**
   * Size the export before offering it. Failures are swallowed on purpose:
   * an estimate that doesn't come back should leave the button usable rather
   * than block a download that may well succeed.
   */
  const fetchEstimate = async (payload: UsageExportRequest | any) => {
    const seq = ++requestSeq.current;
    setEstimating(true);
    setEstimateFailed(false);
    try {
      const result = (await queryUsageExportEstimate(
        estimateUrl,
        payload
      )) as UsageExportEstimate;
      // A superseded response still gets returned to its own caller (the
      // preflight path awaits the value it asked for), but must not become
      // the state the dialog renders.
      if (seq === requestSeq.current) {
        setEstimate(result);
      }
      return result;
    } catch {
      if (seq === requestSeq.current) {
        setEstimate(null);
        setEstimateFailed(true);
      }
      return null;
    } finally {
      if (seq === requestSeq.current) {
        setEstimating(false);
      }
    }
  };

  const resetEstimate = () => {
    // Bump too, so an in-flight response can't repopulate a closed dialog.
    requestSeq.current += 1;
    setEstimate(null);
    setEstimateFailed(false);
    // ...and clear the spinner the same way. That bump is exactly what stops
    // the in-flight request's own ``finally`` from clearing it (the sequence
    // no longer matches), so closing the dialog mid-estimate used to leave
    // ``estimating`` stuck true — and the remedy buttons disabled as "busy"
    // the next time it opened.
    setEstimating(false);
  };

  // ``exporting`` drives the button's disabled state, but state updates are
  // async: two clicks in the same tick both see it false and both fire a full
  // export. A ref flips synchronously, so the second click can't get through.
  // Greying out the button is the courtesy; this is the guarantee.
  const exportInFlight = React.useRef(false);

  const exportData = async (payload: UsageExportRequest | any) => {
    if (exportInFlight.current) {
      return false;
    }
    exportInFlight.current = true;
    setExporting(true);
    try {
      // No locale is sent: the exported header row is the machine contract,
      // identical in every language, so a consumer script never depends on
      // which language the operator happens to be using.
      const { data, headers } = await downloadUsageExport(exportUrl, payload);
      // The server owns the filename — and therefore the extension, which
      // varies with format and sheet count (.csv / .xlsx / .zip).
      // Only reached if Content-Disposition is unreadable. Derive the
      // extension from what the server said it would send: the request asks
      // for xlsx by default, so a hardcoded .csv handed the user an xlsx (or a
      // zip) under a name that opens as neither.
      const fallbackExt = payload.split
        ? 'zip'
        : estimate?.effective_format || payload.format || 'xlsx';
      const filename =
        filenameFromDisposition(headers?.['content-disposition']) ||
        `usage_${payload.start_date}_${payload.end_date}.${fallbackExt}`;
      downloadFile(data, filename);
      return true;
    } catch (error: any) {
      const { details, message: serverMessage } = await readExportError(error);
      message.error(describeExportError(intl, details, serverMessage));
      return false;
    } finally {
      exportInFlight.current = false;
      setExporting(false);
    }
  };

  /**
   * Size the export, then either refuse it, confirm it, or just run it.
   *
   * For the entry points that have no preview dialog, this is the only place
   * the user learns how big the export is. Without it the first signal of an
   * over-limit query is a failed download some seconds later — and a large
   * but legal one starts silently with no indication it will take a while.
   */
  const exportWithPreflight = async (payload: UsageExportRequest | any) => {
    const sized = await fetchEstimate(payload);
    // No estimate (the call failed) → don't block a download that may well
    // succeed; the export endpoint enforces the same limit anyway.
    if (!sized) {
      return exportData(payload);
    }
    // These entry points have no dialog to put a hint in, so an announced
    // format change has to be a message: a .csv arriving where a .xlsx was
    // expected breaks whatever the operator feeds it to.
    if (sized.effective_format && sized.effective_format !== 'xlsx') {
      message.info(
        intl.formatMessage(
          { id: 'usage.export.csvFallback' },
          { limit: XLSX_MAX_ROWS_PER_SHEET }
        )
      );
    }
    if (sized.exceeds_hard_limit) {
      // These entry points have no dialog to render remedies into, so the
      // one remedy that needs no filter editing — splitting — is offered
      // right here. No grouping is excluded from it (parts are row slices),
      // but the server withholds ``split_parts`` when the result would need
      // more files than one download may carry — so this stays a condition,
      // not a certainty. Offering it then would only earn a 422.
      if (sized.split_parts) {
        const splitConfirmed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: intl.formatMessage({ id: 'common.button.export' }),
            content: intl.formatMessage(
              { id: 'usage.export.rowsExceeded' },
              {
                total: sized.total,
                limit: sized.hard_limit,
                days: sized.suggested_max_days ?? 0
              }
            ),
            okText: intl.formatMessage(
              { id: 'usage.export.suggest.split' },
              { parts: sized.split_parts }
            ),
            onOk: () => resolve(true),
            onCancel: () => resolve(false)
          });
        });
        if (!splitConfirmed) {
          return false;
        }
        return exportData({ ...payload, split: 'auto' });
      }
      message.error(
        intl.formatMessage(
          { id: 'usage.export.error.tooLarge' },
          {
            total: sized.total,
            limit: sized.hard_limit,
            days: sized.suggested_max_days ?? 0
          }
        )
      );
      return false;
    }
    if (sized.exceeds_soft_limit) {
      const confirmed = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: intl.formatMessage({ id: 'common.button.export' }),
          content: intl.formatMessage(
            { id: 'usage.export.rowsSlow' },
            { total: sized.total }
          ),
          onOk: () => resolve(true),
          onCancel: () => resolve(false)
        });
      });
      if (!confirmed) {
        return false;
      }
    }
    return exportData(payload);
  };

  return {
    estimate,
    estimating,
    estimateFailed,
    exporting,
    fetchEstimate,
    resetEstimate,
    exportData,
    exportWithPreflight
  };
}
