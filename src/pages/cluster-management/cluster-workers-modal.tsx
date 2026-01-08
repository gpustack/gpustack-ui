import WorkerList from '@/pages/resources/components/workers';
import { useIntl } from '@umijs/max';
import React from 'react';
import styled from 'styled-components';
import FormDrawer from '../_components/form-drawer';
import { ClusterListItem } from './config/types';

const Content = styled.div`
  .ant-pagination {
    position: fixed;
    bottom: 8px;
    right: 24px;
    z-index: 100;
  }
  .page-tools {
    position: sticky;
    top: 0;
  }
`;

interface ClusterWorkersModalProps {
  cluster: ClusterListItem;
  open: boolean;
  onClose: () => void;
}

const ClusterWorkersModal: React.FC<ClusterWorkersModalProps> = ({
  open,
  onClose,
  cluster
}) => {
  const intl = useIntl();
  return (
    <FormDrawer
      title={`${intl.formatMessage({ id: 'clusters.title' })}: ${cluster.name}`}
      open={open}
      onCancel={onClose}
      footer={
        <div
          style={{
            height: 56
          }}
        ></div>
      }
      width={'calc(100vw - 220px)'}
    >
      <Content>
        <WorkerList
          cluster={cluster}
          showAddButton={false}
          showSelect={false}
          widths={{ input: 360 }}
          sourceType="cluster"
        />
      </Content>
    </FormDrawer>
  );
};

export default ClusterWorkersModal;
