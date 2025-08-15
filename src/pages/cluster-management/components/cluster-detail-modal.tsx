import GSDrawer from '@/components/scroller-modal/gs-drawer';
import React from 'react';
import ClusterDetailContent from './cluster-detail-content';

interface ClusterDetailModalProps {
  open: boolean;
  onClose?: () => void;
  id: number;
}

const ClusterDetailModal: React.FC<ClusterDetailModalProps> = ({
  open,
  onClose,
  id: clusterId
}) => {
  const [data, setData] = React.useState<any>({
    id: 1,
    name: 'kubernetes-cluster',
    provider: 'kubernetes',
    clusterType: 'Kubernetes',
    workers: 2,
    gpus: 4,
    status: 'ready',
    deployments: 1
  });
  const handleOnClose = () => {
    onClose?.();
  };

  return (
    <GSDrawer
      width={800}
      title={`Cluster Detail - ${clusterId}`}
      open={open}
      onClose={handleOnClose}
    >
      <ClusterDetailContent data={data} />
    </GSDrawer>
  );
};

export default ClusterDetailModal;
