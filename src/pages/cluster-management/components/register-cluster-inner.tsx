import { EXTERNAL_BASE_URL } from '@/config/settings';
import { HighlightCode } from '@gpustack/core-ui';
import React, { useMemo } from 'react';
import { generateK8sRegisterCommand } from '../config';

type AddModalProps = {
  currentGPU?: string;
  currentGPUs?: string[];
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
  currentGPUs
}) => {
  const code = useMemo(() => {
    return generateK8sRegisterCommand({
      // Falls back to the browser's view of the server, prefix included, when the
      // server has no `server_external_url` configured to hand us.
      server: registrationInfo?.server_url || EXTERNAL_BASE_URL,
      clusterId: registrationInfo?.cluster_id,
      registrationToken: registrationInfo?.token,
      currentGPU,
      currentGPUs
    });
  }, [registrationInfo, currentGPU, currentGPUs]);

  return (
    <div>
      <HighlightCode
        theme="dark"
        code={code.replace(/\\/g, '')}
        copyValue={code}
        lang="bash"
      ></HighlightCode>
    </div>
  );
};

export default AddCluster;
