import React from 'react';
import styled from 'styled-components';
import RegisterClusterInner from './register-cluster-inner';
import SupportedHardware from './support-hardware';

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
`;

type AddModalProps = {
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
  };
};
const AddWorkerStep: React.FC<AddModalProps> = ({ registrationInfo }) => {
  return (
    <div>
      <Title>Supported Hardware Platforms</Title>
      <SupportedHardware />
      <Title style={{ marginTop: 32 }}>Execute Command</Title>
      <RegisterClusterInner registrationInfo={registrationInfo} />
    </div>
  );
};

export default AddWorkerStep;
