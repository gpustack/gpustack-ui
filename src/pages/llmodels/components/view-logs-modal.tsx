import LogsViewer from '@/components/logs-viewer';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';

type ViewModalProps = {
  open: boolean;
  url: string;
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
        height: size.height === 420 ? 'calc(100vh - 100px)' : 420
      };
    });
  };

  useEffect(() => {
    if (open) {
      isFullScreenRef.current = false;
      setModalSize({
        width: '100%',
        height: 'calc(100vh - 100px)'
      });
    }
  }, [open]);

  return (
    <Modal
      title={
        <span className="flex flex-center">
          <span> {intl.formatMessage({ id: 'common.button.viewlog' })}</span>
          {/* <Button size="middle" type="text" onClick={handleFullscreenToggle}>
            {isFullScreenRef.current ? (
              <FullscreenExitOutlined />
            ) : (
              <FullscreenOutlined />
            )}
          </Button> */}
        </span>
      }
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={true}
      width={modalSize.width}
      footer={null}
    >
      <LogsViewer
        height={modalSize.height}
        url={url}
        params={{
          follow: true
        }}
      ></LogsViewer>
    </Modal>
  );
};

export default React.memo(ViewCodeModal);
