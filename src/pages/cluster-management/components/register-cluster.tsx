import ScrollerModal from '@/components/scroller-modal/index';
import React from 'react';
import { ClusterListItem as ListItem } from '../config/types';
import RegisterClusterInner from './resiter-cluster-inner';

type AddModalProps = {
  title: string;
  open: boolean;
  data: ListItem;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  open,
  data,
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
      <RegisterClusterInner data={data} />
    </ScrollerModal>
  );
};

export default AddCluster;
