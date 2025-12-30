import useBodyScroll from '@/hooks/use-body-scroll';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { Modal, type ModalProps } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { ScrollerContext } from './use-scroller-context';

const Wrapper = styled.div<{ $maxHeight?: number | string }>`
  max-height: ${({ $maxHeight }) =>
    typeof $maxHeight === 'number' ? `${$maxHeight}px` : $maxHeight};
  overflow-y: auto;
  width: 100%;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  max-width: 360px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const ScrollerModal = (
  props: ModalProps & { maxContentHeight?: number | string }
) => {
  const scroller = React.useRef<any>(null);
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const { initialize, destroyInstance, scrollToBottom } = useOverlayScroller();

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
      title={<Title>{props.title}</Title>}
      destroyOnHidden={true}
      styles={{
        container: {
          padding: 0
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0',
          paddingBlockEnd: props.footer ? '0' : '24px'
        },
        footer: props.footer
          ? {
              padding: '12px 24px 24px',
              margin: '0'
            }
          : {}
      }}
    >
      <ScrollerContext.Provider value={{ scrollToBottom }}>
        <Wrapper
          ref={scroller}
          data-overlayscrollbars-initialize
          className="overlay-scroller-wrapper"
          $maxHeight={props.maxContentHeight || 500}
          hidden={false}
          style={{ paddingInline: 24, paddingBlockEnd: 0 }}
        >
          {props.children}
        </Wrapper>
      </ScrollerContext.Provider>
    </Modal>
  );
};

export default ScrollerModal;
