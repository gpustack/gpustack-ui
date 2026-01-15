import HighlightCode from '@/components/highlight-code';
import { addWorkerGuide } from '@/pages/resources/config';
import React from 'react';
import { ProviderType } from '../config';

type ViewModalProps = {
  provider: ProviderType;
  currentGPU: string;
};

const AddWorkerCommand: React.FC<ViewModalProps> = ({
  provider = '',
  currentGPU
}) => {
  console.log('check env command provider:', currentGPU);
  const code = React.useMemo(() => {
    const configs = addWorkerGuide['all'];
    const command = configs.checkEnvCommand(currentGPU);
    return command[provider || ''];
  }, [provider, currentGPU]);

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
