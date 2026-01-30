import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useState } from 'react';
import { ListItem } from '../config/types';

const useCustomBackend = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: ListItem;
    title: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    currentData: undefined,
    title: ''
  });

  const openModal = (action: PageActionType, title: string, row?: ListItem) => {
    setOpenModalStatus({
      ...openModalStatus,
      open: true,
      title: title,
      action,
      currentData: row
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.CREATE,
      currentData: undefined,
      title: ''
    });
  };

  return {
    openCustomModalStatus: openModalStatus,
    setOpenCustomModalStatus: setOpenModalStatus,
    openCustomModal: openModal,
    closeCustomModal: closeModal
  };
};

export default useCustomBackend;
