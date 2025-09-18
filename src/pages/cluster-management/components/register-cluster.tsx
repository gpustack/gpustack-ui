import ScrollerModal from '@/components/scroller-modal/index';
import React from 'react';
import { ProviderType } from '../config';
import AddWorkerStep from './add-worker-step';

type AddModalProps = {
  title: string;
  open: boolean;
  provider: ProviderType;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
  };
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  open,
  provider,
  registrationInfo,
  onCancel
}) => {
  const handleCancel = () => {
    onCancel();
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      onCancel={handleCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={860}
      footer={false}
    >
      <AddWorkerStep registrationInfo={registrationInfo} provider={provider} />
    </ScrollerModal>
  );
};

export default AddCluster;
