import HighlightCode from '@/components/highlight-code';
import { addWorkerGuide } from '@/pages/resources/config';
import React from 'react';

type ViewModalProps = {
  currentGPU?: string;
  workerIP?: string;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
  };
};

const AddWorkerCommand: React.FC<ViewModalProps> = ({
  registrationInfo,
  workerIP,
  currentGPU
}) => {
  const code = React.useMemo(() => {
    const commandCode = addWorkerGuide['all'];
    return commandCode?.registerWorker({
      gpu: currentGPU || '',
      server: registrationInfo.server_url || origin,
      tag: '',
      workerIP: '${WORKER_IP}',
      image: registrationInfo.image,
      token: registrationInfo.token || '${token}'
    });
  }, [registrationInfo, currentGPU, workerIP]);

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
