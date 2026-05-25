import { useState } from 'react';
import { GPU_SERVICE_INSTANCES_LOG_API } from '../apis';
import { ListItem } from '../config/types';

// View logs still hits the K8s proxy. clusterID and namespace are taken
// from the row itself (`row.clusterId`, `row.status.namespace`) since the
// page no longer has a global cluster selector.
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
    const name = row?.name;
    const namespace = row?.status?.namespace;
    const clusterID = row?.clusterId ?? undefined;
    setOpenModalStatus({
      open: true,
      url:
        name && namespace && clusterID
          ? GPU_SERVICE_INSTANCES_LOG_API({ namespace, clusterID, name })
          : '',
      tail: 1000,
      status: row?.status?.phase || undefined
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
