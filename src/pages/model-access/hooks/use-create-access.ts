import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useState } from 'react';
import { maasProviderType } from '../config';
import { AccessItem as ListItem } from '../config/types';

const useCreateAccess = (options: { refresh: () => void }) => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: ListItem;
    title: string;
    provider: maasProviderType | null;
  }>({
    open: false,
    action: PageAction.CREATE,
    currentData: undefined,
    title: '',
    provider: null
  });

  const openModal = (action: PageActionType, currentData?: ListItem) => {
    setOpenModalStatus({
      ...openModalStatus,
      open: true,
      action,
      currentData,
      title: action === PageAction.CREATE ? 'Create Access' : 'Edit Access'
    });
  };

  const closeModal = () => {
    setOpenModalStatus({ ...openModalStatus, open: false });
    options.refresh();
  };

  return {
    openAccessModalStatus: openModalStatus,
    setOpenAccessModalStatus: setOpenModalStatus,
    openAccessModal: openModal,
    closeAccessModal: closeModal
  };
};

export default useCreateAccess;
