import { systemConfigAtom } from '@/atoms/system';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import GrafanaIcon from '@/pages/_components/grafana-icon';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { useAtomValue } from 'jotai';

const useGranfanaLink = (options: {
  type: 'model' | 'worker' | 'instance' | 'cluster';
}) => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);
  const grafanaUrl = systemConfig.grafana_url || 'grafana';

  // for worker/model/instance/cluster item entry
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

  // all endpoints of grafana
  const modelEntry = () => {
    const modelURL = systemConfig.grafana_model_dashboard_uid;
    window.open(`${grafanaUrl}/d/${modelURL}/gpustack-model`, '_blank');
  };

  const workerEntry = () => {
    const workerURL = systemConfig.grafana_worker_dashboard_uid;
    window.open(`${grafanaUrl}/d/${workerURL}/gpustack-worker`, '_blank');
  };

  const handleClick = () => {
    if (options.type === 'model') {
      modelEntry();
    } else if (options.type === 'worker' || options.type === 'cluster') {
      workerEntry();
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
