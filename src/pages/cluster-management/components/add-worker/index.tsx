import ScrollerModal from '@/components/scroller-modal';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { queryClusterToken } from '../../apis';
import { ProviderType } from '../../config';
import { ClusterListItem } from '../../config/types';
import AddWorkerStep from './add-worker-step';
import { StepName } from './config';

const Container = styled.div`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .command-info {
    margin-bottom: 8px;
  }
`;

type AddWorkerProps = {
  open: boolean;
  provider: ProviderType;
  title: string;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
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
    stepList = []
  } = props || {};
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
        image: data.container_registry
          ? `${data.container_registry}/${data.image}`
          : data.image,
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
      footer={null}
    >
      <AddWorkerStep
        stepList={stepList}
        provider={provider}
        clusterList={clusterList}
        onClusterChange={handleOnClusterChange}
        registrationInfo={registrationInfo}
      ></AddWorkerStep>
    </ScrollerModal>
  );
};

export default AddWorker;
