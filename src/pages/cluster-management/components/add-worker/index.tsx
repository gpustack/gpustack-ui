import GSDrawer from '@/components/scroller-modal/gs-drawer';
import ColumnWrapper from '@/pages/_components/column-wrapper';
import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { queryClusterToken } from '../../apis';
import { ProviderType } from '../../config';
import { ClusterListItem } from '../../config/types';
import AddWorkerStep from './add-worker-step';
import { StepName } from './config';

const Footer = styled.div`
  position: relative;
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  padding-top: 12px;
  .tips {
    position: absolute;
    left: 0px;
  }
`;

type AddWorkerProps = {
  open: boolean;
  provider: ProviderType;
  title: React.ReactNode;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
  clusterLoading?: boolean;
  stepList: StepName[];
  onClusterChange?: (value: number, row?: any) => void;
  onCancel: () => void;
  cluster_id: number | null;
  registrationInfo?: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
  };
};

/**
 * both add worker and register cluster use this component
 * @param props
 * @returns
 */
const AddWorker: React.FC<AddWorkerProps> = (props) => {
  const {
    open,
    onCancel,
    provider,
    cluster_id,
    title,
    clusterList,
    clusterLoading,
    stepList = []
  } = props || {};
  const intl = useIntl();
  const { addedCount, createModelsChunkRequest } = useAddWorkerMessage();
  const firstLoad = React.useRef(true);
  const [registrationInfo, setRegistrationInfo] = React.useState<{
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
  }>({
    token: '',
    image: '',
    server_url: '',
    cluster_id: null
  });

  const handleOnClusterChange = async (value: number, row?: any) => {
    try {
      const data = await queryClusterToken({ id: value });
      firstLoad.current = false;
      setRegistrationInfo({
        ...data,
        cluster_id: value
      });
    } catch (error) {
      firstLoad.current = false;
    }
  };

  useEffect(() => {
    if (open && cluster_id && firstLoad.current) {
      handleOnClusterChange(cluster_id);
    }
    return () => {
      firstLoad.current = true;
    };
  }, [open, cluster_id]);

  useEffect(() => {
    if (open) {
      createModelsChunkRequest();
    }
  }, [open]);

  const renderMessage = (count: number) => {
    if (count === 1) {
      return intl.formatMessage(
        {
          id: 'clusters.addworker.message.success_single'
        },
        { count: addedCount }
      );
    }
    return intl.formatMessage(
      {
        id: 'clusters.addworker.message.success_multiple'
      },
      { count: addedCount }
    );
  };

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={onCancel}
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
      <ColumnWrapper
        styles={{
          container: { paddingBlock: 16 }
        }}
        footer={
          <Footer style={{ paddingInline: 24, paddingBottom: 24 }}>
            {addedCount > 0 && (
              <Alert
                style={{
                  textAlign: 'left',
                  borderColor: 'var(--ant-color-success)',
                  width: '100%'
                }}
                type="success"
                title={renderMessage(addedCount)}
                closable
              />
            )}
          </Footer>
        }
      >
        <AddWorkerStep
          onCancel={onCancel}
          actionSource={'modal'}
          stepList={stepList}
          provider={provider}
          clusterList={clusterList}
          clusterLoading={clusterLoading}
          onClusterChange={handleOnClusterChange}
          registrationInfo={registrationInfo}
        ></AddWorkerStep>
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddWorker;
