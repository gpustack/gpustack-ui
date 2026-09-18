import {
  downloadFile,
  filenameFromDisposition,
  readResponseError
} from '@/utils/download-stream';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { exportModels } from '../apis';

const useExportDeployments = () => {
  const intl = useIntl();

  // The server owns the filename: `<name>.yaml` for one deployment,
  // `gpustack-deployments-<timestamp>.yaml` for several.
  const exportDeployments = async (ids: number[]) => {
    try {
      const { data, headers } = await exportModels({ ids });
      const filename =
        filenameFromDisposition(headers?.['content-disposition']) ||
        'deployments.yaml';
      downloadFile(data, filename);
    } catch (error) {
      const detail = await readResponseError(error);
      message.error(
        detail || intl.formatMessage({ id: 'common.message.downloadFailed' })
      );
    }
  };

  return { exportDeployments };
};

export default useExportDeployments;
