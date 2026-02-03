import { GPUSTACK_API_BASE_URL } from '@/config/settings';

const useGranfanaLink = (options: {
  type: 'model' | 'worker' | 'instance';
}) => {
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

  const goToGrafana = (row: { id: number }) => {
    if (options.type === 'model') {
      goToModelGrafana(row);
    } else if (options.type === 'worker') {
      goToWorkerGrafana(row);
    } else if (options.type === 'instance') {
      goToInstanceGrafana(row);
    }
  };

  return {
    goToGrafana
  };
};

export default useGranfanaLink;
