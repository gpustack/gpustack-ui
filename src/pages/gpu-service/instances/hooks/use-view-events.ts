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
    volumeName?: string;
    hasPersistentVolume: boolean;
  }>({
    open: false,
    name: '',
    namespace: '',
    clusterID: undefined,
    volumeName: undefined,
    hasPersistentVolume: false
  });

  const openModal = (row?: ListItem) => {
    const volume = row?.spec?.volume;
    setOpenModalStatus({
      open: true,
      name: row?.name || '',
      namespace: row?.status?.namespace || '',
      clusterID: row?.clusterId ?? undefined,
      volumeName: volume?.persistent?.name || volume?.persistentTemplate?.name,
      hasPersistentVolume:
        !!volume?.persistent?.name || !!volume?.persistentTemplate?.name
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      name: '',
      namespace: '',
      clusterID: undefined,
      volumeName: undefined,
      hasPersistentVolume: false
    });
  };

  return {
    openViewEventsModalStatus: openModalStatus,
    openViewEventsModal: openModal,
    closeViewEventsModal: closeModal
  };
};

export default useViewEvents;
