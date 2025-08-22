import ScrollerModal from '@/components/scroller-modal/index';
import React from 'react';
import RegisterClusterInner from './resiter-cluster-inner';

type AddModalProps = {
  title: string;
  open: boolean;
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
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      footer={false}
    >
      <RegisterClusterInner registrationInfo={registrationInfo} />
    </ScrollerModal>
  );
};

export default AddCluster;
