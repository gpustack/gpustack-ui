import GSDrawer from '@/components/scroller-modal/gs-drawer';
import React from 'react';
import { ListItem } from '../config/types';
import WorkerDetailContent from './worker-detail-content';

interface WorkerDetailModalProps {
  open: boolean;
  onClose?: () => void;
  currentData: ListItem | null;
}

const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  open,
  onClose,
  currentData
}) => {
  const handleOnClose = () => {
    onClose?.();
  };

  return (
    <GSDrawer
      styles={{
        wrapper: { width: 'calc(100vw - 200px)' }
      }}
      title={`${currentData?.name}`}
      open={open}
      destroyOnHidden={true}
      onClose={handleOnClose}
    >
      <WorkerDetailContent worker_id={currentData?.id} />
    </GSDrawer>
  );
};

export default WorkerDetailModal;
