import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useState } from 'react';
import { AccessItem as ListItem } from '../config/types';

const useFallbackSettings = (options?: { refresh: () => void }) => {
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

  const openModal = (
    action: PageActionType,
    title: string,
    currentData?: ListItem
  ) => {
    setOpenModalStatus({
      open: true,
      action,
      currentData,
      title: title
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
    openFallbackSettingsModalStatus: openModalStatus,
    setOpenFallbackSettingsModalStatus: setOpenModalStatus,
    openFallbackSettingsModal: openModal,
    closeFallbackSettingsModal: closeModal
  };
};

export default useFallbackSettings;
