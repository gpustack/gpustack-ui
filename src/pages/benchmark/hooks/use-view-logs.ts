import { useState } from 'react';
import { BENCHMARKS_API } from '../apis';
import { BenchmarkListItem as ListItem } from '../config/types';

const useViewLogs = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    url: string;
    tail?: number;
    status?: string;
  }>({
    open: false,
    url: '',
    tail: 1000,
    status: undefined
  });

  const openModal = (row?: ListItem) => {
    setOpenModalStatus({
      open: true,
      url: `${BENCHMARKS_API}/${row?.id}/logs`,
      tail: 1000,
      status: row?.state || undefined
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      url: '',
      tail: 1000,
      status: undefined
    });
  };

  return {
    openViewLogsModalStatus: openModalStatus,
    setOpenViewLogsModalStatus: setOpenModalStatus,
    openViewLogsModal: openModal,
    closeViewLogsModal: closeModal
  };
};

export default useViewLogs;
