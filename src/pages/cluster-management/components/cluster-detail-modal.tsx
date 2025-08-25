import GSDrawer from '@/components/scroller-modal/gs-drawer';
import React from 'react';
import { ClusterListItem } from '../config/types';
import ClusterDetailContent from './cluster-detail-content';

interface ClusterDetailModalProps {
  open: boolean;
  onClose?: () => void;
  currentData: ClusterListItem | null;
}

const ClusterDetailModal: React.FC<ClusterDetailModalProps> = ({
  open,
  onClose,
  currentData = {} as ClusterListItem
}) => {
  const handleOnClose = () => {
    onClose?.();
  };

  return (
    <GSDrawer
      width={'80vw'}
      title={`Cluster Detail - ${currentData?.name}`}
      open={open}
      onClose={handleOnClose}
    >
      <ClusterDetailContent data={currentData} />
    </GSDrawer>
  );
};

export default ClusterDetailModal;
