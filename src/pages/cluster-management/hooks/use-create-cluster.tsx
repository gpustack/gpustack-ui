import { useState } from 'react';

const useCreateCluster = (options: { refresh: () => void }) => {
  const [clusterModalStatus, setClusterModalStatus] = useState<{
    open: boolean;
  }>({
    open: false
  });

  const openClusterModal = () => {
    setClusterModalStatus({ open: true });
  };

  const closeClusterModal = () => {
    setClusterModalStatus({ open: false });
    options.refresh();
  };

  return {
    clusterModalStatus,
    openClusterModal,
    closeClusterModal
  };
};

export default useCreateCluster;
