import HighlightCode from '@/components/highlight-code';
import { addWorkerGuide } from '@/pages/resources/config';
import React from 'react';

type ViewModalProps = {
  currentGPU?: string;
  workerIP?: string;
  modelDir?: string;
  cacheDir?: string;
  containerName?: string;
  gpustackDataVolume?: string;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
  };
};

const AddWorkerCommand: React.FC<ViewModalProps> = ({
  registrationInfo,
  workerIP,
  modelDir,
  cacheDir,
  currentGPU,
  containerName,
  gpustackDataVolume
}) => {
  const code = React.useMemo(() => {
    const commandCode = addWorkerGuide['all'];
    return commandCode
      ?.registerWorker({
        gpu: currentGPU || '',
        server: registrationInfo.server_url || origin,
        tag: '',
        workerIP: workerIP,
        modelDir: modelDir,
        cacheDir: cacheDir,
        containerName: containerName,
        gpustackDataVolume: gpustackDataVolume,
        image: registrationInfo.image,
        token: registrationInfo.token || '${token}'
      })
      ?.trim()
      .replace(/\s+$/gm, '')
      .replace(/\\+$/, '');
  }, [
    registrationInfo,
    currentGPU,
    workerIP,
    modelDir,
    cacheDir,
    containerName,
    gpustackDataVolume
  ]);

  return (
    <HighlightCode
      theme="dark"
      code={code}
      copyValue={code}
      lang="bash"
    ></HighlightCode>
  );
};

export default AddWorkerCommand;
