import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useBodyScroll from '@/hooks/use-body-scroll';
import { useState } from 'react';
import { RouteItem as ListItem } from '../config/types';

const useAccessControl = () => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
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
    saveScrollHeight();
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.CREATE,
      currentData: undefined,
      title: ''
    });
    restoreScrollHeight();
  };

  return {
    openAccessControlModalStatus: openModalStatus,
    setOpenAccessControlModalStatus: setOpenModalStatus,
    openAccessControlModal: openModal,
    closeAccessControlModal: closeModal
  };
};

export default useAccessControl;
