import useBodyScroll from '@/hooks/use-body-scroll';
import { useState } from 'react';

const useCreateInstanceTypeModal = () => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    title: string;
  }>({
    open: false,
    title: ''
  });

  const openModal = (title: string) => {
    setOpenModalStatus({
      open: true,
      title
    });
    saveScrollHeight();
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      title: ''
    });
    restoreScrollHeight();
  };

  return {
    openInstanceTypeModalStatus: openModalStatus,
    openInstanceTypeModal: openModal,
    closeInstanceTypeModal: closeModal
  };
};

export default useCreateInstanceTypeModal;
