import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageAction } from '@/config';
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
  const [currentTitle, setCurrentTitle] = React.useState<string>(title);
  const handleCancel = () => {
    onClose();
  };

  return (
    <GSDrawer
      title={currentTitle}
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
        wrapper: { width: 710 }
      }}
      footer={false}
    >
      <ClusterCreate
        onClose={handleCancel}
        action={PageAction.CREATE}
        setCurrentTitle={setCurrentTitle}
      ></ClusterCreate>
    </GSDrawer>
  );
};

export default ClusterModal;
