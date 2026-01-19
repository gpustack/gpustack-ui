import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useState } from 'react';
import { maasProviderType } from '../config';
import { MaasProviderItem as ListItem } from '../config/types';

const useCreateProvider = (options: { refresh: () => void }) => {
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

  const openModal = (action: PageActionType, row?: ListItem) => {
    setOpenModalStatus({
      ...openModalStatus,
      open: true,
      title: action === PageAction.CREATE ? 'Create Provider' : 'Edit Provider',
      action,
      currentData: row,
      provider: row ? row.provider : null
    });
  };

  const closeModal = () => {
    setOpenModalStatus({ ...openModalStatus, open: false });
    options.refresh();
  };

  return {
    openProviderModalStatus: openModalStatus,
    setOpenProviderModalStatus: setOpenModalStatus,
    openProviderModal: openModal,
    closeProviderModal: closeModal
  };
};

export default useCreateProvider;
