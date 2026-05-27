import { PageAction } from '@/config';
import { GSDrawer } from '@gpustack/core-ui';
import React from 'react';
import ClusterCreate from './cluster-create';

interface ClusterModalProps {
  open: boolean;
  title: string;
  // When set, ClusterCreate preselects this provider and skips the
  // provider-catalog step. Used by feature pages (e.g. GPU Service)
  // whose empty state already implies which kind of cluster is needed.
  providerHint?: string;
  onClose: () => void;
}

const ClusterModal: React.FC<ClusterModalProps> = ({
  open,
  onClose,
  title,
  providerHint
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
        providerHint={providerHint}
        setCurrentTitle={setCurrentTitle}
      ></ClusterCreate>
    </GSDrawer>
  );
};

export default ClusterModal;
