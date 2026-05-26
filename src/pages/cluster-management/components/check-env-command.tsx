import { addWorkerGuide } from '@/pages/resources/config';
import { HighlightCode } from '@gpustack/core-ui';
import React from 'react';
import { ProviderType } from '../config';

type ViewModalProps = {
  provider: ProviderType;
  currentGPU: string;
  // When multiple vendors are selected (K8s multi-vendor register flow),
  // we emit one check command per vendor so the user can verify each
  // runtimeclass is registered.
  currentGPUs?: string[];
};

const AddWorkerCommand: React.FC<ViewModalProps> = ({
  provider = '',
  currentGPU,
  currentGPUs
}) => {
  const code = React.useMemo(() => {
    const configs = addWorkerGuide['all'];
    const keys =
      currentGPUs && currentGPUs.length > 0
        ? currentGPUs
        : currentGPU
          ? [currentGPU]
          : [];
    if (!keys.length) return '';
    const lines = keys
      .map((k) => configs.checkEnvCommand(k)?.[provider || ''])
      .filter((cmd): cmd is string => !!cmd);
    return lines.join('\n');
  }, [provider, currentGPU, currentGPUs]);

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
