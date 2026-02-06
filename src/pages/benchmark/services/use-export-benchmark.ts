import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { downloadFile } from '@/utils/download-stream';
import { message } from 'antd';
import dayjs from 'dayjs';
import { EXPORT_BENCHMARK_LIST } from '../apis';

const matchFilename = (disposition: string | null): string | undefined => {
  if (!disposition) return '';

  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : '';
  return filename;
};

export function useExportBenchmark() {
  const exportData = async (data: any[], name?: string) => {
    const date = dayjs().format('YYYYMMDD_HHmmss');
    const fileName = `${name || 'benchmark'}_${date}`;
    try {
      const res = await fetch(
        `${GPUSTACK_API_BASE_URL}${EXPORT_BENCHMARK_LIST}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );
      // header
      const contentDispostion = res.headers.get('content-Disposition');
      const filename = matchFilename(contentDispostion) || `${fileName}.yml`;
      if (res.ok) {
        const blob = await res.blob();
        downloadFile(blob, filename);
      } else {
        message.error('Download failed');
      }
    } catch (error) {
      message.error('Download failed');
    }
  };

  return {
    exportData
  };
}
