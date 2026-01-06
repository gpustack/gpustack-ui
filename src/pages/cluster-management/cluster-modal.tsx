import GSDrawer from '@/components/scroller-modal/gs-drawer';
import React from 'react';
import ClusterCreate from './cluster-create';

interface ClusterModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
}

const ClusterModal: React.FC<ClusterModalProps> = ({
  open,
  onClose,
  title
}) => {
  const handleCancel = () => {
    onClose();
  };

  return (
    <GSDrawer
      title={title}
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
        wrapper: { width: 700 }
      }}
      footer={false}
    >
      <ClusterCreate onClose={handleCancel}></ClusterCreate>
    </GSDrawer>
  );
};

export default ClusterModal;
