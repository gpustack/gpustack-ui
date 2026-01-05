import HighlightCode from '@/components/highlight-code';
import React, { useMemo } from 'react';
import { generateRegisterCommand } from '../config';

type AddModalProps = {
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
  };
};
const AddCluster: React.FC<AddModalProps> = ({ registrationInfo }) => {
  const code = useMemo(() => {
    return generateRegisterCommand({
      server: registrationInfo?.server_url || window.location.origin,
      clusterId: registrationInfo?.cluster_id,
      registrationToken: registrationInfo?.token
    });
  }, [registrationInfo]);

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
