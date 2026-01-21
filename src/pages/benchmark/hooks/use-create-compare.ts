import { PageActionType } from '@/config/types';
import { useState } from 'react';
import { BenchmarkListItem as ListItem } from '../config/types';

const useCreateCompare = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    currentData?: ListItem[];
  }>({
    open: false,
    currentData: undefined
  });

  const openModal = (
    action: PageActionType,
    title: string,
    rows?: ListItem[]
  ) => {
    setOpenModalStatus({
      open: true,
      currentData: rows
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      currentData: undefined
    });
  };

  return {
    openCompareModalStatus: openModalStatus,
    setOpenCompareModalStatus: setOpenModalStatus,
    openCompareModal: openModal,
    closeCompareModal: closeModal
  };
};

export default useCreateCompare;
