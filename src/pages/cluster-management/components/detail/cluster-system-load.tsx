import React, { useEffect } from 'react';
import { useClusterSystemLoad } from '../../services/use-cluster-system-load';

const ClusterSystemLoad: React.FC<{ clusterId: number }> = ({ clusterId }) => {
  const { systemLoad, fetchClusterSystemLoad } = useClusterSystemLoad();

  useEffect(() => {
    if (clusterId) {
      fetchClusterSystemLoad({ cluster_id: clusterId });
    }
  }, [clusterId]);

  return <div>Cluster System Load Component</div>;
};

export default ClusterSystemLoad;
