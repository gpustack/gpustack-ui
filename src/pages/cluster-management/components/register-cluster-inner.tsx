import HighlightCode from '@/components/highlight-code';
import React, { useMemo } from 'react';
import { generateK8sRegisterCommand } from '../config';

type AddModalProps = {
  currentGPU?: string;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
  };
};
const AddCluster: React.FC<AddModalProps> = ({
  registrationInfo,
  currentGPU
}) => {
  const code = useMemo(() => {
    return generateK8sRegisterCommand({
      server: registrationInfo?.server_url || window.location.origin,
      clusterId: registrationInfo?.cluster_id,
      registrationToken: registrationInfo?.token,
      currentGPU
    });
  }, [registrationInfo, currentGPU]);

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
