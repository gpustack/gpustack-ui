import LogsViewer from '@/components/logs-viewer/virtual-log-list';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { MODELS_API } from '../apis';
import { InstanceRealtimeLogStatus } from '../config';

type ViewModalProps = {
  open: boolean;
  url: string;
  id?: number | string;
  modelId?: number | string;
  tail?: number;
  onCancel: () => void;
};

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const viewportHeight = window.innerHeight;
  const intl = useIntl();
  const { setChunkRequest } = useSetChunkRequest();
  const { open, url, onCancel, tail } = props || {};
  const [modalSize] = useState<any>({
    width: '100%',
    height: viewportHeight - 86
  });
  const [enableScorllLoad, setEnableScorllLoad] = useState(true);
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
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={true}
      styles={{
        content: {
          borderRadius: 0
        }
      }}
      width={modalSize.width}
      footer={null}
    >
      <div className="viewer-wrapper" ref={contentRef}>
        <LogsViewer
          ref={logsViewerRef}
          height={modalSize.height}
          diffHeight={93}
          url={url}
          tail={tail}
          enableScorllLoad={enableScorllLoad}
          params={{
            follow: true
          }}
        ></LogsViewer>
      </div>
    </Modal>
  );
};

export default React.memo(ViewCodeModal);
