import LogsViewer from '@/components/logs-viewer/index';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';

type ViewModalProps = {
  open: boolean;
  url: string;
  autoScroll?: boolean;
  onCancel: () => void;
};

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const { open, url, onCancel } = props || {};
  const [modalSize, setModalSize] = useState<any>({
    width: 600,
    height: 420
  });
  const isFullScreenRef = React.useRef(false);
  const intl = useIntl();
  const handleFullscreenToggle = () => {
    isFullScreenRef.current = !isFullScreenRef.current;
    setModalSize((size: any) => {
      return {
        width: size.width === 600 ? '100%' : 600,
        height: size.height === 420 ? 'calc(100vh - 86px)' : 420
      };
    });
  };

  useEffect(() => {
    if (open) {
      isFullScreenRef.current = false;
      setModalSize({
        width: '100%',
        height: 'calc(100vh - 86px)'
      });
    }
  }, [open]);

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
      open={open}
      centered={true}
      onCancel={onCancel}
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
      <LogsViewer
        height={modalSize.height}
        url={url}
        autoScroll={props.autoScroll}
        params={{
          follow: true
        }}
      ></LogsViewer>
    </Modal>
  );
};

export default React.memo(ViewCodeModal);
