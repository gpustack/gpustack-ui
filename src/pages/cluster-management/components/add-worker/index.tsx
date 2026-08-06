import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { getDriverKeysByVendors } from '@/pages/resources/config/gpu-driver';
import { ColumnWrapper, createAxiosToken, GSDrawer } from '@gpustack/core-ui';
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

type RegistrationInfo = {
  token: string;
  image: string;
  server_url: string;
  cluster_id: number | null;
};

const emptyRegistrationInfo: RegistrationInfo = {
  token: '',
  image: '',
  server_url: '',
  cluster_id: null
};

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
  const { addedCount, createModelsChunkRequest, reset } = useAddWorkerMessage();
  const firstLoad = React.useRef(true);
  const axiosTokenRef = React.useRef<any>(null);
  // The two always move together — a cluster selection produces both its
  // registration token and the vendors that cluster already runs.
  const [clusterState, setClusterState] = React.useState<{
    registrationInfo: RegistrationInfo;
    registeredGPUs: string[];
  }>({
    registrationInfo: emptyRegistrationInfo,
    registeredGPUs: []
  });

  const handleOnClusterChange = async (value: number, row?: any) => {
    axiosTokenRef.current?.cancel?.();
    const axiosToken = createAxiosToken();
    axiosTokenRef.current = axiosToken;

    // The vendor step has to start from the vendors the cluster already runs:
    // re-registering a node against the NVIDIA default produces a command that
    // node can't register with. Clusters are homogeneous in practice, so this
    // also gives Docker's Add Worker a better guess than a fixed NVIDIA. The
    // vendors come off the watch's baseline seed, which already lists this
    // cluster's workers with their `status.gpu_devices`.
    const [tokenResult, workersResult] = await Promise.allSettled([
      queryClusterToken({ id: value }, { token: axiosToken.token }),
      createModelsChunkRequest({ cluster_id: value })
    ]);

    // a newer cluster selection already superseded this one
    if (axiosTokenRef.current !== axiosToken) return;

    firstLoad.current = false;

    const workers =
      workersResult.status === 'fulfilled' ? workersResult.value || [] : [];

    setClusterState((prev) => ({
      registrationInfo:
        tokenResult.status === 'fulfilled'
          ? { ...tokenResult.value, cluster_id: value }
          : prev.registrationInfo,
      registeredGPUs: getDriverKeysByVendors(
        workers.flatMap(
          (worker) =>
            worker.status?.gpu_devices?.map((device) => device.vendor) || []
        )
      )
    }));
  };

  useEffect(() => {
    if (open && cluster_id && firstLoad.current) {
      handleOnClusterChange(cluster_id);
    }
    if (!open) {
      reset();
      axiosTokenRef.current?.cancel?.();
      axiosTokenRef.current = null;
      firstLoad.current = true;
      // Drop the previous cluster's data so reopening for another cluster
      // never flashes a stale vendor preselection.
      setClusterState({
        registrationInfo: emptyRegistrationInfo,
        registeredGPUs: []
      });
    }
  }, [open, cluster_id]);

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
          registrationInfo={clusterState.registrationInfo}
          registeredGPUs={clusterState.registeredGPUs}
        ></AddWorkerStep>
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddWorker;
