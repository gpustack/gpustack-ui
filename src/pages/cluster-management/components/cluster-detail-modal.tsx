import GSDrawer from '@/components/scroller-modal/gs-drawer';
import React from 'react';
import { ClusterListItem } from '../config/types';
import ClusterDetailContent from './cluster-metrics';

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
      styles={{
        wrapper: {
          width: 'calc(100vw - 200px)'
        }
      }}
      title={`${currentData?.name}`}
      open={open}
      onClose={handleOnClose}
    >
      <ClusterDetailContent />
    </GSDrawer>
  );
};

export default ClusterDetailModal;
