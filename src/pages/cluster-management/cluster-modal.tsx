import GSDrawer from '@/components/scroller-modal/gs-drawer';
import React from 'react';
import ClusterCreate from './cluster-create';

interface ClusterModalProps {
  open: boolean;
  onClose: () => void;
}

const ClusterModal: React.FC<ClusterModalProps> = ({ open, onClose }) => {
  const handleCancel = () => {
    onClose();
  };

  return (
    <GSDrawer
      title={'Create Cluster'}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        body: {
          paddingBlock: 0
        },
        wrapper: { width: 900 }
      }}
      footer={false}
    >
      <ClusterCreate onClose={handleCancel}></ClusterCreate>
    </GSDrawer>
  );
};

export default ClusterModal;
