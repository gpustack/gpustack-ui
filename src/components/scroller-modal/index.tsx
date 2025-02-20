import useBodyScroll from '@/hooks/use-body-scroll';
import { Modal, type ModalProps } from 'antd';
import React from 'react';

const ScrollerModal = (props: ModalProps) => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();

  React.useEffect(() => {
    if (props.open) {
      saveScrollHeight();
    } else {
      restoreScrollHeight();
    }
  }, [props.open]);

  return <Modal {...props} />;
};

export default ScrollerModal;
