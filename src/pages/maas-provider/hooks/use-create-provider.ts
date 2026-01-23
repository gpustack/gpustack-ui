import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useState } from 'react';
import { MaasProviderItem as ListItem } from '../config/types';

const useCreateProvider = (options: { refresh: () => void }) => {
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
    openProviderModalStatus: openModalStatus,
    setOpenProviderModalStatus: setOpenModalStatus,
    openProviderModal: openModal,
    closeProviderModal: closeModal
  };
};

export default useCreateProvider;
