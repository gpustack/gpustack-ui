import { systemConfigAtom } from '@/atoms/system';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import GrafanaIcon from '@/pages/_components/grafana-icon';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { useAtomValue } from 'jotai';

const useGranfanaLink = (options: {
  type: 'model' | 'worker' | 'instance' | 'cluster';
  dataList?: any[];
}) => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);

  const goToModelGrafana = (row: { id: number }) => {
    window.open(
      `/${GPUSTACK_API_BASE_URL}/models/${row.id}/dashboard`,
      '_blank'
    );
  };

  const goToWorkerGrafana = (row: { id: number }) => {
    window.open(
      `/${GPUSTACK_API_BASE_URL}/workers/${row.id}/dashboard`,
      '_blank'
    );
  };

  const goToInstanceGrafana = (row: { id: number }) => {
    window.open(
      `/${GPUSTACK_API_BASE_URL}/model-instances/${row.id}/dashboard`,
      '_blank'
    );
  };

  const goToClusterGrafana = (row: { id: number }) => {
    window.open(
      `/${GPUSTACK_API_BASE_URL}/clusters/${row.id}/dashboard`,
      '_blank'
    );
  };

  const goToGrafana = (row: { id: number }) => {
    if (options.type === 'model') {
      goToModelGrafana(row);
    } else if (options.type === 'worker') {
      goToWorkerGrafana(row);
    } else if (options.type === 'instance') {
      goToInstanceGrafana(row);
    } else if (options.type === 'cluster') {
      goToClusterGrafana(row);
    }
  };

  const handleClick = () => {
    if (options.dataList && options.dataList.length > 0) {
      goToGrafana(options.dataList?.[0]);
    }
  };

  const ActionButton = () => {
    if (systemConfig?.showMonitoring) {
      return (
        <Button
          onClick={handleClick}
          icon={<GrafanaIcon style={{ width: 16, height: 16 }}></GrafanaIcon>}
        >
          {intl.formatMessage({ id: 'resources.metrics.details' })}
        </Button>
      );
    }
    return null;
  };

  return {
    goToGrafana,
    ActionButton
  };
};

export default useGranfanaLink;
