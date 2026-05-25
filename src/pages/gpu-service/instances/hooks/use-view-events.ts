import { useState } from 'react';
import { ListItem } from '../config/types';

// View events still hits the K8s proxy. clusterID and namespace are taken
// from the row itself (`row.clusterId`, `row.status.namespace`).
const useViewEvents = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    name: string;
    namespace: string;
    clusterID?: number;
  }>({
    open: false,
    name: '',
    namespace: '',
    clusterID: undefined
  });

  const openModal = (row?: ListItem) => {
    setOpenModalStatus({
      open: true,
      name: row?.name || '',
      namespace: row?.status?.namespace || '',
      clusterID: row?.clusterId ?? undefined
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      name: '',
      namespace: '',
      clusterID: undefined
    });
  };

  return {
    openViewEventsModalStatus: openModalStatus,
    openViewEventsModal: openModal,
    closeViewEventsModal: closeModal
  };
};

export default useViewEvents;
