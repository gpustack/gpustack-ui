import { saveAs } from 'file-saver';

export const downloadFile = (blob: Blob, filename: string) => {
  saveAs(blob, filename);
};

/**
 * The filename a `Content-Disposition` header names (RFC 6266).
 *
 * `filename*` wins whenever it is present: that one carries the percent-encoded
 * UTF-8 original, while the plain `filename` beside it is only the ASCII form
 * the server degraded the name into. Reading the fallback first is exactly how a
 * non-ASCII name turns into mojibake.
 */
export const filenameFromDisposition = (
  disposition?: string | null
): string => {
  if (!disposition) return '';

  const extended = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // Malformed percent-encoding — fall through to the ASCII fallback.
    }
  }

  const plain = disposition.match(/filename\s*=\s*(?:"([^"]*)"|([^;]+))/i);
  return (plain?.[1] ?? plain?.[2] ?? '').trim();
};
