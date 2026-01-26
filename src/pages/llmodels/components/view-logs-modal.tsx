import LogsViewer from '@/components/logs-viewer/virtual-log-list';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { MODELS_API } from '../apis';
import { InstanceRealtimeLogStatus, InstanceStatusMap } from '../config';

type ViewModalProps = {
  open: boolean;
  url: string;
  id?: number | string;
  modelId?: number | string;
  tail?: number;
  status?: string;
  onCancel: () => void;
};

const ViewLogsModal: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();
  const { setChunkRequest } = useSetChunkRequest();
  const { open, url, onCancel, tail, status } = props || {};
  const [enableScorllLoad, setEnableScorllLoad] = useState(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(
    status === InstanceStatusMap.Downloading
  );
  const logsViewerRef = React.useRef<any>(null);
  const requestRef = React.useRef<any>(null);
  const contentRef = React.useRef<any>(null);

  const handleCancel = useCallback(() => {
    logsViewerRef.current?.abort();
    onCancel();
  }, [onCancel]);

  const updateHandler = (list: any) => {
    const data = list?.find((item: any) => item.data?.id === props.id);
    // state in InstanceRealtimeLogStatus will not enable scorll load, because it is in the trasisition state

    if (data) {
      setIsDownloading(data?.data?.state === InstanceStatusMap.Downloading);
      setEnableScorllLoad(
        () => !InstanceRealtimeLogStatus.includes(data?.data?.state)
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (contentRef.current) {
          const range = document.createRange();
          range.selectNodeContents(contentRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!props.id) return;
    if (open) {
      requestRef.current?.current?.cancel?.();
      requestRef.current = setChunkRequest({
        url: `${MODELS_API}/${props.modelId}/instances`,
        handler: updateHandler
      });
    } else {
      logsViewerRef.current?.abort();
      requestRef.current?.current?.cancel?.();
    }

    return () => {
      logsViewerRef.current?.abort();
      requestRef.current?.current?.cancel?.();
    };
  }, [props.id, open]);

  return (
    <Modal
      title={
        <span className="flex flex-center">
          <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
            {' '}
            {intl.formatMessage({ id: 'common.button.viewlog' })}
          </span>
        </span>
      }
      zIndex={3000}
      open={open}
      centered={true}
      onCancel={handleCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={true}
      styles={{
        wrapper: {
          borderRadius: 0
        }
      }}
      width="100%"
      footer={null}
    >
      <div className="viewer-wrapper" ref={contentRef}>
        <LogsViewer
          ref={logsViewerRef}
          diffHeight={78}
          url={url}
          tail={tail}
          enableScorllLoad={enableScorllLoad}
          isDownloading={isDownloading}
          params={{
            follow: true
          }}
        ></LogsViewer>
      </div>
    </Modal>
  );
};

export default ViewLogsModal;
