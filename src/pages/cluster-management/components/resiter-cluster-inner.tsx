import HighlightCode from '@/components/highlight-code';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { generateRegisterCommand } from '../config';

const Title = styled.h3`
  font-weight: 600;
  color: var(--ant-color-text);
  margin-bottom: 12px;
  margin-top: 12px;
  font-size: var(--font-size-normal);
  .ant-tag {
    color: var(--ant-color-text-secondary);
    font-weight: 400;
  }
`;

type AddModalProps = {
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
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

  const applyCommand = useMemo(() => {
    return `kubectl apply -f manifest.yaml`;
  }, []);

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
