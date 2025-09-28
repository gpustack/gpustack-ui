import { downloadFile } from '@/utils/download-stream';
import { json2Yaml } from '../config';

const useExportYAML = () => {
  const exportYAML = (currentData?: any) => {
    const yaml = json2Yaml(currentData || {});
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    downloadFile(blob, `${currentData.backend_name}.yml`);
  };

  return { exportYAML };
};

export default useExportYAML;
