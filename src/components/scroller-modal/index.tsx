import OverlayScroller from '@/components/overlay-scroller';
import useBodyScroll from '@/hooks/use-body-scroll';
import { Modal, type ModalProps } from 'antd';
import React from 'react';

const ScrollerModal = (props: ModalProps & { maxContentHeight?: number }) => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();

  React.useEffect(() => {
    if (props.open) {
      saveScrollHeight();
    } else {
      restoreScrollHeight();
    }
  }, [props.open]);

  return (
    <Modal
      {...props}
      styles={{
        content: {
          padding: 0
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0'
        },
        footer: {
          padding: '12px 24px 24px',
          margin: '0'
        }
      }}
    >
      <OverlayScroller
        style={{ paddingInline: 24, paddingBlockEnd: props.footer ? 0 : 32 }}
        maxHeight={props.maxContentHeight || 500}
      >
        {props.children}
      </OverlayScroller>
    </Modal>
  );
};

export default ScrollerModal;
