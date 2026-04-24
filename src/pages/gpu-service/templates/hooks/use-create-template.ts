import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useBodyScroll from '@/hooks/use-body-scroll';
import { useState } from 'react';
import { ListItem } from '../config/types';

const useCreateTemplate = () => {
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

  const openModal = (action: PageActionType, title: string, row?: ListItem) => {
    setOpenModalStatus({
      open: true,
      title,
      action,
      currentData: row
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
    openTemplateModalStatus: openModalStatus,
    openTemplateModal: openModal,
    closeTemplateModal: closeModal
  };
};

export default useCreateTemplate;
