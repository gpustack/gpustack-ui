import { PageAction } from '@/config';
import { GSDrawer } from '@gpustack/core-ui';
import React from 'react';
import ClusterCreate from './cluster-create';

interface ClusterModalProps {
  open: boolean;
  title: string;
  pendingProviderHint?: {
    providerHint?: string;
    presetClusterType?: 'model' | 'gpu';
  };
  onClose: () => void;
}

const ClusterModal: React.FC<ClusterModalProps> = ({
  open,
  onClose,
  title,
  pendingProviderHint
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
      mask={{
        closable: false
      }}
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
        providerHint={pendingProviderHint?.providerHint}
        presetClusterType={pendingProviderHint?.presetClusterType}
        setCurrentTitle={setCurrentTitle}
      ></ClusterCreate>
    </GSDrawer>
  );
};

export default ClusterModal;
