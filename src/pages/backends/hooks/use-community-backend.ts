import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useState } from 'react';

const useCommunityBackend = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: ''
  });

  const openModal = (action: PageActionType, title: string) => {
    setOpenModalStatus({
      open: true,
      title: title,
      action
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.CREATE,
      title: ''
    });
  };

  return {
    openCommunityModalStatus: openModalStatus,
    setOpenCommunityModalStatus: setOpenModalStatus,
    openCommunityModal: openModal,
    closeCommunityModal: closeModal
  };
};

export default useCommunityBackend;
