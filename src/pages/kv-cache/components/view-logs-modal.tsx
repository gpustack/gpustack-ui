import { LogsViewer } from '@gpustack/core-ui';
import { useMemoizedFn } from 'ahooks';
import { Modal } from 'antd';
import React, { useEffect, useMemo } from 'react';

type ViewModalProps = {
  open: boolean;
  url: string;
  title: string;
  tail?: number;
  onCancel: () => void;
};

const ViewLogsModal: React.FC<ViewModalProps> = (props) => {
  const { open, url, title, tail, onCancel } = props;
  const logsViewerRef = React.useRef<any>(null);
  const contentRef = React.useRef<any>(null);

  const handleCancel = useMemoizedFn(() => {
    logsViewerRef.current?.abort();
    onCancel();
  });

  // ctrl/cmd + A selects only the log content while the modal is open
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
    if (!open) {
      logsViewerRef.current?.abort();
    }

    return () => {
      logsViewerRef.current?.abort();
    };
  }, [open]);

  const params = useMemo(() => {
    return {
      follow: true
    };
  }, []);

  return (
    <Modal
      title={
        <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{title}</span>
      }
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
          tail={tail}
          enableScorllLoad={true}
          isDownloading={false}
          params={params}
        ></LogsViewer>
      </div>
    </Modal>
  );
};

export default ViewLogsModal;
