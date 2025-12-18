import ScrollerModal from '@/components/scroller-modal';
import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { useIntl } from '@umijs/max';
import { Alert, Button } from 'antd';
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
  title: string;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
  clusterLoading?: boolean;
  stepList: StepName[];
  onClusterChange?: (value: number, row?: any) => void;
  onCancel: () => void;
  cluster_id: number;
  registrationInfo?: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
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
    cluster_id: number;
  }>({
    token: '',
    image: '',
    server_url: '',
    cluster_id: 0
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

  return (
    <ScrollerModal
      title={title}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={865}
      style={{}}
      maxContentHeight={'max(calc(100vh - 200px), 600px)'}
      footer={
        <Footer>
          <span className="tips">
            {addedCount > 0 && (
              <Alert
                message={intl.formatMessage(
                  {
                    id: 'clusters.addworker.message.success'
                  },
                  { count: addedCount }
                )}
                type="warning"
              />
            )}
          </span>
          <Button
            type="primary"
            onClick={onCancel}
            style={{
              minWidth: 88
            }}
          >
            {intl.formatMessage({ id: 'common.button.done' })}
          </Button>
        </Footer>
      }
    >
      <AddWorkerStep
        isModal={true}
        stepList={stepList}
        provider={provider}
        clusterList={clusterList}
        clusterLoading={clusterLoading}
        onClusterChange={handleOnClusterChange}
        registrationInfo={registrationInfo}
      ></AddWorkerStep>
    </ScrollerModal>
  );
};

export default AddWorker;
