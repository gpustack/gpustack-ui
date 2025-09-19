import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { ProviderType, ProviderValueMap } from '../config';
import AddWorkerCommand from './add-worker-command';
import CheckEnvCommand from './check-env-command';
import RegisterClusterInner from './register-cluster-inner';
import SupportedGPUs from './support-gpus';

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const Line = styled.div`
  position: relative;
  margin: 24px 0;
  width: 100%;
  border-top: 1px solid var(--ant-color-border);
  &::before {
    content: '';
    position: absolute;
    top: -9px;
    left: 24px;
    width: 16px;
    height: 16px;
    transform: rotate(45deg);
    background-color: var(--ant-color-bg-container);
    border-top: 1px solid var(--ant-color-border);
    border-left: 1px solid var(--ant-color-border);
  }
`;

const Container = styled.div`
  width: 800px;
  margin: 0 auto;
  .command-info {
    margin-top: 24px;
    margin-bottom: 8px;
    color: var(--ant-color-text-secondary);
  }
`;

const Content = styled.div`
  margin-top: 24px;
  margin-bottom: 16px;
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
  const [currentGPU, setCurrentGPU] = React.useState<string>('cuda');
  React.useState<string>('cuda');
  const [workerCommand, setWorkerCommand] = React.useState<Record<string, any>>(
    {
      label: 'NVIDIA',
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#nvidia-cuda'
    }
  );

  const handleSelectProvider = (value: string, item: any) => {
    if (provider !== ProviderValueMap.Docker) return;
    setCurrentGPU(value);
    setWorkerCommand(item);
  };

  return (
    <Container>
      <Title>
        {intl.formatMessage({ id: 'clusters.create.supportedGpu' })}
      </Title>
      <SupportedGPUs
        onSelect={handleSelectProvider}
        current={currentGPU}
        clickable={true}
      />

      <Content>
        <Line></Line>
        <Alert
          type="info"
          showIcon
          icon={<BulbOutlined />}
          message={
            <span
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage(
                  { id: 'clusters.create.addworker.tips' },
                  { label: workerCommand.label, link: workerCommand.link }
                )
              }}
            ></span>
          }
        ></Alert>
      </Content>

      <div className="command-info">
        1. {intl.formatMessage({ id: 'cluster.create.checkEnv.tips' })}
      </div>
      <CheckEnvCommand provider={provider} currentGPU={currentGPU} />
      <div className="command-info">
        2. {intl.formatMessage({ id: 'clusters.create.addCommand.tips' })}
      </div>
      {provider === ProviderValueMap.Kubernetes ? (
        <RegisterClusterInner registrationInfo={registrationInfo} />
      ) : (
        <AddWorkerCommand registrationInfo={registrationInfo} />
      )}
    </Container>
  );
};

export default AddWorkerStep;
