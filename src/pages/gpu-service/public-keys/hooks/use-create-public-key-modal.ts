import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useBodyScroll from '@/hooks/use-body-scroll';
import { useState } from 'react';
import { ListItem } from '../config/types';

const useCreatePublicKeyModal = () => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: ListItem | null;
    title: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    currentData: null,
    title: ''
  });

  const openModal = (
    action: PageActionType,
    title: string,
    row?: ListItem | null
  ) => {
    setOpenModalStatus({
      open: true,
      title,
      action,
      currentData: row ?? null
    });
    saveScrollHeight();
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.CREATE,
      currentData: null,
      title: ''
    });
    restoreScrollHeight();
  };

  return {
    openPublicKeyModalStatus: openModalStatus,
    openPublicKeyModal: openModal,
    closePublicKeyModal: closeModal
  };
};

export default useCreatePublicKeyModal;
