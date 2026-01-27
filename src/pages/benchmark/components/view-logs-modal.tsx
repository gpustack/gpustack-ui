import LogsViewer from '@/components/logs-viewer/virtual-log-list';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { useCallback, useEffect } from 'react';

type ViewModalProps = {
  open: boolean;
  url: string;
  tail?: number;
  status?: string;
  onCancel: () => void;
};

const ViewLogsModal: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();
  const { open, onCancel, tail, url, status } = props || {};
  const logsViewerRef = React.useRef<any>(null);
  const requestRef = React.useRef<any>(null);
  const contentRef = React.useRef<any>(null);

  const handleCancel = useCallback(() => {
    logsViewerRef.current?.abort();
    onCancel();
  }, [onCancel]);

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
    if (!url) return;
    if (!open) {
      logsViewerRef.current?.abort();
      requestRef.current?.current?.cancel?.();
    }

    return () => {
      logsViewerRef.current?.abort();
      requestRef.current?.current?.cancel?.();
    };
  }, [url, open]);

  return (
    <Modal
      title={
        <span className="flex flex-center">
          <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
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
      <div ref={contentRef}>
        <LogsViewer
          ref={logsViewerRef}
          diffHeight={78}
          url={url}
          tail={undefined}
          enableScorllLoad={true}
          isDownloading={false}
          params={{
            follow: true
          }}
        ></LogsViewer>
      </div>
    </Modal>
  );
};

export default ViewLogsModal;
