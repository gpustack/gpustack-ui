import AddWorker from '@/pages/cluster-management/components/add-worker';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useMemo, useState } from 'react';
import { StepName } from '../components/add-worker/config';
import {
  ClusterStatusValueMap,
  ProviderType,
  ProviderValueMap
} from '../config';
import { ClusterListItem } from '../config/types';

const useAddWorker = (props: {
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
}) => {
  const intl = useIntl();
  const { clusterList } = props || {};
  const [stepList, setStepList] = useState<StepName[]>([]);
  const [openAddWorker, setOpenAddWorker] = useState<{
    open: boolean;
    provider: ProviderType;
    title: string;
    cluster_id: number;
  }>({
    open: false,
    provider: null,
    title: '',
    cluster_id: 0
  });

  const handleAddWorker = async (row: ClusterListItem) => {
    try {
      // set the title based on provider type
      const title =
        row.provider === ProviderValueMap.Docker
          ? intl.formatMessage({ id: 'resources.button.create' })
          : intl.formatMessage({ id: 'clusters.button.register' });

      if (!row?.id) return;

      setOpenAddWorker({
        open: true,
        title: title,
        provider: row.provider as ProviderType,
        cluster_id: row.id
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
      .filter((item) => item.state === ClusterStatusValueMap.Ready);
  }, [clusterList]);

  const AddWorkerModal = (
    <AddWorker
      title={openAddWorker.title}
      stepList={stepList || []}
      open={openAddWorker.open}
      provider={openAddWorker.provider}
      clusterList={clusterDataList}
      cluster_id={openAddWorker.cluster_id}
      onClusterChange={handleClusterChange}
      onCancel={() =>
        setOpenAddWorker({
          open: false,
          provider: null,
          title: '',
          cluster_id: 0
        })
      }
    ></AddWorker>
  );

  return {
    handleAddWorker,
    AddWorkerModal,
    setStepList
  };
};

export default useAddWorker;
