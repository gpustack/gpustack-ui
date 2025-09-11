import { useIntl } from '@umijs/max';
import React from 'react';
import styled from 'styled-components';
import { ProviderType, ProviderValueMap } from '../config';
import AddWorkerCommand from './add-worker-command';
import RegisterClusterInner from './register-cluster-inner';
import SupportedHardware from './support-hardware';

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
`;

type AddModalProps = {
  provider: ProviderType;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
  };
};
const AddWorkerStep: React.FC<AddModalProps> = ({
  provider,
  registrationInfo
}) => {
  const intl = useIntl();
  return (
    <div>
      <Title>{intl.formatMessage({ id: 'clusters.create.execCommand' })}</Title>
      {provider === ProviderValueMap.Kubernetes ? (
        <RegisterClusterInner registrationInfo={registrationInfo} />
      ) : (
        <AddWorkerCommand registrationInfo={registrationInfo} />
      )}
      <Title style={{ marginTop: 32 }}>
        {intl.formatMessage({ id: 'clusters.create.supportedGpu' })}
      </Title>
      <SupportedHardware />
    </div>
  );
};

export default AddWorkerStep;
