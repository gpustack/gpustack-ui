import { useState } from 'react';
import { BenchmarkListItem as ListItem } from '../config/types';

const useViewDetail = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    currentData?: ListItem;
  }>({
    open: false,
    currentData: undefined
  });

  const openModal = (rows?: ListItem) => {
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
    openViewDetailModalStatus: openModalStatus,
    setOpenViewDetailModalStatus: setOpenModalStatus,
    openViewDetailModal: openModal,
    closeViewDetailModal: closeModal
  };
};

export default useViewDetail;
