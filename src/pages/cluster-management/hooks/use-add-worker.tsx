import AddWorker from '@/pages/cluster-management/components/add-worker';
import { useIntl } from '@umijs/max';
import { message, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import { StepName } from '../components/add-worker/config';
import {
  ClusterStatusValueMap,
  ProviderType,
  ProviderValueMap
} from '../config';
import { ClusterListItem } from '../config/types';

const useAddWorker = (props: {
  clusterLoading?: boolean;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
}) => {
  const intl = useIntl();
  const { clusterList, clusterLoading } = props || {};
  const [stepList, setStepList] = useState<StepName[]>([]);
  const [openAddWorker, setOpenAddWorker] = useState<{
    open: boolean;
    provider: ProviderType;
    title: React.ReactNode;
    cluster_id: number | null;
  }>({
    open: false,
    provider: null,
    title: '',
    cluster_id: null
  });

  const handleAddWorker = async (row: ClusterListItem, fromWorker = false) => {
    try {
      if (!row?.id) return;

      // set the title based on provider type
      let title =
        row.provider === ProviderValueMap.Docker
          ? intl.formatMessage({ id: 'resources.button.create' })
          : intl.formatMessage({ id: 'clusters.button.register' });

      let clusterId: number | null = [
        ProviderValueMap.Docker,
        ProviderValueMap.Kubernetes
      ].includes(row.provider as string)
        ? row.id
        : null;

      if (fromWorker) {
        title = intl.formatMessage({ id: 'resources.button.create' });
      }

      if (fromWorker && row.provider === ProviderValueMap.Kubernetes) {
        clusterId = null;
      }

      setOpenAddWorker({
        open: true,
        title: (
          <span>
            {title}
            {row.name && (
              <Tag
                variant="outlined"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  marginLeft: 8,
                  borderRadius: 4,
                  borderColor: 'var(--ant-color-border-secondary)',
                  color: 'var(--ant-color-text-secondary)'
                }}
              >
                {intl.formatMessage({ id: 'clusters.title' })}: {row.name}
              </Tag>
            )}
          </span>
        ),
        provider: row.provider as ProviderType,
        cluster_id: clusterId
      });
    } catch (error: any) {
      message.error(error?.message || 'Failed to fetch cluster token');
    }
  };

  const handleClusterChange = async (value: number, row: ClusterListItem) => {
    handleAddWorker(row);
  };

  const clusterDataList = useMemo(() => {
    return clusterList
      ?.map((item) => {
        return {
          ...item,
          disabled:
            item.state !== ClusterStatusValueMap.Ready ||
            item.provider !== ProviderValueMap.Docker
        };
      })
      .filter(
        (item) =>
          item.state === ClusterStatusValueMap.Ready &&
          item.provider === ProviderValueMap.Docker
      );
  }, [clusterList]);

  /**
   * Add Worker only for Docker clusters,  for k8s and digitalocean do something in the cluster list page.
   * @param clusterList
   * @param includeDigitalOcean
   * @returns
   */
  const checkDefaultCluster = (
    clusterList: Global.BaseOption<number, ClusterListItem>[]
  ) => {
    // select default and ready cluster first, digitalocean no READY state
    let currentData = clusterList.find(
      (item) =>
        item.is_default &&
        item.state === ClusterStatusValueMap.Ready &&
        item.provider === ProviderValueMap.Docker
    );

    if (!currentData) {
      // select docker ready cluster
      currentData = clusterList.find(
        (item) =>
          item.provider === ProviderValueMap.Docker &&
          item.state === ClusterStatusValueMap.Ready
      );
    }

    if (!currentData) {
      // select any ready cluster
      currentData = clusterList.find(
        (item) => item.state === ClusterStatusValueMap.Ready
      );
    }

    if (!currentData) {
      // maybe no ready a digitalocean cluster
      currentData = clusterList[0];
    }

    return currentData || null;
  };

  const AddWorkerModal = (
    <AddWorker
      title={openAddWorker.title}
      stepList={stepList || []}
      open={openAddWorker.open}
      provider={openAddWorker.provider}
      clusterList={clusterDataList}
      clusterLoading={clusterLoading}
      cluster_id={openAddWorker.cluster_id}
      onClusterChange={handleClusterChange}
      onCancel={() =>
        setOpenAddWorker({
          open: false,
          provider: null,
          title: '',
          cluster_id: null
        })
      }
    ></AddWorker>
  );

  return {
    handleAddWorker,
    checkDefaultCluster,
    AddWorkerModal,
    setStepList
  };
};

export default useAddWorker;
