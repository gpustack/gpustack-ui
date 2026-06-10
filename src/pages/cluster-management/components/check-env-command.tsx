import { addWorkerGuide } from '@/pages/resources/config';
import { HighlightCode } from '@gpustack/core-ui';
import React from 'react';
import { ProviderType, ProviderValueMap } from '../config';

// CPU-only (no GPU vendor selected) check for Kubernetes: verify at least one
// ready node exists in the target cluster.
const K8S_CPU_ONLY_CHECK =
  'kubectl get nodes -o jsonpath=\'{.items[*].status.conditions[?(@.type=="Ready")].status}\' 2>/dev/null | grep -q "True" && echo "Ready nodes found. You are registering a CPU-only cluster." || (echo "No ready nodes found"; exit 1)';

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

    // CPU-only K8s flow: no GPU vendor selected, check for ready nodes instead.
    if (!keys.length && provider === ProviderValueMap.Kubernetes) {
      return K8S_CPU_ONLY_CHECK;
    }

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
