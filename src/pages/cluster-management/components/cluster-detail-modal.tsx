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
    id: 2,
    name: 'Digital-Ocean-cluster',
    provider: 'digitalocean',
    workers: 3,
    gpus: 6,
    status: 'error',
    deployments: 2
  });
  const handleOnClose = () => {
    onClose?.();
  };

  return (
    <GSDrawer
      width={'80vw'}
      title={`Cluster Detail - ${clusterId}`}
      open={open}
      onClose={handleOnClose}
    >
      <ClusterDetailContent data={data} />
    </GSDrawer>
  );
};

export default ClusterDetailModal;
