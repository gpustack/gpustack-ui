import { HighlightCode } from '@gpustack/core-ui';
import React, { useMemo } from 'react';
import { generateK8sRegisterCommand } from '../config';

type AddModalProps = {
  currentGPU?: string;
  currentGPUs?: string[];
  // Adds `disable_cpu_worker=true`, dropping the CPU worker DaemonSet from the
  // rendered manifest.
  disableCpuWorker?: boolean;
  // Off while the selection would deploy no worker at all, so the command
  // can be read but not taken away.
  copyable?: boolean;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
  };
};
const AddCluster: React.FC<AddModalProps> = ({
  registrationInfo,
  currentGPU,
  currentGPUs,
  disableCpuWorker,
  copyable = true
}) => {
  const code = useMemo(() => {
    return generateK8sRegisterCommand({
      server: registrationInfo?.server_url || window.location.origin,
      clusterId: registrationInfo?.cluster_id,
      registrationToken: registrationInfo?.token,
      currentGPU,
      currentGPUs,
      disableCpuWorker
    });
  }, [registrationInfo, currentGPU, currentGPUs, disableCpuWorker]);

  return (
    <div>
      <HighlightCode
        theme="dark"
        code={code.replace(/\\/g, '')}
        copyValue={code}
        copyable={copyable}
        lang="bash"
      ></HighlightCode>
    </div>
  );
};

export default AddCluster;
