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
  const code = React.useMemo(() => {
    const command = addWorkerGuide['cuda'];
    return command.checkEnvCommand[provider || ''];
  }, [provider]);

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
