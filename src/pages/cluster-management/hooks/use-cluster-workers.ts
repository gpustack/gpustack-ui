import { useState } from 'react';
import { ClusterListItem } from '../config/types';

export const useClusterWorkers = () => {
  const [clusterWorkersModalStatus, setClusterWorkersModalStatus] = useState<{
    open: boolean;
    cluster: ClusterListItem;
  }>({
    open: false,
    cluster: {} as ClusterListItem
  });

  const openClusterWorkersModal = (cluster: ClusterListItem) => {
    setClusterWorkersModalStatus({
      open: true,
      cluster
    });
  };

  const closeClusterWorkersModal = () => {
    setClusterWorkersModalStatus({
      open: false,
      cluster: {} as ClusterListItem
    });
  };

  return {
    clusterWorkersModalStatus,
    openClusterWorkersModal,
    closeClusterWorkersModal
  };
};
