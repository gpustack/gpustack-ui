import { LogsViewer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Modal } from 'antd';
import React, { useEffect, useMemo } from 'react';

type ViewModalProps = {
  open: boolean;
  url: string;
  tail?: number;
  status?: string;
  onCancel: () => void;
};

const ViewLogsModal: React.FC<ViewModalProps> = (props) => {
  console.log('ViewLogsModal props:', props);
  const intl = useIntl();
  const { open, onCancel, url, tail } = props || {};
  const logsViewerRef = React.useRef<any>(null);
  const requestRef = React.useRef<any>(null);
  const contentRef = React.useRef<any>(null);

  const handleCancel = useMemoizedFn(() => {
    logsViewerRef.current?.abort();
    onCancel();
  });

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

  const params = useMemo(() => {
    return {
      watchable: false,
      watch: false,
      tailLines: 1000,
      follow: true
    };
  }, []);

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
      mask={{
        closable: false
      }}
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
          tail={1000}
          enableScorllLoad={true}
          isDownloading={false}
          params={params}
        ></LogsViewer>
      </div>
    </Modal>
  );
};

export default ViewLogsModal;
