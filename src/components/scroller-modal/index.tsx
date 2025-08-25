import useBodyScroll from '@/hooks/use-body-scroll';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { Modal, type ModalProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div<{ $maxHeight?: number }>`
  max-height: ${({ $maxHeight }) =>
    typeof $maxHeight === 'number' ? `${$maxHeight}px` : $maxHeight};
  overflow-y: auto;
  width: 100%;
`;

const ScrollerModal = (props: ModalProps & { maxContentHeight?: number }) => {
  const scroller = React.useRef<any>(null);
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const { initialize, destroyInstance } = useOverlayScroller();

  React.useEffect(() => {
    if (props.open) {
      saveScrollHeight();
    } else {
      restoreScrollHeight();
    }
  }, [props.open]);

  // init scroller, delay to ensure modal is fully open
  React.useEffect(() => {
    let timeout = null;
    if (props.open) {
      timeout = setTimeout(() => {
        if (scroller.current) {
          initialize(scroller.current);
        }
      }, 100);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      destroyInstance();
    };
  }, [props.open, initialize]);

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
        footer: props.footer
          ? {
              padding: '12px 24px 24px',
              margin: '0'
            }
          : {}
      }}
    >
      <Wrapper
        ref={scroller}
        data-overlayscrollbars-initialize
        className="overlay-scroller-wrapper"
        $maxHeight={props.maxContentHeight || 500}
        hidden={false}
        style={{ paddingInline: 24, paddingBlockEnd: props.footer ? 0 : 24 }}
      >
        {props.children}
      </Wrapper>
    </Modal>
  );
};

export default ScrollerModal;
