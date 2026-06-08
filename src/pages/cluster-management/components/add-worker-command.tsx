import { addWorkerGuide } from '@/pages/resources/config';
import { HighlightCode } from '@gpustack/core-ui';
import React from 'react';

type ViewModalProps = {
  currentGPU?: string;
  workerIP?: string;
  modelDir?: string;
  cacheDir?: string;
  containerName?: string;
  gpustackDataVolume?: string;
  advertisAddress?: string;
  dtkVersion?: string;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    [key: string]: any;
  };
};

const AddWorkerCommand: React.FC<ViewModalProps> = ({
  registrationInfo,
  advertisAddress,
  workerIP,
  modelDir,
  cacheDir,
  currentGPU,
  containerName,
  gpustackDataVolume,
  dtkVersion
}) => {
  const code = React.useMemo(() => {
    const commandCode = addWorkerGuide['all'];
    return commandCode
      ?.registerWorker({
        registrationInfo,
        gpu: currentGPU || '',
        server: registrationInfo.server_url || origin,
        tag: '',
        advertisAddress: advertisAddress,
        workerIP: workerIP,
        modelDir: modelDir,
        cacheDir: cacheDir,
        containerName: containerName,
        gpustackDataVolume: gpustackDataVolume,
        dtkVersion: dtkVersion,
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
    gpustackDataVolume,
    advertisAddress,
    dtkVersion
  ]);

  return (
    <HighlightCode
      theme="dark"
      code={code}
      copyValue={code}
      lang="bash"
      xScrollable={true}
    ></HighlightCode>
  );
};

export default AddWorkerCommand;
