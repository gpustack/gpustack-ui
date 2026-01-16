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

  const openModal = () => {
    setOpenModalStatus({ ...openModalStatus, open: true });
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
