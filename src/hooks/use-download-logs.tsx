import { HandlerOptions } from '@/hooks/use-chunk-fetch';
import useDownloadStream from '@/hooks/use-download-stream';
import { useIntl } from '@umijs/max';
import { Progress, notification } from 'antd';
import dayjs from 'dayjs';

const renderMessage = (title: string) => {
  return (
    <div
      style={{
        width: 280,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
    >
      {title}
    </div>
  );
};

const createFileName = (name: string) => {
  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  const fileName = `${name}_${timestamp}.txt`;
  return fileName;
};

const useDownloadLogs = () => {
  const { downloadStream } = useDownloadStream();
  const intl = useIntl();
  const [api, contextHolder] = notification.useNotification({
    stack: { threshold: 1 }
  });

  const downloadNotification = (
    data: HandlerOptions & {
      filename: string;
      duration?: number;
      chunkRequestRef: any;
    }
  ) => {
    api.open({
      duration: data.duration,
      message: renderMessage(data.filename),
      key: data.filename,
      closeIcon: (
        <span>{intl.formatMessage({ id: 'common.button.cancel' })}</span>
      ),
      description: <Progress percent={data.percent} size="small"></Progress>,
      onClose() {
        data.chunkRequestRef?.current?.abort();
        notification.destroy?.(data.filename);
      }
    });
  };

  const handleDownloadLog = async (params: { url: string; name: string }) => {
    downloadStream({
      url: params.url,
      filename: createFileName(params.name),
      downloadNotification
    });
  };

  return {
    onDownloadLog: handleDownloadLog,
    contextHolder
  };
};

export default useDownloadLogs;
